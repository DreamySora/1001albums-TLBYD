import { NextResponse } from "next/server";
import { ALBUMS, ALL_GENRES, ALL_ARTISTS } from "@/data/albums";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({
    albums: ALBUMS,
    genres: ALL_GENRES,
    artists: ALL_ARTISTS,
    total: ALBUMS.length,
  });
}
