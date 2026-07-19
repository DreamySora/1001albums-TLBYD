"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Hero } from "@/components/hero";
import { FilterBar } from "@/components/filter-bar";
import { AlbumCard } from "@/components/album-card";
import { AlbumModal } from "@/components/album-modal";
import { TopNav } from "@/components/top-nav";
import { AlbumOfTheDay } from "@/components/album-of-the-day";
import {
  applyFilters,
  type Album,
  type Filters,
  type GenreInfo,
  type ArtistInfo,
} from "@/lib/albums-client";
import { SkeletonGrid, EmptyState, Footer, BackToTop } from "@/app/page-helpers";

const INITIAL_VISIBLE = 48;
const LOAD_STEP = 48;

export default function PageContent({
  initialAlbums,
  initialGenres,
  initialArtists,
  albumOfTheDay,
  timeUntilChange,
}: {
  initialAlbums: Album[];
  initialGenres: GenreInfo[];
  initialArtists: ArtistInfo[];
  albumOfTheDay: Album;
  timeUntilChange: { hours: number; minutes: number; seconds: number };
}) {
  const [albums] = useState<Album[]>(initialAlbums);
  const [genres] = useState<GenreInfo[]>(initialGenres);
  const [artists] = useState<ArtistInfo[]>(initialArtists);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    genres: [],
    artist: null,
    letter: null,
    duration: "all",
    sort: "default",
  });
  const [visible, setVisible] = useState(INITIAL_VISIBLE);
  const [openAlbum, setOpenAlbum] = useState<Album | null>(null);

  const filtered = useMemo(() => applyFilters(albums, filters), [albums, filters]);
  const shown = filtered.slice(0, visible);

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

  const onOpen = useCallback((a: Album) => setOpenAlbum(a), []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setVisible(INITIAL_VISIBLE); }, [filters]);

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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopNav active="home" />
      <Hero total={albums.length} genreCount={genres.length} artistCount={artists.length} />
      <div className="mx-auto w-full max-w-[1800px] px-3 sm:px-6 py-2">
        <AlbumOfTheDay album={albumOfTheDay} timeUntilChange={timeUntilChange} onOpen={onOpen} compact />
      </div>
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
          <EmptyState
            onClear={() => setFilters({ search: "", genres: [], artist: null, letter: null, duration: "all", sort: filters.sort })}
          />
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
              className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
            >
              <AnimatePresence>
                {shown.map((a, i) => (
                  <AlbumCard key={a.id} album={a} index={i} onGenre={onGenre} onArtist={onArtist} onOpen={onOpen} />
                ))}
              </AnimatePresence>
            </motion.div>

            {visible < filtered.length && (
              <div ref={sentinelRef} className="flex items-center justify-center py-12">
                <Loader2 className="size-5 animate-spin text-lime" />
                <span className="ml-2 font-mono-funk text-xs tracking-wider text-muted-foreground">
                  loading more wax...
                </span>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
      <BackToTop />
      <AlbumModal album={openAlbum} onClose={() => setOpenAlbum(null)} />
    </div>
  );
}