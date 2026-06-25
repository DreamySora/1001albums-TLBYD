import { ALBUMS } from "../src/data/albums";
import { writeFileSync, readFileSync, existsSync } from "fs";

const cachePath = "/home/z/my-project/src/data/covers-keyed.json";
type CacheEntry = { url: string | null; status: string; cid?: number };
type Cache = Record<string, CacheEntry>;
let cache: Cache = {};
if (existsSync(cachePath)) {
  try {
    cache = JSON.parse(readFileSync(cachePath, "utf-8")) as Cache;
  } catch {
    cache = {};
  }
}

function keyOf(artist: string, title: string): string {
  return `${artist.toLowerCase().trim()}__${title.toLowerCase().trim()}`;
}

function upgrade(url: string): string {
  return url.replace(/\/\d+x\d+bb\.(jpg|png|webp)$/, "/600x600bb.jpg");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let lastReq = 0;
const GAP_MS = Number(process.env.GAP_MS ?? 650);
async function gate() {
  const now = Date.now();
  const wait = GAP_MS - (now - lastReq);
  if (wait > 0) await sleep(wait);
  lastReq = Date.now();
}

function clean(s: string): string {
  return s
    .replace(/\(revisit\)/gi, "")
    .replace(/\(.*?\)/g, "")
    .replace(/[“”"’‘]/g, "")
    .replace(/&/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function trySearch(term: string): Promise<{ cid?: number; url?: string } | null | undefined> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=album&limit=5`;
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (res.status === 403 || res.status === 429) return undefined; // blocked — skip retries
    if (!res.ok) return null;
    const json = (await res.json()) as {
      results?: { artistName: string; collectionName: string; artworkUrl100: string; collectionId: number }[];
    };
    if (!json.results?.length) return null;
    const r = json.results[0];
    return { cid: r.collectionId, url: r.artworkUrl100 };
  } catch {
    return null;
  } finally {
    clearTimeout(to);
  }
}

async function fetchCover(artist: string, title: string): Promise<{ url: string | null; cid: number | null; blocked: boolean }> {
  const a = clean(artist);
  const t = clean(title);
  const attempts = [`${a} ${t}`, t];
  for (const term of attempts) {
    await gate();
    const r = await trySearch(term);
    if (r === undefined) return { url: null, cid: null, blocked: true }; // 403 — stop this album
    if (r === null) continue;
    if (!r.url) return { url: null, cid: null, blocked: false };
    return { url: upgrade(r.url), cid: r.cid ?? null, blocked: false };
  }
  return { url: null, cid: null, blocked: false };
}

const CONCURRENCY = 1;
const todo = ALBUMS.filter((a) => {
  const k = keyOf(a.artist, a.title);
  const e = cache[k];
  return e === undefined || (!e.url && e.status !== "blocked");
});
console.log(`Total: ${ALBUMS.length} | cached ok: ${ALBUMS.length - todo.length} | to fetch/retry: ${todo.length}`);

const BUDGET_MS = Number(process.env.BUDGET_MS ?? 0) || 0;
const start = Date.now();
let timeUp = false;
let done = 0;
let blockedStreak = 0;

async function worker(queue: () => (typeof todo)[number] | undefined) {
  while (true) {
    if (timeUp) return;
    const album = queue();
    if (!album) return;
    const { url, cid, blocked } = await fetchCover(album.artist, album.title);
    cache[keyOf(album.artist, album.title)] = { url, status: url ? "ok" : blocked ? "blocked" : "miss", cid: cid ?? undefined };
    if (blocked) {
      blockedStreak++;
      if (blockedStreak > 12) {
        console.log(`  blocked streak — pausing 10s`);
        await sleep(10000);
        blockedStreak = 0;
      }
    } else blockedStreak = 0;
    done++;
    if (done % 20 === 0) {
      const ok = Object.values(cache).filter((c) => c.url).length;
      const elapsed = ((Date.now() - start) / 1000).toFixed(0);
      console.log(`  ${done}/${todo.length} | ok: ${ok} | ${elapsed}s`);
      writeFileSync(cachePath, JSON.stringify(cache));
    }
    if (BUDGET_MS && Date.now() - start > BUDGET_MS) {
      timeUp = true;
      return;
    }
  }
}

const idx = { i: 0 };
const queue = () => (idx.i < todo.length ? todo[idx.i++] : undefined);

await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

writeFileSync(cachePath, JSON.stringify(cache, null, 0));
const ok = Object.values(cache).filter((c) => c.url).length;
const miss = Object.values(cache).filter((c) => !c.url).length;
const withCid = Object.values(cache).filter((c) => c.cid).length;
console.log(`DONE${timeUp ? " (time budget)" : ""}. ok: ${ok}, miss: ${miss}, withCid: ${withCid}, total: ${ALBUMS.length}`);
