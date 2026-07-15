import { ALBUMS } from "../src/data/albums";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { matchScore, MATCH_THRESHOLD } from "../src/lib/itunes-match";

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

function upgrade(url: string): string {
  return url.replace(/\/\d+x\d+bb\.(jpg|png|webp)$/, "/600x600bb.jpg");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let lastReq = 0;
const GAP_MS = Number(process.env.GAP_MS ?? 1100);
async function gate() {
  const wait = GAP_MS - (Date.now() - lastReq);
  if (wait > 0) await sleep(wait);
  lastReq = Date.now();
}

function clean(s: string): string {
  return s.replace(/\(revisit\)/gi, "").replace(/\(.*?\)/g, "").replace(/["'&]/g, " ").replace(/\s+/g, " ").trim();
}
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const STOP = new Set(["the","and","a","an","of","in","on","for","to","my","is","it","vol","pt","part","ii","iii","ep","lp","deluxe","edition","anniversary","remaster","remix","mix","super","white","album","bsides","b","sides","live","single","demo","demos","sessions","instrumental","karaoke","tribute","various","artists"]);
function tokens(s: string): Set<string> {
  return new Set(
    s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean)
      .filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w))
  );
}

// Score how well a search result matches the query artist + title.
function score(queryArtist: string, queryTitle: string, resArtist: string, resTitle: string): number {
  const qa = tokens(queryArtist);
  const qt = tokens(queryTitle);
  const ra = tokens(resArtist);
  const rt = tokens(resTitle);
  // Artist must overlap at least one significant token.
  const artistOverlap = [...qa].some((t) => ra.has(t));
  if (!artistOverlap) return -1;
  // Title must overlap at least one significant token.
  const titleOverlap = [...qt].some((t) => rt.has(t));
  if (!titleOverlap) return -1;
  let sc = 10;
  const nq = norm(queryTitle);
  const nr = norm(resTitle);
  if (nq === nr) sc += 1000;
  else if (nr.startsWith(nq) || nq.startsWith(nr)) sc += 200;
  else if (nr.includes(nq) || nq.includes(nr)) sc += 50;
  // Penalise variant/compilation markers.
  const lower = resTitle.toLowerCase();
  if (/\b(deluxe|remaster|remix|anniversary|edition|super|live|single|demo|sessions|bsides|b-sides|instrumental|karaoke|tribute|various artists)\b/.test(lower)) sc -= 30;
  // Reward exact artist match.
  if (norm(queryArtist) === norm(resArtist)) sc += 50;
  return sc;
}

type SearchResult = { artistName: string; collectionName: string; artworkUrl100: string; collectionId: number };

async function trySearch(term: string): Promise<{ blocked: boolean; results?: SearchResult[] }> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=album&limit=10`;
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (res.status === 403 || res.status === 429) return { blocked: true };
    if (!res.ok) return { blocked: false, results: [] };
    const json = (await res.json()) as { results?: SearchResult[] };
    return { blocked: false, results: json.results ?? [] };
  } catch {
    return { blocked: false, results: [] };
  } finally {
    clearTimeout(to);
  }
}

async function fetchCover(artist: string, title: string): Promise<{ url: string | null; cid: number | null; blocked: boolean }> {
  const a = clean(artist);
  const t = clean(title);
  const attempts = [`${a} ${t}`, t, a];
  for (const term of attempts) {
    await gate();
    const { blocked, results } = await trySearch(term);
    if (blocked) return { url: null, cid: null, blocked: true };
    if (!results?.length) continue;
    // Use strict matchScore — requires near-exact title match + decent artist overlap.
    let best: { r: SearchResult; sc: number } | null = null;
    for (const r of results) {
      if (!r.artworkUrl100) continue;
      const sc = matchScore(r.artistName, r.collectionName, artist, title);
      if (sc <= 0) continue;
      if (!best || sc > best.sc) best = { r, sc };
    }
    if (best && best.sc >= MATCH_THRESHOLD) {
      return { url: upgrade(best.r.artworkUrl100), cid: best.r.collectionId, blocked: false };
    }
    // No result met the threshold — try next search term.
  }
  // No strict match found — return null so MB fallback can try, and so we don't
  // store a wrong cover (e.g. "Currents B-Sides" instead of "Currents").
  return { url: null, cid: null, blocked: false };
}

const REVERIFY = process.env.REVERIFY === "1";
// When re-verifying, track which keys we've already re-checked so we can resume.
const reverifyDonePath = "src/data/reverify-done.json";
let reverifyDone = new Set<string>();
if (REVERIFY && existsSync(reverifyDonePath)) {
  try { reverifyDone = new Set(JSON.parse(readFileSync(reverifyDonePath, "utf-8"))); } catch {}
}
const todo = REVERIFY
  ? ALBUMS.filter((a) => {
      const k = keyOf(a.artist, a.title);
      return !reverifyDone.has(k);
    })
  : ALBUMS.filter((a) => {
      const k = keyOf(a.artist, a.title);
      return !cache[k]?.url;
    });
console.log(`Total: ${ALBUMS.length} | reverify: ${REVERIFY} | reverify-done: ${reverifyDone.size} | to fetch: ${todo.length}`);

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
    const k = keyOf(album.artist, album.title);
    const { url, cid, blocked } = await fetchCover(album.artist, album.title);
    cache[k] = { url, status: url ? "ok" : blocked ? "blocked" : "miss", cid: cid ?? undefined };
    if (REVERIFY) {
      reverifyDone.add(k);
    }
    if (blocked) {
      blockedStreak++;
      if (blockedStreak > 10) { await sleep(10000); blockedStreak = 0; }
    } else blockedStreak = 0;
    done++;
    if (done % 20 === 0) {
      const ok = Object.values(cache).filter((c) => c.url).length;
      const elapsed = ((Date.now() - start) / 1000).toFixed(0);
      console.log(`  ${done}/${todo.length} | ok: ${ok} | ${elapsed}s`);
      writeFileSync(cachePath, JSON.stringify(cache));
      if (REVERIFY) writeFileSync(reverifyDonePath, JSON.stringify([...reverifyDone]));
    }
    if (BUDGET_MS && Date.now() - start > BUDGET_MS) { timeUp = true; return; }
  }
}

const idx = { i: 0 };
const queue = () => (idx.i < todo.length ? todo[idx.i++] : undefined);
await worker(queue);

writeFileSync(cachePath, JSON.stringify(cache, null, 0));
if (REVERIFY) writeFileSync(reverifyDonePath, JSON.stringify([...reverifyDone]));
const ok = Object.values(cache).filter((c) => c.url).length;
console.log(`DONE${timeUp ? " (time budget)" : ""}. ok: ${ok}/${ALBUMS.length}`);
