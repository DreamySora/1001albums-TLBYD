import { ALBUMS } from "../src/data/albums";
import { writeFileSync, readFileSync, existsSync } from "fs";

// Fetch missing covers from MusicBrainz + Cover Art Archive (iTunes is 403-blocked).
const cachePath = "/home/z/my-project/src/data/covers-keyed.json";
type CacheEntry = { url: string | null; status: string; cid?: number };
type Cache = Record<string, CacheEntry>;
let cache: Cache = {};
if (existsSync(cachePath)) {
  cache = JSON.parse(readFileSync(cachePath, "utf-8")) as Cache;
}

function keyOf(artist: string, title: string): string {
  return `${artist.toLowerCase().trim()}__${title.toLowerCase().trim()}`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const UA = "1001Albums/1.0 (curated music archive; contact: crate@digger.example)";

// MusicBrainz asks for ≤1 req/sec. We'll gate at ~1.1s.
let lastMB = 0;
async function gateMB() {
  const wait = 1100 - (Date.now() - lastMB);
  if (wait > 0) await sleep(wait);
  lastMB = Date.now();
}

function clean(s: string): string {
  return s.replace(/\(revisit\)/gi, "").replace(/\(.*?\)/g, "").replace(/["'&]/g, " ").replace(/\s+/g, " ").trim();
}

async function searchMBRelease(artist: string, title: string): Promise<string | null> {
  const q = `release:"${clean(title)}" AND artist:"${clean(artist)}"`;
  const url = `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(q)}&fmt=json&limit=5`;
  await gateMB();
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: ctrl.signal });
    if (!res.ok) return null;
    const json = (await res.json()) as { releases?: { id: string; title: string; "artist-credit"?: { name?: string }[] }[] };
    if (!json.releases?.length) return null;
    // Pick the release whose title best matches (prefer exact, then prefix).
    const want = title.toLowerCase().replace(/[^a-z0-9]/g, "");
    let best: { id: string; score: number } | null = null;
    for (const r of json.releases.slice(0, 8)) {
      const got = (r.title ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
      let s = 0;
      if (got === want) s = 100;
      else if (got.startsWith(want) || want.startsWith(got)) s = 80;
      else if (got.includes(want) || want.includes(got)) s = 50;
      if (s > (best?.score ?? 0)) best = { id: r.id, score: s };
    }
    return best && best.score >= 50 ? best.id : json.releases[0]?.id ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(to);
  }
}

async function fetchCoverArt(mbid: string): Promise<string | null> {
  // Cover Art Archive: /release/{mbid}/front-500 returns 307 redirect to the image.
  const url = `https://coverartarchive.org/release/${mbid}/front-500`;
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow", signal: ctrl.signal });
    if (res.ok && res.url) return res.url;
  } catch {
    // fall through to release-group attempt
  } finally {
    clearTimeout(to);
  }
  // Fallback: try release-group cover art.
  const rgUrl = `https://coverartarchive.org/release-group/${mbid}/front-500`;
  const ctrl2 = new AbortController();
  const to2 = setTimeout(() => ctrl2.abort(), 12000);
  try {
    const res2 = await fetch(rgUrl, { method: "GET", redirect: "follow", signal: ctrl2.signal });
    if (res2.ok && res2.url) return res2.url;
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(to2);
  }
}

async function fetchCover(artist: string, title: string): Promise<string | null> {
  const mbid = await searchMBRelease(artist, title);
  if (!mbid) return null;
  // small polite delay before hitting CAA
  await sleep(200);
  return fetchCoverArt(mbid);
}

const todo = ALBUMS.filter((a) => {
  const k = keyOf(a.artist, a.title);
  const e = cache[k];
  return !e?.url;
});
console.log(`Total: ${ALBUMS.length} | with cover: ${ALBUMS.length - todo.length} | to fetch (MB): ${todo.length}`);

const BUDGET_MS = Number(process.env.BUDGET_MS ?? 0) || 0;
const start = Date.now();
let timeUp = false;
let done = 0;

async function worker(queue: () => (typeof todo)[number] | undefined) {
  while (true) {
    if (timeUp) return;
    const album = queue();
    if (!album) return;
    const url = await fetchCover(album.artist, album.title);
    const k = keyOf(album.artist, album.title);
    const existing = cache[k];
    cache[k] = { url, status: url ? "ok" : existing?.status === "miss" ? "miss" : "miss", cid: existing?.cid };
    done++;
    if (done % 10 === 0) {
      const ok = Object.values(cache).filter((c) => c.url).length;
      const albumOk = ALBUMS.filter((a) => cache[keyOf(a.artist, a.title)]?.url).length;
      const elapsed = ((Date.now() - start) / 1000).toFixed(0);
      console.log(`  ${done}/${todo.length} | cache ok: ${ok} | albums w/ cover: ${albumOk} | ${elapsed}s`);
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

// Single worker — MB rate limit is 1 req/sec, so concurrency >1 is counterproductive.
await worker(queue);

writeFileSync(cachePath, JSON.stringify(cache, null, 0));
const albumOk = ALBUMS.filter((a) => cache[keyOf(a.artist, a.title)]?.url).length;
console.log(`DONE${timeUp ? " (time budget)" : ""}. albums w/ cover: ${albumOk}/${ALBUMS.length}`);
