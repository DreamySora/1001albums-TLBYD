"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Disc3, Sparkles, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import type { Album } from "@/lib/albums-client";
import { cn } from "@/lib/utils";

const ACCENTS = ["var(--hotpink)", "var(--lime)", "var(--amber)", "var(--grape)", "var(--cyan)"];

function hashStr(s: string, n: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % n;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface AlbumOfTheDayProps {
  album: Album;
  timeUntilChange: { hours: number; minutes: number; seconds: number };
  onOpen: (album: Album) => void;
  compact?: boolean;
}

export function AlbumOfTheDay({ album, timeUntilChange, onOpen, compact }: AlbumOfTheDayProps) {
  const accent = ACCENTS[hashStr(album.artist, ACCENTS.length)];
  const timer = `${timeUntilChange.hours}h ${timeUntilChange.minutes}m`;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-card to-card/50 p-3"
          style={{ boxShadow: `0 2px 20px -6px ${accent}` }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,var(--hotpink)_0%,transparent_50%)] opacity-5" />
          <div className="relative flex items-center gap-3">
            <div
              className="relative size-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10"
              style={{ boxShadow: `0 4px 16px -6px ${accent}` }}
            >
              {album.cover ? (
                <img
                  src={album.cover}
                  alt={`${album.title} cover`}
                  className="h-full w-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center p-1 text-center"
                  style={{ background: `linear-gradient(140deg, ${accent}, oklch(0.16 0.01 60))` }}
                >
                  <span className="font-display text-[10px] leading-none text-black/80 uppercase">{album.title}</span>
                </div>
              )}
            </div>
            <div className="flex flex-1 items-center justify-between gap-3 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-mono-funk text-[9px] tracking-wider text-lime uppercase">
                  <Sparkles className="size-2.5" style={{ color: "var(--lime)" }} />
                  Album of the Day
                </div>
                <h3 className="font-display text-base leading-tight tracking-tight uppercase truncate sm:text-lg">
                  {album.title}
                </h3>
                <p className="font-grotesk text-xs text-muted-foreground truncate">{album.artist}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 font-mono-funk text-[9px] tracking-wider text-foreground/70">
                  <Clock className="size-2.5 text-cyan" />
                  <span>Next in <strong className="text-cyan">{timer}</strong></span>
                </div>
                <button
                  onClick={() => onOpen(album)}
                  className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono-funk text-[10px] font-bold tracking-wider text-black transition-all duration-300 hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, var(--lime), ${accent})`,
                    boxShadow: `0 2px 12px -4px ${accent}`,
                  }}
                >
                  <Disc3 className="size-3" />
                  <span className="hidden sm:inline">LISTEN</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-[1800px] px-3 sm:px-6"
    >
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-card to-card/50 p-4 sm:p-5"
        style={{ boxShadow: `0 4px 32px -8px ${accent}` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--hotpink)_0%,transparent_50%)] opacity-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,var(--cyan)_0%,transparent_50%)] opacity-5" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="relative size-20 shrink-0 overflow-hidden rounded-xl ring-2 ring-white/10"
              style={{ boxShadow: `0 8px 32px -8px ${accent}` }}
            >
              {album.cover ? (
                <img
                  src={album.cover}
                  alt={`${album.title} cover`}
                  className="h-full w-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center p-2 text-center"
                  style={{ background: `linear-gradient(140deg, ${accent}, oklch(0.16 0.01 60))` }}
                >
                  <span className="font-display text-sm leading-none text-black/80 uppercase">{album.title}</span>
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-mono-funk text-[10px] tracking-wider text-lime uppercase">
                <Sparkles className="size-3.5" style={{ color: "var(--lime)" }} />
                Album of the Day
              </div>
              <h3 className="mt-0.5 font-display text-2xl leading-tight tracking-tight uppercase sm:text-3xl truncate">
                {album.title}
              </h3>
              <p className="font-grotesk text-sm text-muted-foreground sm:text-base">{album.artist}</p>
              <div className="mt-2 flex flex-wrap gap-1.5 font-mono-funk text-[10px] tracking-wider">
                <span className="rounded-md bg-lime/15 px-2 py-0.5 text-lime">{album.year}</span>
                <span className="rounded-md bg-amber/15 px-2 py-0.5 text-amber">{album.duration} min</span>
                {album.genres?.slice(0, 3).map((g) => (
                  <span key={g} className="rounded-md bg-white/5 px-2 py-0.5 text-foreground/70">{g}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 sm:gap-4 shrink-0">
            <div className="flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-1.5 font-mono-funk text-[10px] tracking-wider text-foreground/70">
              <Clock className="size-3 text-cyan" />
              <span>Next pick in <strong className="text-cyan">{timer}</strong></span>
            </div>
            <button
              onClick={() => onOpen(album)}
              className={cn(
                "group relative flex items-center gap-2 rounded-full px-5 py-2.5 font-mono-funk text-xs font-bold tracking-wider text-black transition-all duration-300 hover:scale-105",
              )}
              style={{
                background: `linear-gradient(135deg, var(--lime), ${accent})`,
                boxShadow: `0 4px 20px -6px ${accent}`,
              }}
            >
              <Disc3 className="size-4 transition-transform duration-300 group-hover:rotate-[360deg]" />
              LISTEN NOW
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface AlbumOfTheDayHistoryProps {
  history: { date: string; album: Album }[];
}

export function AlbumOfTheDayHistory({ history }: AlbumOfTheDayHistoryProps) {
  const [index, setIndex] = useState(0);
  const itemsPerView = 3;
  const maxIndex = Math.max(0, history.length - itemsPerView);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-[1800px] px-3 pb-8 sm:px-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-xl uppercase tracking-tight sm:text-2xl">Recent Picks</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className={cn(
              "flex size-9 items-center justify-center rounded-full border border-white/10 bg-card/60 transition hover:border-hotpink hover:text-hotpink",
              index === 0 && "opacity-40 pointer-events-none"
            )}
            aria-label="Previous"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="font-mono-funk text-[10px] tracking-wider text-muted-foreground min-w-[3ch] text-center">
            {index + 1}/{Math.max(1, maxIndex + 1)}
          </span>
          <button
            onClick={() => setIndex((i) => Math.min(maxIndex, i + 1))}
            disabled={index >= maxIndex}
            className={cn(
              "flex size-9 items-center justify-center rounded-full border border-white/10 bg-card/60 transition hover:border-hotpink hover:text-hotpink",
              index >= maxIndex && "opacity-40 pointer-events-none"
            )}
            aria-label="Next"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {history.slice(index, index + itemsPerView).map((entry, i) => {
          const album = entry.album;
          const cardAccent = ACCENTS[hashStr(album.artist, ACCENTS.length)];
          return (
            <motion.article
              key={entry.date}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-card p-4 transition hover:border-hotpink/30 hover:bg-card/80"
              style={{ boxShadow: `0 2px 16px -4px ${cardAccent}` }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--hotpink)_0%,transparent_50%)] opacity-10" />
              <div className="relative flex items-start gap-4">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10 transition duration-300 group-hover:scale-105" style={{ boxShadow: `0 4px 16px -4px ${cardAccent}` }}>
                  {album.cover ? (
                    <img
                      src={album.cover}
                      alt={`${album.title} cover`}
                      className="h-full w-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center p-2 text-center"
                      style={{ background: `linear-gradient(140deg, ${cardAccent}, oklch(0.16 0.01 60))` }}
                    >
                      <span className="font-display text-xs leading-none text-black/80 uppercase">{album.title}</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono-funk text-[10px] tracking-wider text-muted-foreground uppercase">
                    {formatDate(entry.date)}
                  </p>
                  <h4 className="mt-0.5 font-display text-base leading-tight tracking-tight uppercase truncate">{album.title}</h4>
                  <p className="font-grotesk text-sm text-muted-foreground truncate">{album.artist}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5 font-mono-funk text-[8px] tracking-wider">
                    <span className="rounded-md bg-lime/15 px-1.5 py-0.5 text-lime">{album.year}</span>
                    <span className="rounded-md bg-amber/15 px-1.5 py-0.5 text-amber">{album.duration} min</span>
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </motion.section>
  );
}
