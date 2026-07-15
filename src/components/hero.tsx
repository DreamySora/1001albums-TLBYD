"use client";

import { motion } from "framer-motion";
import { Disc3, Sparkles } from "lucide-react";
import { Marquee } from "./marquee";

export function Hero({ total, genreCount, artistCount }: { total: number; genreCount: number; artistCount: number }) {
  return (
    <header className="relative overflow-hidden border-b border-white/10">
      {/* animated gradient blobs */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 size-[420px] rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--hotpink)" }}
        animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-10 size-[380px] rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--cyan)" }}
        animate={{ x: [0, -50, 0], y: [0, 60, 0], scale: [1, 1.3, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 size-[300px] rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--lime)" }}
        animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.25, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto max-w-[1800px] px-3 pt-8 pb-4 sm:px-6 sm:pt-16">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-3 font-display text-[16vw] leading-[0.82] tracking-tight uppercase sm:text-[12vw] lg:text-[150px]"
        >
          <span className="block">
            <span className="text-gradient-funk">1001</span>
          </span>
          <span className="block">
            Albums<span className="text-hotpink">.</span>
          </span>
          <span className="block">
            Before
          </span>
          <span className="block">
            You <span className="text-gradient-funk">Die</span><span className="text-lime">.</span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-3 sm:mt-5 max-w-2xl font-grotesk text-sm sm:text-lg text-muted-foreground"
        >
          A funky, opinionated guide to the records that matter. Dive in by genre, artist, letter or
          length — every cover, every note, a reason to press play.
        </motion.p>

        {/* stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-6 flex flex-wrap gap-x-8 gap-y-3"
        >
          <Stat n={total} label="Albums" color="var(--hotpink)" />
          <Stat n={artistCount} label="Artists" color="var(--lime)" />
          <Stat n={genreCount} label="Genres" color="var(--amber)" />
        </motion.div>
      </div>

      {/* marquee band */}
      <div className="relative border-t border-white/10 bg-black/30 py-2 font-mono-funk text-[11px] sm:text-xs tracking-[0.2em] text-foreground/70">
        <Marquee
          items={[
            "INDIE ROCK", "DREAM POP", "HIP HOP", "NEO-SOUL", "AFROBEAT", "KRAUTROCK",
            "POST-PUNK", "SYNTHPOP", "JAZZ", "FUNK", "AMBIENT", "BOSSA NOVA",
            "POST-ROCK", "ELECTRONIC", "REGGAE", "PSYCHEDELIC", "BRITPOP", "TRIP HOP",
          ]}
        />
      </div>
    </header>
  );
}

function Stat({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-display text-4xl leading-none" style={{ color }}>
        {n.toLocaleString()}
      </span>
      <span className="font-mono-funk text-[11px] tracking-wider text-muted-foreground uppercase">
        <Sparkles className="mr-1 inline size-3" style={{ color }} />
        {label}
      </span>
    </div>
  );
}
