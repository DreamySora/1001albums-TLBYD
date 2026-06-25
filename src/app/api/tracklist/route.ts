import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { ALBUMS } from "@/data/albums";

export const dynamic = "force-dynamic";

const CACHE_DIR = "/home/z/my-project/src/data/tracklists";
if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });

type Track = {
  number: number;
  name: string;
  artist: string; // may include "feat."
  durationMs: number | null;
  featuring: string | null;
  previewUrl: string | null; // iTunes 30s preview (AAC, free)
};

type TracklistResponse = {
  albumId: number;
  collectionId: number | null;
  totalDurationMs: number | null;
  trackCount: number;
  tracks: Track[];
  cached: boolean;
};

function parseFeaturing(trackName: string, artistName: string): { name: string; featuring: string | null } {
  const featRegex = /\b(feat\.?|featuring|ft\.?)\s+(.+?)(?:\s*[\)\]]|$)/i;
  let featuring: string | null = null;

  const artistMatch = artistName.match(featRegex);
  if (artistMatch) featuring = artistMatch[2].trim().replace(/[)\]]$/, "").trim();

  const nameMatch = trackName.match(featRegex);
  let cleanName = trackName;
  if (nameMatch) {
    featuring = featuring ?? nameMatch[2].trim().replace(/[)\]]$/, "").trim();
    cleanName = trackName.replace(/\s*\(feat\.?[^)]*\)\s*/i, "").replace(/\s*feat\.?[^)]*$/i, "").trim();
  }
  return { name: cleanName, featuring };
}

async function fetchTracklist(collectionId: number): Promise<Track[] | null> {
  const url = `https://itunes.apple.com/lookup?id=${collectionId}&entity=song&limit=200`;
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      results?: {
        wrapperType: string;
        kind?: string;
        trackId?: number;
        trackNumber?: number;
        trackName?: string;
        artistName?: string;
        trackTimeMillis?: number;
        previewUrl?: string;
      }[];
    };
    if (!json.results) return null;
    const tracks = json.results
      .filter((r) => r.wrapperType === "track" && r.kind === "song" && r.trackName)
      .map((r) => {
        const { name, featuring } = parseFeaturing(r.trackName!, r.artistName ?? "");
        return {
          number: r.trackNumber ?? 0,
          name,
          artist: r.artistName ?? "",
          durationMs: r.trackTimeMillis ?? null,
          featuring,
          previewUrl: r.previewUrl ?? null,
        } as Track;
      })
      .sort((a, b) => a.number - b.number);
    return tracks;
  } catch {
    return null;
  } finally {
    clearTimeout(to);
  }
}

// Fallback: if we don't have a stored collectionId, search iTunes for it.
async function findCollectionId(artist: string, title: string): Promise<number | null> {
  const term = encodeURIComponent(`${artist} ${title}`);
  const url = `https://itunes.apple.com/search?term=${term}&entity=album&limit=3`;
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    const json = (await res.json()) as { results?: { collectionId: number }[] };
    return json.results?.[0]?.collectionId ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(to);
  }
}

export async function GET(req: NextRequest) {
  const albumIdParam = req.nextUrl.searchParams.get("albumId");
  const albumId = Number(albumIdParam);
  if (!albumId) {
    return NextResponse.json({ error: "albumId required" }, { status: 400 });
  }
  const album = ALBUMS.find((a) => a.id === albumId);
  if (!album) {
    return NextResponse.json({ error: "album not found" }, { status: 404 });
  }

  const cacheFile = `${CACHE_DIR}/${albumId}.json`;
  if (existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(readFileSync(cacheFile, "utf-8")) as TracklistResponse;
      return NextResponse.json({ ...cached, cached: true });
    } catch {
      // fall through to fetch
    }
  }

  const cid = album.collectionId ?? (await findCollectionId(album.artist, album.title));
  if (!cid) {
    return NextResponse.json({
      albumId,
      collectionId: null,
      totalDurationMs: null,
      trackCount: 0,
      tracks: [],
      cached: false,
    });
  }

  const tracks = await fetchTracklist(cid);
  if (!tracks) {
    return NextResponse.json({
      albumId,
      collectionId: cid,
      totalDurationMs: null,
      trackCount: 0,
      tracks: [],
      cached: false,
    });
  }

  const totalDurationMs = tracks.reduce((s, t) => s + (t.durationMs ?? 0), 0) || null;
  const payload: TracklistResponse = {
    albumId,
    collectionId: cid,
    totalDurationMs,
    trackCount: tracks.length,
    tracks,
    cached: false,
  };
  try {
    writeFileSync(cacheFile, JSON.stringify(payload));
  } catch {
    // ignore write errors
  }
  return NextResponse.json(payload);
}
