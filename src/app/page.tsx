"use client";

import { useEffect, useMemo, useRef, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Disc3, Loader2, Ghost, ArrowUp } from "lucide-react";
import { Hero } from "@/components/hero";
import { FilterBar } from "@/components/filter-bar";
import { AlbumCard } from "@/components/album-card";
import { AlbumModal } from "@/components/album-modal";
import { TopNav } from "@/components/top-nav";
import {
  applyFilters,
  type Album,
  type Filters,
  type GenreInfo,
  type ArtistInfo,
} from "@/lib/albums-client";

const INITIAL_VISIBLE = 48;
const LOAD_STEP = 48;

function filtersToParams(f: Filters): URLSearchParams {
  const params = new URLSearchParams();
  if (f.search) params.set("q", f.search);
  if (f.genres.length) params.set("genres", f.genres.join(","));
  if (f.artist) params.set("artist", f.artist);
  if (f.letter) params.set("letter", f.letter);
  if (f.duration !== "all") params.set("duration", f.duration);
  if (f.sort !== "default") params.set("sort", f.sort);
  return params;
}

function paramsToFilters(params: URLSearchParams): Filters {
  return {
    search: params.get("q") ?? "",
    genres: params.get("genres")?.split(",").filter(Boolean) ?? [],
    artist: params.get("artist") ?? null,
    letter: params.get("letter") ?? null,
    duration: (params.get("duration") as Filters["duration"]) ?? "all",
    sort: (params.get("sort") as Filters["sort"]) ?? "default",
  };
}

function PageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [albums, setAlbums] = useState<Album[]>([]);
  const [genres, setGenres] = useState<GenreInfo[]>([]);
  const [artists, setArtists] = useState<ArtistInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize filters from URL params
  const [filters, setFilters] = useState<Filters>(() => paramsToFilters(searchParams));
  const [visible, setVisible] = useState(INITIAL_VISIBLE);
  const [openAlbum, setOpenAlbum] = useState<Album | null>(null);

  // Sync filters to URL
  useEffect(() => {
    const params = filtersToParams(filters);
    const newUrl = `${pathname}?${params.toString()}`;
    if (newUrl !== window.location.href) {
      router.replace(newUrl, { scroll: false });
    }
  }, [filters, router, pathname]);

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

  const onOpen = useCallback((a: Album) => setOpenAlbum(a), []);

  // Keyboard navigation for album grid
  useEffect(() => {
    if (openAlbum) return; // Don't navigate grid when modal is open
    
    const onKeyDown = (e: KeyboardEvent) => {
      // Focus search on '/' key (when not typing in input)
      if (e.key === "/" && e.target instanceof HTMLElement && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        searchInput?.focus();
        return;
      }
      
      const cards = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-album-card]'));
      const focusedIndex = cards.findIndex((c) => c === document.activeElement);
      
      if (focusedIndex >= 0) {
        const getGridCols = () => {
          const w = window.innerWidth;
          if (w >= 1536) return 7; // 2xl
          if (w >= 1280) return 6; // xl
          if (w >= 1024) return 5; // lg
          if (w >= 768) return 4; // md
          if (w >= 640) return 3; // sm
          return 2;
        };
        
        if (e.key === "ArrowRight") {
          e.preventDefault();
          cards[(focusedIndex + 1) % cards.length]?.focus();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          cards[(focusedIndex - 1 + cards.length) % cards.length]?.focus();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          const cols = getGridCols();
          cards[Math.min(focusedIndex + cols, cards.length - 1)]?.focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          const cols = getGridCols();
          cards[Math.max(focusedIndex - cols, 0)]?.focus();
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          cards[focusedIndex]?.click();
        }
      }
    };
    
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openAlbum, filtered.length]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopNav active="home" />

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
                  loading more wax…
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

export default function Page() {
  return (
    <Suspense fallback={<SkeletonGrid />}>
      <PageContent />
    </Suspense>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
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
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-4 right-4 z-50 flex size-9 items-center justify-center rounded-full bg-hotpink text-black shadow-lg transition hover:scale-105 glow-pink sm:bottom-6 sm:right-6 sm:size-11 safe-bottom"
          aria-label="Back to top"
        >
          <ArrowUp className="size-4 sm:size-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
