import { NextRequest, NextResponse } from "next/server";
import { ALBUMS } from "@/data/albums";

export const dynamic = "force-static";

// Single album detail — returns full album including description (for modal).
export async function GET(req: NextRequest) {
  const albumId = Number(req.nextUrl.searchParams.get("id"));
  if (!albumId) return NextResponse.json({ error: "id required" }, { status: 400 });
  const album = ALBUMS.find((a) => a.id === albumId);
  if (!album) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(album);
}
