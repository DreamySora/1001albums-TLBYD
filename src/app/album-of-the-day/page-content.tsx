"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Disc3, Clock, Sparkles, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { AlbumModal } from "@/components/album-modal";
import { TopNav } from "@/components/top-nav";
import { AlbumOfTheDayHistory } from "@/components/album-of-the-day";
import type { Album } from "@/lib/albums-client";
import { cn } from "@/lib/utils";

const ACCENTS = ["var(--hotpink)", "var(--lime)", "var(--amber)", "var(--grape)", "var(--cyan)"];

function hashStr(s: string, n: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % n;
}

export default function PageContent({
  todayAlbum,
  timeUntilChange,
  history,
}: {
  todayAlbum: Album;
  timeUntilChange: { hours: number; minutes: number; seconds: number };
  history: { date: string; album: Album }[];
}) {
  const [openAlbum, setOpenAlbum] = useState<Album | null>(null);
  const accent = ACCENTS[hashStr(todayAlbum.artist, ACCENTS.length)];
  const timer = `${timeUntilChange.hours}h ${timeUntilChange.minutes}m`;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopNav active="album-of-the-day" />
      <AlbumModal album={openAlbum} onClose={() => setOpenAlbum(null)} />

      <main className="flex-1">
        {/* Today's Pick Hero */}
        <section className="relative overflow-hidden border-b border-white/10">
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -left-32 -top-32 size-[500px] rounded-full opacity-20 blur-3xl"
            style={{ background: accent }}
            animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -right-24 top-10 size-[400px] rounded-full opacity-15 blur-3xl"
            style={{ background: "var(--lime)" }}
            animate={{ x: [0, -50, 0], y: [0, 60, 0], scale: [1, 1.3, 1] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,var(--hotpink)_0%,transparent_60%)] opacity-5" />

          <div className="relative mx-auto max-w-[1280px] px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-8 text-center lg:flex-row lg:items-start lg:gap-12 lg:text-left"
            >
              {/* Cover */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative shrink-0"
              >
                <div
                  className="relative size-48 overflow-hidden rounded-2xl ring-2 ring-white/10 sm:size-56 lg:size-72"
                  style={{ boxShadow: `0 16px 64px -16px ${accent}` }}
                >
                  {todayAlbum.cover ? (
                    <img
                      src={todayAlbum.cover}
                      alt={`${todayAlbum.title} cover`}
                      className="h-full w-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center p-4 text-center"
                      style={{ background: `linear-gradient(140deg, ${accent}, oklch(0.16 0.01 60))` }}
                    >
                      <span className="font-display text-xl leading-none text-black/80 uppercase sm:text-2xl">{todayAlbum.title}</span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Info */}
              <div className="min-w-0 flex-1 max-w-2xl">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="mb-3 inline-flex items-center gap-2 rounded-full bg-lime/15 px-3.5 py-1.5 font-mono-funk text-[10px] tracking-wider text-lime uppercase"
                >
                  <Sparkles className="size-3.5" />
                  Today&apos;s Pick
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  className="font-display text-5xl leading-[0.9] tracking-tight uppercase sm:text-6xl lg:text-7xl"
                >
                  {todayAlbum.title}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                  className="mt-3 font-grotesk text-lg text-muted-foreground sm:text-xl"
                >
                  by {todayAlbum.artist}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="mt-4 flex flex-wrap justify-center gap-2 font-mono-funk text-xs tracking-wider lg:justify-start"
                >
                  <span className="rounded-md bg-lime/15 px-2.5 py-1 text-lime">{todayAlbum.year}</span>
                  <span className="rounded-md bg-amber/15 px-2.5 py-1 text-amber">{todayAlbum.duration} min</span>
                  {todayAlbum.genres?.map((g) => (
                    <span key={g} className="rounded-md bg-white/5 px-2.5 py-1 text-foreground/70">{g}</span>
                  ))}
                </motion.div>

                {todayAlbum.description && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.45 }}
                    className="mt-6 font-grotesk text-base leading-relaxed text-foreground/80 sm:text-lg"
                  >
                    {todayAlbum.description}
                  </motion.p>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.55 }}
                  className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:items-center"
                >
                  <button
                    onClick={() => setOpenAlbum(todayAlbum)}
                    className="group relative flex items-center gap-3 rounded-full px-6 py-3 font-mono-funk text-sm font-bold tracking-wider text-black transition-all duration-300 hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, var(--lime), ${accent})`,
                      boxShadow: `0 6px 28px -8px ${accent}`,
                    }}
                  >
                    <Disc3 className="size-5 transition-transform duration-300 group-hover:rotate-[360deg]" />
                    LISTEN NOW
                  </button>

                  <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 font-mono-funk text-xs tracking-wider text-foreground/70">
                    <Clock className="size-3.5 text-cyan" />
                    <span>Next pick in <strong className="text-cyan">{timer}</strong></span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* History Section */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8 sm:mb-12"
            >
              <h2 className="font-display text-3xl uppercase tracking-tight sm:text-4xl">
                200 Days of Picks
              </h2>
              <p className="mt-2 font-grotesk text-base text-muted-foreground">
                Every day a new album rises to the top. Scroll through the last 200 days of featured albums.
              </p>
            </motion.div>

            <AlbumOfTheDayHistory history={history} />
          </div>
        </section>
      </main>
    </div>
  );
}
