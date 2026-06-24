import { raw1 } from "./raw-1";
import { raw2 } from "./raw-2";
import { raw3 } from "./raw-3";
import { raw4 } from "./raw-4";
import coversCache from "./covers.json";

export type Album = {
  id: number;
  artist: string;
  title: string;
  year: number;
  genres: string[];
  duration: number; // minutes
  description: string;
  cover: string | null; // iTunes artwork URL (600x600) or null
};

const allRaw = [...raw1, ...raw2, ...raw3, ...raw4];
const covers = coversCache as Record<number, { url: string | null; status: string }>;

// Normalize a title: strip trailing " (revisit)" / "(revisit)" markers we used as placeholders.
function normalizeTitle(t: string): string {
  return t.replace(/\s*\(revisit\)\s*$/i, "").trim();
}

// Soft genre guard: drop entries whose genres scream Metal / Country (shouldn't happen, but safety net).
const FORBIDDEN = [
  "metal",
  "heavy metal",
  "thrash",
  "death metal",
  "black metal",
  "doom metal",
  "sludge",
  "grindcore",
  "country",
  "country rock",
  "country pop",
  "alt-country", // keep alt-country? user said avoid country & derivatives. Drop it.
];

function isForbidden(genres: string[]): boolean {
  const lower = genres.map((g) => g.toLowerCase());
  return lower.some((g) => FORBIDDEN.some((f) => g === f || g.includes("metal") || g.includes("country")));
}

// Build unique album list with max 2 per artist.
const seenKeys = new Set<string>();
const perArtist = new Map<string, number>();
const albums: Album[] = [];
let id = 0;

for (const [artist, title, year, genreStr, duration, description] of allRaw) {
  const cleanTitle = normalizeTitle(title);
  const genres = genreStr.split("|").map((g) => g.trim()).filter(Boolean);
  if (genres.length < 5) continue; // require exactly 5 genres
  if (isForbidden(genres)) continue;

  const artistKey = artist.toLowerCase().trim();
  const titleKey = cleanTitle.toLowerCase().trim();
  const key = `${artistKey}__${titleKey}`;
  if (seenKeys.has(key)) continue;
  seenKeys.add(key);

  const artistCount = perArtist.get(artistKey) ?? 0;
  if (artistCount >= 2) continue; // max 2 per artist
  perArtist.set(artistKey, artistCount + 1);

  id += 1;
  albums.push({
    id,
    artist,
    title: cleanTitle,
    year,
    genres,
    duration,
    description,
    cover: covers[id]?.url ?? null,
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
