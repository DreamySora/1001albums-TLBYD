export type Album = {
  id: number;
  artist: string;
  title: string;
  year: number;
  genres: string[];
  duration: number;
  description: string;
  cover: string | null;
  collectionId: number | null;
};

export type GenreInfo = { name: string; count: number };
export type ArtistInfo = { name: string; count: number };

export type DurationBucket = "all" | "short" | "medium" | "long" | "epic";

export type SortKey =
  | "default"
  | "year-asc"
  | "year-desc"
  | "title"
  | "artist"
  | "duration";

export type Filters = {
  search: string;
  genres: string[]; // OR across selected
  artist: string | null;
  letter: string | null; // "A".."Z" or "#"
  duration: DurationBucket;
  sort: SortKey;
};

export const DURATION_BUCKETS: { id: DurationBucket; label: string; test: (m: number) => boolean }[] = [
  { id: "all", label: "Any Length", test: () => true },
  { id: "short", label: "Short · <35m", test: (m) => m < 35 },
  { id: "medium", label: "Medium · 35–55m", test: (m) => m >= 35 && m < 55 },
  { id: "long", label: "Long · 55–80m", test: (m) => m >= 55 && m < 80 },
  { id: "epic", label: "Epic · 80m+", test: (m) => m >= 80 },
];

export const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "default", label: "Curator's Order" },
  { id: "year-asc", label: "Year ↑" },
  { id: "year-desc", label: "Year ↓" },
  { id: "title", label: "Title A–Z" },
  { id: "artist", label: "Artist A–Z" },
  { id: "duration", label: "Length ↑" },
];

export const LETTERS = [
  "A","B","C","D","E","F","G","H","I","J","K","L","M",
  "N","O","P","Q","R","S","T","U","V","W","X","Y","Z","#",
];

export function artistLetter(artist: string): string {
  const ch = artist.trim().charAt(0).toUpperCase();
  if (ch >= "A" && ch <= "Z") return ch;
  // strip leading "The " etc? keep simple: non-alpha => #
  return "#";
}

export function applyFilters(albums: Album[], f: Filters): Album[] {
  const search = f.search.trim().toLowerCase();
  let out = albums.filter((a) => {
    if (f.genres.length && !f.genres.some((g) => a.genres.includes(g))) return false;
    if (f.artist && a.artist !== f.artist) return false;
    if (f.letter && artistLetter(a.artist) !== f.letter) return false;
    const bucket = DURATION_BUCKETS.find((b) => b.id === f.duration)!;
    if (!bucket.test(a.duration)) return false;
    if (search) {
      const hay = `${a.artist} ${a.title} ${a.genres.join(" ")} ${a.year}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  switch (f.sort) {
    case "year-asc": out = out.slice().sort((a, b) => a.year - b.year); break;
    case "year-desc": out = out.slice().sort((a, b) => b.year - a.year); break;
    case "title": out = out.slice().sort((a, b) => a.title.localeCompare(b.title)); break;
    case "artist": out = out.slice().sort((a, b) => a.artist.localeCompare(b.artist)); break;
    case "duration": out = out.slice().sort((a, b) => a.duration - b.duration); break;
    default: break; // curator order = id order
  }
  return out;
}
