// One-off migration: convert numeric-ID cover cache → key-based cache (artist|title).
// Reconstructs the OLD id→(artist,title) mapping (pre raw-5, pre Electronic cap) to preserve fetched covers.
import { raw1 } from "../src/data/raw-1";
import { raw2 } from "../src/data/raw-2";
import { raw3 } from "../src/data/raw-3";
import { raw4 } from "../src/data/raw-4";
import { readFileSync, writeFileSync, existsSync } from "fs";

const oldRaw = [...raw1, ...raw2, ...raw3, ...raw4];

// Replicate the OLD albums.ts logic (no raw5, no electronic cap, no female vocalist).
function normalizeTitle(t: string) {
  return t.replace(/\s*\(revisit\)\s*$/i, "").trim();
}
const FORBIDDEN = ["metal","heavy metal","thrash","death metal","black metal","doom metal","sludge","grindcore","country","country rock","country pop","alt-country","country soul"];
function isForbidden(genres: string[]) {
  return genres.some((g) => FORBIDDEN.includes(g.toLowerCase()) || g.toLowerCase().includes("metal") || g.toLowerCase() === "country");
}

const seenKeys = new Set<string>();
const perArtist = new Map<string, number>();
const idToKey = new Map<number, string>();
let id = 0;
for (const [artist, title] of oldRaw) {
  const cleanTitle = normalizeTitle(title);
  const artistKey = artist.toLowerCase().trim();
  const titleKey = cleanTitle.toLowerCase().trim();
  const key = `${artistKey}__${titleKey}`;
  if (seenKeys.has(key)) continue;
  seenKeys.add(key);
  const c = perArtist.get(artistKey) ?? 0;
  if (c >= 2) continue;
  perArtist.set(artistKey, c + 1);
  id += 1;
  idToKey.set(id, key);
}

console.log(`Reconstructed old mapping: ${idToKey.size} albums`);

const oldCachePath = "/home/z/my-project/src/data/covers.json";
const newCachePath = "/home/z/my-project/src/data/covers-keyed.json";

type OldEntry = { url: string | null; status: string; cid?: number };
type NewCache = Record<string, OldEntry>;

let oldCache: Record<number, OldEntry> = {};
if (existsSync(oldCachePath)) {
  oldCache = JSON.parse(readFileSync(oldCachePath, "utf-8"));
}

const newCache: NewCache = {};
let migrated = 0;
let lost = 0;
for (const [numId, entry] of Object.entries(oldCache)) {
  const key = idToKey.get(Number(numId));
  if (!key) {
    lost++;
    continue;
  }
  newCache[key] = entry;
  migrated++;
}

writeFileSync(newCachePath, JSON.stringify(newCache, null, 0));
console.log(`Migrated: ${migrated} | lost (no mapping): ${lost} | new cache size: ${Object.keys(newCache).length}`);
