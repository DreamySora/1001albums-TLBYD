"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Album } from "@/lib/albums-client";
import { cn } from "@/lib/utils";
import { getDominantColors, blendColors, rgbToCss, type RGB } from "@/lib/colors";

const ACCENTS = ["var(--hotpink)", "var(--lime)", "var(--amber)", "var(--grape)", "var(--cyan)"];

function hashStr(s: string, n: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % n;
}

export function AlbumCard({ album, index, onGenre, onArtist, onOpen }: {
  album: Album;
  index: number;
  onGenre: (g: string) => void;
  onArtist: (a: string) => void;
  onOpen: (a: Album) => void;
}) {
  const fallbackAccent = ACCENTS[hashStr(album.artist, ACCENTS.length)];
  const [glowColor, setGlowColor] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!album.cover) return;
    getDominantColors(album.cover, 3).then((colors: RGB[]) => {
      if (!alive || !colors.length) return;
      const blended = blendColors(colors);
      if (blended) setGlowColor(rgbToCss(blended, 0.7));
    });
    return () => {
      alive = false;
    };
  }, [album.cover]);

  const accent = glowColor ?? fallbackAccent;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.015, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col break-inside-avoid"
    >
      <button
        type="button"
        onClick={() => onOpen(album)}
        className="relative block aspect-square w-full overflow-hidden rounded-xl bg-card text-left ring-1 ring-white/10 transition-transform duration-300 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-hotpink"
        style={{ boxShadow: `0 14px 60px -12px ${accent}, 0 0 24px -8px ${accent}` }}
        aria-label={`Open ${album.title} by ${album.artist}`}
      >
        {album.cover ? (
          <img
            src={album.cover}
            alt={`${album.title} — ${album.artist} cover`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center p-3 text-center"
            style={{ background: `linear-gradient(140deg, ${accent}, oklch(0.16 0.01 60))` }}
          >
            <span className="font-display text-2xl leading-none text-black/80 uppercase">
              {album.title}
            </span>
          </div>
        )}

        {/* year sticker */}
        <span className="absolute left-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 font-mono-funk text-[10px] tracking-wider text-lime backdrop-blur-sm">
          {album.year}
        </span>
        <span className="absolute right-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 font-mono-funk text-[10px] tracking-wider text-amber backdrop-blur-sm">
          {album.duration}m
        </span>

        {/* hover overlay with description */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/40 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <p className="line-clamp-5 text-[11px] leading-snug text-foreground/90">{album.description}</p>
          <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-lime px-2 py-0.5 font-mono-funk text-[9px] tracking-wider text-black">
            VIEW TRACKS →
          </span>
        </div>
      </button>

      {/* title + artist */}
      <div className="mt-3 px-0.5">
        <button
          type="button"
          onClick={() => onOpen(album)}
          className="block text-left"
        >
          <h3 className="font-display text-lg leading-tight tracking-tight uppercase text-foreground">
            {album.title}
          </h3>
        </button>
        <button
          onClick={() => onArtist(album.artist)}
          className="mt-0.5 block text-left font-grotesk text-sm font-medium text-muted-foreground transition-colors hover:text-hotpink"
        >
          {album.artist}
        </button>

        {/* genre badges */}
        <div className="mt-2 flex flex-wrap gap-1">
          {album.genres.map((g) => (
            <button
              key={g}
              onClick={() => onGenre(g)}
              className={cn(
                "rounded-full border px-1.5 py-0.5 font-mono-funk text-[9px] tracking-wide transition-all",
                "border-white/15 text-foreground/70 hover:scale-105 hover:border-transparent hover:text-black"
              )}
              style={{ ["--g" as string]: ACCENTS[hashStr(g, ACCENTS.length)] }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = (e.currentTarget.style.getPropertyValue("--g") || accent);
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "";
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </motion.article>
  );
}
