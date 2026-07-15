import { raw1 } from "./raw-1";
import { raw2 } from "./raw-2";
import { raw3 } from "./raw-3";
import { raw4 } from "./raw-4";
import { raw5 } from "./raw-5";
import { raw6 } from "./raw-6";
import { raw7 } from "./raw-7";
import coversCache from "./covers-keyed.json";

export type Album = {
  id: number;
  artist: string;
  title: string;
  year: number;
  genres: string[];
  duration: number; // minutes
  description: string;
  cover: string | null; // iTunes artwork URL (600x600) or null
  collectionId: number | null; // iTunes collectionId for tracklist lookup
};

const allRaw = [...raw1, ...raw2, ...raw3, ...raw4, ...raw5, ...raw6, ...raw7];
const covers = coversCache as Record<string, { url: string | null; status: string; cid?: number }>;

function coverKey(artist: string, title: string): string {
  return `${artist.toLowerCase().trim()}__${title.toLowerCase().trim()}`;
}

// Normalize a title: strip trailing " (revisit)" / "(revisit)" markers we used as placeholders.
function normalizeTitle(t: string): string {
  return t.replace(/\s*\(revisit\)\s*$/i, "").trim();
}

// Soft genre guard: drop entries whose genres scream Metal / Country / EDM / Dubstep / Hardcore
// / overly-experimental-rock (per user request — these genres are excluded from the crate).
const FORBIDDEN_EXACT = [
  "metal", "heavy metal", "thrash", "death metal", "black metal", "doom metal", "sludge", "grindcore",
  "country", "country rock", "country pop", "alt-country", "country soul",
  "edm", "dubstep", "hardcore", "happy hardcore", "uk hardcore", "frenchcore",
  "krautrock",
];

function isForbidden(genres: string[]): boolean {
  const lower = genres.map((g) => g.toLowerCase());
  return lower.some(
    (g) =>
      FORBIDDEN_EXACT.includes(g) ||
      g.includes("metal") ||
      g === "country" ||
      g === "edm" ||
      g === "dubstep" ||
      g === "hardcore"
  );
}

// Female-fronted artists — used to add the "Female Vocalist" genre tag.
// Solos female artists + female-fronted bands.
import { FEMALE_ARTISTS } from "./female-set";

// Cap for albums tagged "Electronic" — keep ~150 (reduced from 200 per user request).
const MAX_ELECTRONIC = 150;

// Reduce post-punk and psychedelic to roughly half.
let postPunkSeen = 0;
let psychSeen = 0;

function shouldSkipHalf(genres: string[], counterKey: "postpunk" | "psych"): boolean {
  if (counterKey === "postpunk" && genres.some((g) => g.toLowerCase().includes("post-punk"))) {
    postPunkSeen++;
    return postPunkSeen % 2 === 0; // skip every other
  }
  if (counterKey === "psych") {
    const hasPsych = genres.some((g) => g.toLowerCase().includes("psych"));
    if (hasPsych) {
      psychSeen++;
      return psychSeen % 2 === 0; // skip every other
    }
  }
  return false;
}

// Build unique album list with max 2 per artist + Electronic cap.
const seenKeys = new Set<string>();
const perArtist = new Map<string, number>();
let electronicCount = 0;
const albums: Album[] = [];
let id = 0;

for (const [artist, title, year, genreStr, duration, description] of allRaw) {
  const cleanTitle = normalizeTitle(title);
  const genres = genreStr.split("|").map((g) => g.trim()).filter(Boolean);
  if (genres.length < 5) continue; // require at least 5 genres
  if (isForbidden(genres)) continue;
  if (shouldSkipHalf(genres, "postpunk")) continue;
  if (shouldSkipHalf(genres, "psych")) continue;

  const artistKey = artist.toLowerCase().trim();
  const titleKey = cleanTitle.toLowerCase().trim();
  const key = `${artistKey}__${titleKey}`;
  if (seenKeys.has(key)) continue;
  seenKeys.add(key);

  const artistCount = perArtist.get(artistKey) ?? 0;
  if (artistCount >= 2) continue; // max 2 per artist
  perArtist.set(artistKey, artistCount + 1);

  const isElectronic = genres.includes("Electronic");
  if (isElectronic && electronicCount >= MAX_ELECTRONIC) continue; // cap
  if (isElectronic) electronicCount++;

  id += 1;

  // Add Female Vocalist tag for female-fronted artists (kept after the 5 curated genres).
  const finalGenres = FEMALE_ARTISTS.has(artist)
    ? Array.from(new Set([...genres, "Female Vocalist"]))
    : genres;

  albums.push({
    id,
    artist,
    title: cleanTitle,
    year,
    genres: finalGenres,
    duration,
    description,
    cover: covers[coverKey(artist, cleanTitle)]?.url ?? null,
    collectionId: covers[coverKey(artist, cleanTitle)]?.cid ?? null,
  });
}

export const ALBUMS: Album[] = albums;

// Derived lists for filters
export const ALL_GENRES: { name: string; count: number }[] = (() => {
  const map = new Map<string, number>();
  for (const a of albums) for (const g of a.genres) map.set(g, (map.get(g) ?? 0) + 1);
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
})();

export const ALL_ARTISTS: { name: string; count: number }[] = (() => {
  const map = new Map<string, number>();
  for (const a of albums) map.set(a.artist, (map.get(a.artist) ?? 0) + 1);
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
})();
