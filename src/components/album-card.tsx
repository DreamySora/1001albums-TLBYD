"use client";

import { motion } from "framer-motion";
import type { Album } from "@/lib/albums-client";
import { cn } from "@/lib/utils";

const ACCENTS = ["var(--hotpink)", "var(--lime)", "var(--amber)", "var(--grape)", "var(--cyan)"];

function hashStr(s: string, n: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % n;
}

export function AlbumCard({ album, index, onGenre, onArtist }: {
  album: Album;
  index: number;
  onGenre: (g: string) => void;
  onArtist: (a: string) => void;
}) {
  const accent = ACCENTS[hashStr(album.artist, ACCENTS.length)];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.015, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col break-inside-avoid"
    >
      <div
        className="relative aspect-square overflow-hidden rounded-xl bg-card ring-1 ring-white/10"
        style={{ boxShadow: `0 10px 40px -16px ${accent}` }}
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
        <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/95 via-black/40 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <p className="text-[11px] leading-snug text-foreground/90 line-clamp-6">
            {album.description}
          </p>
        </div>
      </div>

      {/* title + artist */}
      <div className="mt-3 px-0.5">
        <h3 className="font-display text-lg leading-tight tracking-tight uppercase text-foreground">
          {album.title}
        </h3>
        <button
          onClick={() => onArtist(album.artist)}
          className="mt-0.5 block text-left font-grotesk text-sm font-medium text-muted-foreground transition-colors hover:text-hotpink"
        >
          {album.artist}
        </button>

        {/* genre badges */}
        <div className="mt-2 flex flex-wrap gap-1">
          {album.genres.map((g, i) => (
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
