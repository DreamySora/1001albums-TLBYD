"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Music2, Clock, User, Loader2, Disc3, ExternalLink, Play, Square, Ban, Heart, CheckCircle2 } from "lucide-react";
import type { Album } from "@/lib/albums-client";
import { cn } from "@/lib/utils";
import { useAccount, Stars } from "@/lib/account";

type Track = {
  number: number;
  name: string;
  artist: string;
  durationMs: number | null;
  featuring: string | null;
  previewUrl: string | null;
};

type TracklistData = {
  albumId: number;
  collectionId: number | null;
  totalDurationMs: number | null;
  trackCount: number;
  tracks: Track[];
  cached: boolean;
};

function fmtDuration(ms: number | null): string {
  if (!ms) return "--:--";
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const ACCENTS = ["var(--hotpink)", "var(--lime)", "var(--amber)", "var(--grape)", "var(--cyan)"];
function hashStr(s: string, n: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % n;
}

export function AlbumModal({ album, onClose }: { album: Album | null; onClose: () => void }) {
  const [data, setData] = useState<TracklistData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = (url: string | null) => {
    if (!url) return;
    if (playingUrl === url) {
      audioRef.current?.pause();
      setPlayingUrl(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const el = new Audio(url);
    el.addEventListener("ended", () => setPlayingUrl(null));
    el.play().catch(() => setPlayingUrl(null));
    audioRef.current = el;
    setPlayingUrl(url);
  };

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!album) {
      setData(null);
      setError(null);
      audioRef.current?.pause();
      setPlayingUrl(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    setData(null);
    (async () => {
      try {
        const res = await fetch(`/api/tracklist?albumId=${album.id}`);
        if (!res.ok) throw new Error("Failed to load tracklist");
        const json = (await res.json()) as TracklistData;
        if (alive) setData(json);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    // If the album came from the light list (no description), fetch full detail.
    if (!album.description) {
      fetch(`/api/album?id=${album.id}`)
        .then((r) => r.json())
        .then((full) => {
          if (alive && full?.description) {
            // mutate album object in place so description renders
            (album as Album).description = full.description;
            // force re-render
            setData((d) => (d ? { ...d } : d));
          }
        })
        .catch(() => {});
    }
    return () => {
      alive = false;
    };
  }, [album]);

  useEffect(() => {
    if (album) {
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
      window.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
      return () => {
        window.removeEventListener("keydown", onKey);
        document.body.style.overflow = "";
      };
    }
  }, [album, onClose]);

  const accent = album ? ACCENTS[hashStr(album.artist, ACCENTS.length)] : ACCENTS[0];

  return (
    <AnimatePresence>
      {album && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-card shadow-2xl sm:rounded-2xl"
            style={{ boxShadow: `0 -10px 80px -20px ${accent}` }}
          >
            {/* Header: cover + meta */}
            <div className="relative flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:p-6">
              <div
                className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10 sm:w-36"
                style={{ boxShadow: `0 8px 30px -10px ${accent}` }}
              >
{album.cover ? (
                    <img
                      src={album.cover}
                      alt={`${album.title} cover`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                  <div
                    className="flex h-full w-full items-center justify-center p-2 text-center"
                    style={{ background: `linear-gradient(140deg, ${accent}, oklch(0.16 0.01 60))` }}
                  >
                    <span className="font-display text-lg leading-none text-black/80 uppercase">{album.title}</span>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-display text-2xl leading-tight tracking-tight uppercase sm:text-3xl">
                      {album.title}
                    </h2>
                    <p className="mt-1 font-grotesk text-base text-muted-foreground">{album.artist}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="shrink-0 rounded-full bg-white/10 p-2 text-foreground transition hover:bg-white/20"
                    aria-label="Close"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 font-mono-funk text-[10px] tracking-wider">
                  <span className="rounded-md bg-lime/15 px-2 py-0.5 text-lime">{album.year}</span>
                  <span className="rounded-md bg-amber/15 px-2 py-0.5 text-amber">{album.duration} min</span>
                  <span className="rounded-md bg-hotpink/15 px-2 py-0.5 text-hotpink">
                    {data?.trackCount ? `${data.trackCount} tracks` : "…"}
                  </span>
                  {data?.totalDurationMs ? (
                    <span className="rounded-md bg-cyan/15 px-2 py-0.5 text-cyan">
                      {fmtDuration(data.totalDurationMs)} total
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 font-grotesk text-sm leading-relaxed text-foreground/80">
                  {album.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-1">
                  {album.genres.map((g) => (
                    <span
                      key={g}
                      className="rounded-full border border-white/15 px-2 py-0.5 font-mono-funk text-[9px] tracking-wide text-foreground/70"
                    >
                      {g}
                    </span>
                  ))}
                </div>

                {/* Account actions */}
                <AccountActions album={album} />
              </div>
            </div>

            {/* Tracklist body */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 scrollbar-funky">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="size-6 animate-spin text-lime" />
                  <p className="mt-3 font-mono-funk text-[11px] tracking-wider text-muted-foreground">
                    loading tracklist…
                  </p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <p className="font-grotesk text-sm text-destructive">{error}</p>
                </div>
              ) : !data || data.tracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Disc3 className="size-8 text-grape" />
                  <p className="mt-3 font-grotesk text-sm text-muted-foreground">
                    No tracklist found for this one. The vinyl's still sealed in our crate.
                  </p>
                </div>
              ) : (
                <ol className="divide-y divide-white/5">
                  {data.tracks.map((t) => {
                    const isPlaying = playingUrl === t.previewUrl && !!t.previewUrl;
                    return (
                      <li
                        key={`${t.number}-${t.name}`}
                        className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/5"
                      >
                        <span className="w-6 shrink-0 text-center font-mono-funk text-[11px] text-muted-foreground">
                          {t.number.toString().padStart(2, "0")}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={cn("truncate font-grotesk text-sm", isPlaying ? "text-lime" : "text-foreground")}>
                            {t.name}
                          </p>
                          {t.featuring ? (
                            <p className="flex items-center gap-1 truncate font-mono-funk text-[10px] tracking-wide text-hotpink">
                              <User className="size-2.5" /> feat. {t.featuring}
                            </p>
                          ) : null}
                        </div>
                        {/* Play / 30s preview button */}
                        <button
                          type="button"
                          onClick={() => togglePlay(t.previewUrl)}
                          disabled={!t.previewUrl}
                          aria-label={t.previewUrl ? (isPlaying ? "Stop preview" : "Play 30s preview") : "No preview available"}
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-full transition-all",
                            t.previewUrl
                              ? isPlaying
                                ? "bg-lime text-black hover:scale-110"
                                : "bg-white/10 text-foreground hover:bg-lime hover:text-black hover:scale-110"
                              : "cursor-not-allowed bg-white/5 text-muted-foreground/40"
                          )}
                          title={t.previewUrl ? (isPlaying ? "Stop" : "Play 30s") : "No preview"}
                        >
                          {t.previewUrl ? (
                            isPlaying ? <Square className="size-3" /> : <Play className="size-3" />
                          ) : (
                            <Ban className="size-3" />
                          )}
                        </button>
                        <span className="shrink-0 font-mono-funk text-[11px] tracking-wider text-muted-foreground">
                          {fmtDuration(t.durationMs)}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/10 bg-black/30 px-4 py-2.5 font-mono-funk text-[10px] tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Music2 className="size-3 text-lime" />
                {data?.cached ? "from cache" : "fetched live"}
              </span>
              {album.collectionId ? (
                <a
                  href={`https://music.apple.com/album/${album.collectionId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 transition-colors hover:text-foreground"
                >
                  Apple Music <ExternalLink className="size-3" />
                </a>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AccountActions({ album }: { album: Album }) {
  const { entries, setStatus, setRating } = useAccount();
  const entry = entries[album.id];
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
      <button
        onClick={() => setStatus(album, "listened")}
        className={cn(
          "flex items-center gap-1 rounded-full px-2.5 py-1 font-mono-funk text-[10px] tracking-wider transition",
          entry?.status === "listened" ? "bg-lime text-black" : "bg-white/10 text-foreground/80 hover:bg-lime/30"
        )}
      >
        <CheckCircle2 className="size-3" /> LISTENED
      </button>
      <button
        onClick={() => setStatus(album, "want")}
        className={cn(
          "flex items-center gap-1 rounded-full px-2.5 py-1 font-mono-funk text-[10px] tracking-wider transition",
          entry?.status === "want" ? "bg-hotpink text-black" : "bg-white/10 text-foreground/80 hover:bg-hotpink/30"
        )}
      >
        <Heart className="size-3" /> WANT
      </button>
      <button
        onClick={() => setStatus(album, "owned")}
        className={cn(
          "flex items-center gap-1 rounded-full px-2.5 py-1 font-mono-funk text-[10px] tracking-wider transition",
          entry?.status === "owned" ? "bg-amber text-black" : "bg-white/10 text-foreground/80 hover:bg-amber/30"
        )}
      >
        <Disc3 className="size-3" /> OWN
      </button>
      {entry && (
        <div className="ml-auto flex items-center gap-1.5">
          <span className="font-mono-funk text-[9px] tracking-wider text-muted-foreground">RATING</span>
          <Stars value={entry.rating} onChange={(v) => setRating(album, v)} size={14} />
        </div>
      )}
    </div>
  );
}
