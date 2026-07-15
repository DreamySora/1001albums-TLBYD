import { ALBUMS } from "../src/data/albums";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { matchScore, MATCH_THRESHOLD } from "../src/lib/itunes-match";

// Discogs cover-fetch script — recovers covers missing from iTunes + MusicBrainz.
// Discogs API: https://www.discogs.com/developers (no token needed, rate-limited).
const cachePath = "src/data/covers-keyed.json";
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

// Discogs rate limit: ~60 req/min without token, ~2400/min with token.
// We gate at ~1 req/sec to be safe.
let lastReq = 0;
const GAP_MS = 1100;
async function gate() {
  const wait = GAP_MS - (Date.now() - lastReq);
  if (wait > 0) await sleep(wait);
  lastReq = Date.now();
}

const UA = "1001Albums/1.0 (curated music archive; contact: crate@digger.example)";

function clean(s: string): string {
  return s.replace(/\(revisit\)/gi, "").replace(/\(.*?\)/g, "").replace(/["'&]/g, " ").replace(/\s+/g, " ").trim();
}

type DiscogsResult = { id: number; title: string; year: number; cover_image: string; thumb: string };

async function searchDiscogs(artist: string, title: string): Promise<{ id: number; cover: string } | null> {
  const q = encodeURIComponent(`${artist} ${title}`);
  const url = `https://api.discogs.com/database/search?q=${q}&type=release&per_page=8`;
  await gate();
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 12000);
  let bestId: number | null = null;
  let bestCover: string | null = null;
  let bestSc = 0;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: ctrl.signal });
    if (res.status === 429) return null;
    if (!res.ok) return null;
    const json = (await res.json()) as { results?: DiscogsResult[] };
    if (!json.results?.length) return null;
    const wantArtist = artist.toLowerCase().replace(/[^a-z0-9]/g, "");
    const wantTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const r of json.results) {
      const parts = r.title.split(" - ");
      if (parts.length < 2) continue;
      const rArtist = parts[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      const rTitle = parts.slice(1).join(" - ").toLowerCase().replace(/[^a-z0-9]/g, "");
      let sc = 0;
      if (rTitle === wantTitle) sc += 100;
      else if (rTitle.startsWith(wantTitle) || wantTitle.startsWith(rTitle)) sc += 80;
      else if (rTitle.includes(wantTitle) || wantTitle.includes(rTitle)) sc += 50;
      if (rArtist === wantArtist) sc += 50;
      else if (rArtist.includes(wantArtist) || wantArtist.includes(rArtist)) sc += 30;
      if (sc > bestSc) {
        bestSc = sc;
        bestId = r.id;
        const cover = r.cover_image || r.thumb;
        bestCover = cover && !cover.includes("spacer.gif") ? cover : null;
      }
    }
  } catch {
    return null;
  } finally {
    clearTimeout(to);
  }
  if (!bestId || bestSc < 80) return null;
  // If search result had no cover, fetch release detail for images.
  if (!bestCover) {
    await gate();
    const detCtrl = new AbortController();
    const detTo = setTimeout(() => detCtrl.abort(), 12000);
    try {
      const detRes = await fetch(`https://api.discogs.com/releases/${bestId}`, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: detCtrl.signal });
      if (detRes.ok) {
        const detJson = (await detRes.json()) as { images?: { uri: string; type: string }[] };
        const primary = detJson.images?.find((i) => i.type === "primary") ?? detJson.images?.[0];
        if (primary?.uri) bestCover = primary.uri;
      }
    } catch {
      // ignore
    } finally {
      clearTimeout(detTo);
    }
  }
  return bestCover ? { id: bestId, cover: bestCover } : null;
}

const CONCURRENCY = 1; // Discogs rate limit — single worker
const todo = ALBUMS.filter((a) => !cache[keyOf(a.artist, a.title)]?.url);
console.log(`Total: ${ALBUMS.length} | with cover: ${ALBUMS.length - todo.length} | to fetch (Discogs): ${todo.length}`);

const BUDGET_MS = Number(process.env.BUDGET_MS ?? 0) || 0;
const start = Date.now();
let timeUp = false;
let done = 0;
let recovered = 0;

async function worker(queue: () => (typeof todo)[number] | undefined) {
  while (true) {
    if (timeUp) return;
    const album = queue();
    if (!album) return;
    const k = keyOf(album.artist, album.title);
    const result = await searchDiscogs(album.artist, album.title);
    if (result) {
      cache[k] = { url: result.cover, status: "ok-discogs", cid: cache[k]?.cid };
      recovered++;
    } else {
      // keep existing entry, just mark as miss-discogs (so we don't retry Discogs again)
      cache[k] = { url: cache[k]?.url ?? null, status: "miss-discogs", cid: cache[k]?.cid };
    }
    done++;
    if (done % 10 === 0) {
      const ok = ALBUMS.filter((a) => cache[keyOf(a.artist, a.title)]?.url).length;
      const elapsed = ((Date.now() - start) / 1000).toFixed(0);
      console.log(`  ${done}/${todo.length} | recovered: ${recovered} | total covers: ${ok} | ${elapsed}s`);
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
await worker(queue);

writeFileSync(cachePath, JSON.stringify(cache, null, 0));
const ok = ALBUMS.filter((a) => cache[keyOf(a.artist, a.title)]?.url).length;
console.log(`DONE${timeUp ? " (time budget)" : ""}. total covers: ${ok}/${ALBUMS.length} | recovered by Discogs: ${recovered}`);
