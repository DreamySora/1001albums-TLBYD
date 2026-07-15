"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Disc3, RotateCcw, Music2 } from "lucide-react";
import type { Album, GenreInfo } from "@/lib/albums-client";
import { AlbumModal } from "@/components/album-modal";
import { TopNav } from "@/components/top-nav";

const ACCENTS = ["#ff4d8d", "#a3e635", "#f5a524", "#a855f7", "#22d3ee"]; // hotpink, lime, amber, grape, cyan

export default function WheelPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [genres, setGenres] = useState<GenreInfo[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<Album | null>(null);
  const [openAlbum, setOpenAlbum] = useState<Album | null>(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const wheelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/albums");
      const j = await res.json();
      // Use ALL albums — the wheel shows every record for the selected genres.
      setAlbums(j.albums as Album[]);
      setGenres(j.genres);
    })();
  }, []);

  const pool = useMemo(() => {
    if (!selected.length) return albums;
    return albums.filter((a) => selected.every((g) => a.genres.includes(g)));
  }, [albums, selected]);

  const sliceAngle = pool.length ? 360 / pool.length : 0;

  const spin = () => {
    if (!pool.length || spinning) return;
    setResult(null);
    setSpinning(true);
    const winnerIdx = Math.floor(Math.random() * pool.length);
    // pointer at top (0deg / -90 in standard). We want winner slice centered under pointer.
    const targetAngle = 360 * 6 + (360 - (winnerIdx * sliceAngle + sliceAngle / 2));
    setRotation((prev) => prev + targetAngle - (prev % 360));
    setTimeout(() => {
      setResult(pool[winnerIdx]);
      setSpinning(false);
    }, 4200);
  };

  const toggleGenre = (g: string) =>
    setSelected((s) => (s.includes(g) ? s.filter((x) => x !== g) : [...s, g]));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopNav active="wheel" />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 py-8 sm:px-6">
        <div className="flex items-center gap-2 font-mono-funk text-[11px] tracking-[0.25em] text-amber">
          <Disc3 className="size-4" /> SPIN THE WHEEL
        </div>
        <h1 className="mt-3 text-center font-display text-5xl uppercase tracking-tight sm:text-7xl">
          Wheel of <span className="text-gradient-funk">Fate</span>
        </h1>
        <p className="mt-3 max-w-xl text-center font-grotesk text-sm text-muted-foreground">
          All {albums.length.toLocaleString()} records are on the wheel. Filter by genre to narrow it down —
          selecting multiple genres shows only albums that have ALL of them.
        </p>

        {/* Genre filter (compact) */}
        <div className="mt-6 flex max-w-3xl flex-wrap justify-center gap-1.5">
          {genres.slice(0, 40).map((g) => {
            const active = selected.includes(g.name);
            return (
              <button
                key={g.name}
                onClick={() => toggleGenre(g.name)}
                className={`rounded-full border px-2 py-0.5 font-mono-funk text-[9px] tracking-wide transition-all ${
                  active ? "border-transparent bg-hotpink text-black" : "border-white/15 text-foreground/70 hover:border-hotpink"
                }`}
              >
                {g.name}
              </button>
            );
          })}
        </div>

        {/* Wheel */}
        <div className="relative mt-8 flex flex-col items-center">
          {/* pointer */}
          <div className="absolute -top-1 left-1/2 z-20 -translate-x-1/2">
            <div className="h-0 w-0 border-x-[12px] border-t-[20px] border-x-transparent border-t-lime drop-shadow-lg" />
          </div>

          <motion.div
            ref={wheelRef}
            animate={{ rotate: rotation }}
            transition={{ duration: 4, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-full border-4 border-white/10 shadow-2xl"
            style={{
              width: "min(90vw, 440px)",
              height: "min(90vw, 440px)",
              boxShadow: "0 0 80px -10px var(--hotpink)",
            }}
          >
            {pool.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center font-mono-funk text-xs text-muted-foreground">
                no albums match
              </div>
            ) : (
              <svg viewBox="0 0 100 100" className="h-full w-full">
                {pool.map((a, i) => {
                  const start = i * sliceAngle - 90;
                  const end = start + sliceAngle;
                  const path = describeArc(50, 50, 49, start, end);
                  const color = ACCENTS[i % ACCENTS.length];
                  const midAngle = (start + end) / 2;
                  // Hide text labels when slices are too thin to be legible.
                  const showLabel = sliceAngle >= 6;
                  const labelRadius = 32;
                  const lx = 50 + labelRadius * Math.cos((midAngle * Math.PI) / 180);
                  const ly = 50 + labelRadius * Math.sin((midAngle * Math.PI) / 180);
                  return (
                    <g key={a.id}>
                      <path
                        d={path}
                        fill={color}
                        fillOpacity={0.85}
                        stroke="rgba(0,0,0,0.3)"
                        strokeWidth={pool.length > 200 ? 0.05 : 0.2}
                      />
                      {showLabel && (
                        <text
                          x={lx}
                          y={ly}
                          fill="#0a0a0a"
                          fontSize={sliceAngle > 20 ? 2.6 : sliceAngle > 10 ? 1.8 : 1.2}
                          fontWeight={700}
                          textAnchor="middle"
                          transform={`rotate(${midAngle}, ${lx}, ${ly})`}
                          style={{ fontFamily: "var(--font-space-mono), monospace" }}
                        >
                          {a.artist.length > 12 ? a.artist.slice(0, 11) + "…" : a.artist}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            )}
          </motion.div>

          <button
            onClick={spin}
            disabled={spinning || !pool.length}
            className="mt-8 flex items-center gap-2 rounded-full bg-amber px-8 py-3 font-display text-lg uppercase tracking-tight text-black shadow-lg transition hover:scale-105 disabled:opacity-50"
            style={{ boxShadow: "0 0 30px -6px var(--amber)" }}
          >
            <Disc3 className={`size-5 ${spinning ? "animate-spin" : ""}`} />
            {spinning ? "Spinning…" : "SPIN"}
          </button>
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mt-8 flex flex-col items-center"
            >
              <p className="font-mono-funk text-[11px] tracking-[0.25em] text-lime">YOUR RECORD IS</p>
              <button
                onClick={() => setOpenAlbum(result)}
                className="mt-3 flex flex-col items-center"
              >
                <div className="size-[min(80vw,160px)] overflow-hidden rounded-xl ring-1 ring-white/10">
{result.cover ? (
                      <img
                        src={result.cover}
                        alt={result.title}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                    <div className="flex h-full w-full items-center justify-center bg-card p-2 text-center">
                      <span className="font-display text-sm uppercase">{result.title}</span>
                    </div>
                  )}
                </div>
                <h3 className="mt-3 font-display text-2xl uppercase">{result.title}</h3>
                <p className="font-grotesk text-base text-muted-foreground">{result.artist}</p>
              </button>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setOpenAlbum(result)}
                  className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 font-mono-funk text-[11px] tracking-wider transition hover:bg-hotpink hover:text-black"
                >
                  <Music2 className="size-3.5" /> VIEW TRACKS
                </button>
                <button
                  onClick={spin}
                  disabled={spinning}
                  className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 font-mono-funk text-[11px] tracking-wider transition hover:bg-amber hover:text-black"
                >
                  <RotateCcw className="size-3.5" /> SPIN AGAIN
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

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const polar = (angle: number) => {
    const rad = ((angle - 0) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const start = polar(startAngle);
  const end = polar(endAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}
