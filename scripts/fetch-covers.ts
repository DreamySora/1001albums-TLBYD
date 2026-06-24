import { ALBUMS } from "../src/data/albums";
import { writeFileSync, readFileSync, existsSync } from "fs";

const cachePath = "/home/z/my-project/src/data/covers.json";
type Cache = Record<number, { url: string | null; status: string }>;
let cache: Cache = {};
if (existsSync(cachePath)) {
  try {
    cache = JSON.parse(readFileSync(cachePath, "utf-8")) as Cache;
  } catch {
    cache = {};
  }
}

function upgrade(url: string): string {
  return url.replace(/\/\d+x\d+bb\.(jpg|png)$/, "/600x600bb.$1");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Global rate limiter: ensure at least `gapMs` between request starts.
let lastReq = 0;
const GAP_MS = 350; // ~170 req/min ceiling
async function gate() {
  const now = Date.now();
  const wait = GAP_MS - (now - lastReq);
  if (wait > 0) await sleep(wait);
  lastReq = Date.now();
}

async function fetchCover(artist: string, title: string): Promise<{ url: string | null; blocked: boolean }> {
  const term = encodeURIComponent(`${artist} ${title}`);
  const url = `https://itunes.apple.com/search?term=${term}&entity=album&limit=4`;
  for (let attempt = 0; attempt < 3; attempt++) {
    await gate();
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (res.status === 403 || res.status === 429) {
        // rate limited — back off hard
        await sleep(3000 * (attempt + 1));
        continue;
      }
      if (!res.ok) {
        await sleep(1500 * (attempt + 1));
        continue;
      }
      const json = (await res.json()) as { results?: { artistName: string; collectionName: string; artworkUrl100: string }[] };
      if (!json.results?.length) return { url: null, blocked: false };
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      const wantTitle = norm(title);
      const wantArtist = norm(artist);
      let best = json.results.find((r) => norm(r.collectionName) === wantTitle && norm(r.artistName).includes(wantArtist.slice(0, 6)));
      if (!best) best = json.results.find((r) => norm(r.collectionName).includes(wantTitle.slice(0, 6)));
      if (!best) best = json.results[0];
      if (!best.artworkUrl100) return { url: null, blocked: false };
      return { url: upgrade(best.artworkUrl100), blocked: false };
    } catch {
      await sleep(1500 * (attempt + 1));
    } finally {
      clearTimeout(to);
    }
  }
  return { url: null, blocked: true };
}

const CONCURRENCY = 2;
// Re-queue entries previously marked "miss" so retries can recover rate-limited ones.
const todo = ALBUMS.filter((a) => cache[a.id] === undefined || cache[a.id].url === null);
console.log(`Total albums: ${ALBUMS.length}, already ok: ${ALBUMS.length - todo.length}, to fetch/retry: ${todo.length}`);

let done = 0;
let blockedStreak = 0;
const start = Date.now();

async function worker(queue: () => (typeof todo)[number] | undefined) {
  while (true) {
    const album = queue();
    if (!album) return;
    const { url, blocked } = await fetchCover(album.artist, album.title);
    cache[album.id] = { url, status: url ? "ok" : blocked ? "blocked" : "miss" };
    if (blocked) {
      blockedStreak++;
      if (blockedStreak > 25) {
        console.log(`  too many blocked in a row — pausing 15s`);
        await sleep(15000);
        blockedStreak = 0;
      }
    } else {
      blockedStreak = 0;
    }
    done++;
    if (done % 20 === 0) {
      const ok = Object.values(cache).filter((c) => c.url).length;
      const elapsed = ((Date.now() - start) / 1000).toFixed(0);
      console.log(`  ${done}/${todo.length} done | covers ok: ${ok} | ${elapsed}s`);
      writeFileSync(cachePath, JSON.stringify(cache));
    }
  }
}

const idx = { i: 0 };
const queue = () => (idx.i < todo.length ? todo[idx.i++] : undefined);

await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

writeFileSync(cachePath, JSON.stringify(cache, null, 2));
const ok = Object.values(cache).filter((c) => c.url).length;
const miss = Object.values(cache).filter((c) => !c.url).length;
console.log(`DONE. covers ok: ${ok}, miss: ${miss}, total: ${ALBUMS.length}`);
