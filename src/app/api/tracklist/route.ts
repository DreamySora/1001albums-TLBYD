import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, readFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { ALBUMS } from "@/data/albums";
import { matchScore, MATCH_THRESHOLD } from "@/lib/itunes-match";

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

async function fetchTracklist(collectionId: number, expectedArtist: string, expectedTitle: string): Promise<{ tracks: Track[] | null; verified: boolean }> {
  const url = `https://itunes.apple.com/lookup?id=${collectionId}&entity=song&limit=200`;
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return { tracks: null, verified: false };
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
        collectionName?: string;
      }[];
    };
    if (!json.results) return { tracks: null, verified: false };
    // The first result with wrapperType === "collection" carries the album metadata — verify it matches.
    const collection = json.results.find((r) => r.wrapperType === "collection");
    if (collection) {
      const verified = verifyMatch(expectedArtist, expectedTitle, collection.artistName ?? "", collection.collectionName ?? "");
      if (!verified) {
        return { tracks: null, verified: false };
      }
    }
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
    return { tracks, verified: true };
  } catch {
    return { tracks: null, verified: false };
  } finally {
    clearTimeout(to);
  }
}

// Fuzzy artist+title verification (must share significant tokens).
function verifyMatch(queryArtist: string, queryTitle: string, resArtist: string, resTitle: string): boolean {
  const STOP = new Set(["the","and","a","an","of","in","on","for","to","my","is","it","vol","pt","part","ii","iii","ep","lp","deluxe","edition","anniversary","remaster","remix","mix","super","white","album","bsides","live","single","demo","sessions"]);
  const tok = (s: string) => new Set(
    s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean)
      .filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w))
  );
  const qa = tok(queryArtist), qt = tok(queryTitle), ra = tok(resArtist), rt = tok(resTitle);
  const artistOk = [...qa].some((t) => ra.has(t));
  const titleOk = [...qt].some((t) => rt.has(t));
  return artistOk && titleOk;
}

// MusicBrainz fallback for tracklists (used when iTunes doesn't have the album,
// e.g. "Is This It" by The Strokes or "Currents" by Tame Impala are not on iTunes).
const MB_UA = "1001Albums/1.0 (contact: crate@digger.example)";
async function mbFindRelease(artist: string, title: string): Promise<string | null> {
  const q = `release:"${title}" AND artist:"${artist}"`;
  const url = `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(q)}&fmt=json&limit=5`;
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { headers: { "User-Agent": MB_UA, Accept: "application/json" }, signal: ctrl.signal });
    if (!res.ok) return null;
    const json = (await res.json()) as { releases?: { id: string; title: string }[] };
    if (!json.releases?.length) return null;
    // Prefer exact title match.
    const want = title.toLowerCase().replace(/[^a-z0-9]/g, "");
    let best: { id: string; sc: number } | null = null;
    for (const r of json.releases) {
      const got = (r.title ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
      let s = 0;
      if (got === want) s = 100;
      else if (got.startsWith(want) || want.startsWith(got)) s = 80;
      else if (got.includes(want) || want.includes(got)) s = 50;
      if (s > (best?.sc ?? 0)) best = { id: r.id, sc: s };
    }
    return best && best.sc >= 50 ? best.id : json.releases[0]?.id ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(to);
  }
}

async function mbFetchRecordings(mbid: string): Promise<Track[] | null> {
  const url = `https://musicbrainz.org/ws/2/release/${mbid}?inc=recordings&fmt=json`;
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { headers: { "User-Agent": MB_UA, Accept: "application/json" }, signal: ctrl.signal });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      "artist-credit"?: { name?: string }[];
      media?: { tracks?: { position: number; title: string; length: number | null }[] }[];
    };
    const artistName = json["artist-credit"]?.map((c) => c.name).join("") ?? "";
    const tracks: Track[] = [];
    let num = 0;
    for (const disc of json.media ?? []) {
      for (const t of disc.tracks ?? []) {
        num++;
        const { name, featuring } = parseFeaturing(t.title ?? "", artistName);
        tracks.push({
          number: num,
          name,
          artist: artistName,
          durationMs: t.length ?? null,
          featuring,
          previewUrl: null, // MB has no audio previews
        });
      }
    }
    return tracks.length ? tracks : null;
  } catch {
    return null;
  } finally {
    clearTimeout(to);
  }
}

// Fallback: search iTunes for the collectionId with verification, returning the best match.
async function findCollectionId(artist: string, title: string): Promise<number | null> {
  const term = encodeURIComponent(`${artist} ${title}`);
  const url = `https://itunes.apple.com/search?term=${term}&entity=album&limit=10`;
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    const json = (await res.json()) as { results?: { collectionId: number; artistName: string; collectionName: string }[] };
    if (!json.results?.length) return null;
    // Strict match: only accept results whose artist+title match well.
    // This prevents e.g. the "Wednesday" Netflix soundtrack being used for the band Wednesday,
    // or "Currents B-Sides" for "Currents".
    let best: { cid: number; sc: number } | null = null;
    for (const r of json.results) {
      const sc = matchScore(r.artistName, r.collectionName, artist, title);
      if (sc <= 0) continue;
      if (!best || sc > best.sc) best = { cid: r.collectionId, sc };
    }
    if (best && best.sc >= MATCH_THRESHOLD) return best.cid;
    return null;
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
  if (cid) {
    const { tracks, verified } = await fetchTracklist(cid, album.artist, album.title);
    if (tracks && verified) {
      const totalDurationMs = tracks.reduce((s, t) => s + (t.durationMs ?? 0), 0) || null;
      const payload: TracklistResponse = {
        albumId,
        collectionId: cid,
        totalDurationMs,
        trackCount: tracks.length,
        tracks,
        cached: false,
      };
      try { writeFileSync(cacheFile, JSON.stringify(payload)); } catch {}
      return NextResponse.json(payload);
    }
    // iTunes failed verification — fall through to MusicBrainz fallback.
  }

  // MusicBrainz fallback: fetch tracklist from MB when iTunes doesn't have the album.
  const mbid = await mbFindRelease(album.artist, album.title);
  if (mbid) {
    const mbTracks = await mbFetchRecordings(mbid);
    if (mbTracks && mbTracks.length) {
      const totalDurationMs = mbTracks.reduce((s, t) => s + (t.durationMs ?? 0), 0) || null;
      const payload: TracklistResponse = {
        albumId,
        collectionId: cid ?? null,
        totalDurationMs,
        trackCount: mbTracks.length,
        tracks: mbTracks,
        cached: false,
      };
      try { writeFileSync(cacheFile, JSON.stringify(payload)); } catch {}
      return NextResponse.json(payload);
    }
  }

  // Neither iTunes nor MB had the tracklist — return empty (honest, no wrong songs).
  try { if (existsSync(cacheFile)) unlinkSync(cacheFile); } catch {}
  return NextResponse.json({
    albumId,
    collectionId: cid ?? null,
    totalDurationMs: null,
    trackCount: 0,
    tracks: [],
    cached: false,
  });
}
