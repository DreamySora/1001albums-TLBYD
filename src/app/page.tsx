"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Disc3, Loader2, Ghost, ArrowUp } from "lucide-react";
import { Hero } from "@/components/hero";
import { FilterBar } from "@/components/filter-bar";
import { AlbumCard } from "@/components/album-card";
import {
  applyFilters,
  type Album,
  type Filters,
  type GenreInfo,
  type ArtistInfo,
} from "@/lib/albums-client";

const INITIAL_VISIBLE = 48;
const LOAD_STEP = 48;

export default function Page() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [genres, setGenres] = useState<GenreInfo[]>([]);
  const [artists, setArtists] = useState<ArtistInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<Filters>({
    search: "",
    genres: [],
    artist: null,
    letter: null,
    duration: "all",
    sort: "default",
  });
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/albums");
        const json = await res.json();
        if (!alive) return;
        setAlbums(json.albums);
        setGenres(json.genres);
        setArtists(json.artists);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => applyFilters(albums, filters), [albums, filters]);
  const shown = filtered.slice(0, visible);

  // reset visible when filters change
  useEffect(() => setVisible(INITIAL_VISIBLE), [filters]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible((v) => Math.min(v + LOAD_STEP, filtered.length));
        }
      },
      { rootMargin: "800px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [filtered.length]);

  const onGenre = useCallback((g: string) => {
    setFilters((f) => ({
      ...f,
      genres: f.genres.includes(g) ? f.genres.filter((x) => x !== g) : [...f.genres, g],
    }));
    window.scrollTo({ top: 280, behavior: "smooth" });
  }, []);

  const onArtist = useCallback((a: string) => {
    setFilters((f) => ({ ...f, artist: f.artist === a ? null : a }));
    window.scrollTo({ top: 280, behavior: "smooth" });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* sticky top nav */}
      <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-white/10 bg-background/85 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-2">
          <Disc3 className="size-5 animate-[spin_6s_linear_infinite] text-hotpink" />
          <span className="font-display text-lg tracking-tight uppercase">
            1001<span className="text-lime">.</span>
          </span>
          <span className="hidden font-mono-funk text-[10px] tracking-[0.2em] text-muted-foreground sm:inline">
            ALBUMS BEFORE YOU DIE
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono-funk text-[10px] tracking-wider text-muted-foreground">
          <span className="hidden sm:inline">EST. 2025</span>
          <span className="rounded-full border border-lime/40 px-2 py-0.5 text-lime">DARK MODE ONLY</span>
        </div>
      </nav>

      <Hero total={albums.length} genreCount={genres.length} artistCount={artists.length} />

      <FilterBar
        filters={filters}
        setFilters={setFilters}
        genres={genres}
        artists={artists}
        resultCount={filtered.length}
      />

      <main className="mx-auto w-full max-w-[1800px] flex-1 px-4 py-8 sm:px-6">
        {loading ? (
          <SkeletonGrid />
        ) : filtered.length === 0 ? (
          <EmptyState onClear={() => setFilters({ search: "", genres: [], artist: null, letter: null, duration: "all", sort: filters.sort })} />
        ) : (
          <>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-2xl uppercase tracking-tight">
                {filters.artist ? (
                  <>The <span className="text-hotpink">{filters.artist}</span> selection</>
                ) : filters.genres.length === 1 ? (
                  <>Digging: <span className="text-lime">{filters.genres[0]}</span></>
                ) : filters.genres.length > 1 ? (
                  <>Digging: <span className="text-lime">{filters.genres.length} genres</span></>
                ) : (
                  <>The full crate</>
                )}
              </h2>
              <span className="font-mono-funk text-[11px] tracking-wider text-muted-foreground">
                {shown.length} / {filtered.length}
              </span>
            </div>

            <motion.div
              layout
              className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            >
              <AnimatePresence mode="popLayout">
                {shown.map((a, i) => (
                  <AlbumCard key={a.id} album={a} index={i} onGenre={onGenre} onArtist={onArtist} />
                ))}
              </AnimatePresence>
            </motion.div>

            {visible < filtered.length && (
              <div ref={sentinelRef} className="flex items-center justify-center py-12">
                <Loader2 className="size-5 animate-spin text-lime" />
                <span className="ml-2 font-mono-funk text-xs tracking-wider text-muted-foreground">
                  loading more wax…
                </span>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="flex flex-col">
          <div className="aspect-square animate-pulse rounded-xl bg-card ring-1 ring-white/10" />
          <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-card" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-card" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <Ghost className="size-12 text-grape" />
      <h3 className="mt-4 font-display text-2xl uppercase">No records match</h3>
      <p className="mt-2 max-w-md font-grotesk text-sm text-muted-foreground">
        That crate's empty, friend. Try loosening a filter or clearing the lot.
      </p>
      <button
        onClick={onClear}
        className="mt-5 rounded-full bg-lime px-5 py-2 font-mono-funk text-xs tracking-wider text-black transition hover:scale-105"
      >
        CLEAR ALL FILTERS
      </button>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/40">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-2 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <Disc3 className="size-4 text-hotpink" />
          <span className="font-display text-sm uppercase tracking-tight">1001.</span>
          <span className="font-mono-funk text-[10px] tracking-wider text-muted-foreground">
            a curated crate · made for listening
          </span>
        </div>
        <p className="font-mono-funk text-[10px] tracking-wider text-muted-foreground">
          No metal · No country · No filler — only the good stuff. ✦
        </p>
      </div>
    </footer>
  );
}

function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 900);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 flex size-11 items-center justify-center rounded-full bg-hotpink text-black shadow-lg transition hover:scale-110 glow-pink"
          aria-label="Back to top"
        >
          <ArrowUp className="size-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
