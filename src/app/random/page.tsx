"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, Dice5, RotateCcw, Music2 } from "lucide-react";
import type { Album, GenreInfo } from "@/lib/albums-client";
import { AlbumModal } from "@/components/album-modal";
import { TopNav } from "@/components/top-nav";

export default function RandomPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [genres, setGenres] = useState<GenreInfo[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [picked, setPicked] = useState<Album | null>(null);
  const [openAlbum, setOpenAlbum] = useState<Album | null>(null);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/albums");
      const j = await res.json();
      setAlbums(j.albums);
      setGenres(j.genres);
    })();
  }, []);

  const pool = useMemo(() => {
    if (!selected.length) return albums;
    return albums.filter((a) => selected.every((g) => a.genres.includes(g)));
  }, [albums, selected]);

  const pickRandom = () => {
    if (!pool.length) return;
    setSpinning(true);
    setPicked(null);
    // cycle a few preview picks for effect
    let cycles = 0;
    const iv = setInterval(() => {
      const r = pool[Math.floor(Math.random() * pool.length)];
      setPicked(r);
      cycles++;
      if (cycles > 12) {
        clearInterval(iv);
        setSpinning(false);
      }
    }, 80);
  };

  const toggleGenre = (g: string) =>
    setSelected((s) => (s.includes(g) ? s.filter((x) => x !== g) : [...s, g]));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopNav active="random" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 pt-20 pb-10 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 font-mono-funk text-[11px] tracking-[0.25em] text-lime"
        >
          <Shuffle className="size-4" /> THE RANDOM CRATE
        </motion.div>
        <h1 className="mt-3 text-center font-display text-6xl uppercase tracking-tight sm:text-8xl">
          <span className="text-gradient-funk">Roll</span> the dice
        </h1>
        <p className="mt-4 max-w-xl text-center font-grotesk text-muted-foreground">
          Pick the genres you're in the mood for (or none at all) and let fate choose your next
          listen. Selecting multiple genres shows only albums that have ALL of them.
        </p>

        {/* Genre picker */}
        <div className="mt-8 w-full">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">
              Genres {selected.length > 0 && <span className="text-lime">({selected.length} selected)</span>}
            </h2>
            {selected.length > 0 && (
              <button
                onClick={() => setSelected([])}
                className="font-mono-funk text-[10px] tracking-wider text-muted-foreground hover:text-foreground"
              >
                CLEAR
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {genres.slice(0, 80).map((g) => {
              const active = selected.includes(g.name);
              return (
                <button
                  key={g.name}
                  onClick={() => toggleGenre(g.name)}
                  className={`rounded-full border px-2.5 py-1 font-mono-funk text-[10px] tracking-wide transition-all ${
                    active
                      ? "border-transparent bg-hotpink text-black"
                      : "border-white/15 text-foreground/75 hover:scale-105 hover:border-hotpink"
                  }`}
                >
                  {g.name}
                  <span className="ml-1 opacity-50">{g.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pool info + roll button */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="font-mono-funk text-xs tracking-wider text-muted-foreground">
            POOL: <span className="text-lime">{pool.length.toLocaleString()}</span> ALBUMS
          </p>
          <button
            onClick={pickRandom}
            disabled={spinning || !pool.length}
            className="group flex items-center gap-3 rounded-full bg-lime px-8 py-4 font-display text-xl uppercase tracking-tight text-black shadow-lg transition hover:scale-105 disabled:opacity-50 glow-lime"
          >
            <Dice5 className={`size-6 ${spinning ? "animate-spin" : "group-hover:rotate-12"} transition-transform`} />
            {spinning ? "Rolling…" : "Roll the dice"}
          </button>
        </div>

        {/* Result */}
        <AnimatePresence mode="wait">
          {picked && (
            <motion.div
              key={picked.id + (spinning ? "-s" : "-f")}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="mt-10 flex w-full max-w-md flex-col items-center"
            >
<button
                onClick={() => setOpenAlbum(picked)}
                className="relative aspect-square w-full max-w-xs overflow-hidden rounded-xl ring-1 ring-white/10 transition hover:scale-105"
                style={{ boxShadow: "0 20px 60px -20px var(--hotpink)" }}
              >
                {picked.cover ? (
                  <img
                    src={picked.cover}
                    alt={picked.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-card p-4 text-center">
                    <span className="font-display text-2xl uppercase">{picked.title}</span>
                  </div>
                )}
              </button>
              <h3 className="mt-4 font-display text-3xl uppercase tracking-tight">{picked.title}</h3>
              <p className="font-grotesk text-lg text-muted-foreground">{picked.artist}</p>
              <div className="mt-2 flex gap-2 font-mono-funk text-[10px] tracking-wider">
                <span className="rounded-md bg-lime/15 px-2 py-0.5 text-lime">{picked.year}</span>
                <span className="rounded-md bg-amber/15 px-2 py-0.5 text-amber">{picked.duration}m</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setOpenAlbum(picked)}
                  className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 font-mono-funk text-[11px] tracking-wider transition hover:bg-hotpink hover:text-black"
                >
                  <Music2 className="size-3.5" /> VIEW TRACKS
                </button>
                <button
                  onClick={pickRandom}
                  disabled={spinning}
                  className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 font-mono-funk text-[11px] tracking-wider transition hover:bg-lime hover:text-black"
                >
                  <RotateCcw className="size-3.5" /> ROLL AGAIN
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <AlbumModal album={openAlbum} onClose={() => setOpenAlbum(null)} />
    </div>
  );
}
