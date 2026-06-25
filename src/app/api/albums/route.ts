import { NextRequest, NextResponse } from "next/server";
import { ALBUMS } from "@/data/albums";

export const dynamic = "force-static";

// Lightweight list endpoint — returns albums WITHOUT the description field
// (which is only needed in the modal). Reduces payload ~40%.
export async function GET() {
  const light = ALBUMS.map((a) => ({
    id: a.id,
    artist: a.artist,
    title: a.title,
    year: a.year,
    genres: a.genres,
    duration: a.duration,
    cover: a.cover,
    collectionId: a.collectionId,
  }));
  return NextResponse.json({
    albums: light,
    genres: GENRES,
    artists: ARTISTS,
    total: ALBUMS.length,
  });
}

// Precompute genre/artist lists (module-level, computed once).
const GENRES: { name: string; count: number }[] = (() => {
  const map = new Map<string, number>();
  for (const a of ALBUMS) for (const g of a.genres) map.set(g, (map.get(g) ?? 0) + 1);
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
})();

const ARTISTS: { name: string; count: number }[] = (() => {
  const map = new Map<string, number>();
  for (const a of ALBUMS) map.set(a.artist, (map.get(a.artist) ?? 0) + 1);
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
})();
