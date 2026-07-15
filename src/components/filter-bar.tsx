"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, SlidersHorizontal, Users, ChevronDown, ChevronUp, Grid } from "lucide-react";
import {
  DURATION_BUCKETS,
  SORT_OPTIONS,
  LETTERS,
  artistLetter,
  type Filters,
  type GenreInfo,
  type ArtistInfo,
} from "@/lib/albums-client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const ACCENTS = ["var(--hotpink)", "var(--lime)", "var(--amber)", "var(--grape)", "var(--cyan)"];
function hashStr(s: string, n: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % n;
}

export function FilterBar({
  filters,
  setFilters,
  genres,
  artists,
  resultCount,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  genres: GenreInfo[];
  artists: ArtistInfo[];
  resultCount: number;
}) {
  const toggleGenre = (g: string) => {
    const has = filters.genres.includes(g);
    setFilters({ ...filters, genres: has ? filters.genres.filter((x) => x !== g) : [...filters.genres, g] });
  };

  const activeCount =
    filters.genres.length +
    (filters.artist ? 1 : 0) +
    (filters.letter ? 1 : 0) +
    (filters.duration !== "all" ? 1 : 0) +
    (filters.search ? 1 : 0);

  const clearAll = () =>
    setFilters({ search: "", genres: [], artist: null, letter: null, duration: "all", sort: filters.sort });

  const [showAllGenres, setShowAllGenres] = useState(false);
  const visibleGenres = showAllGenres ? genres : genres.slice(0, 120);
  const [artistSearch, setArtistSearch] = useState("");

  return (
    <div className="sticky top-14 z-40 border-y border-white/10 bg-background/85 backdrop-blur-xl sm:top-[57px]">
      {/* Row 1: search + sort + artist + count */}
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-1.5 px-2 py-2 sm:gap-2 sm:px-3 sm:py-2.5">
        <div className="relative min-w-[140px] flex-1 sm:min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search…"
            className="border-white/15 bg-card/60 pl-8 font-grotesk text-xs sm:text-sm h-8"
          />
        </div>

        {/* sort */}
        <select
          aria-label="Sort"
          value={filters.sort}
          onChange={(e) => setFilters({ ...filters, sort: e.target.value as Filters["sort"] })}
          className="h-8 rounded-md border border-white/15 bg-card/60 px-2 font-mono-funk text-[10px] tracking-wide text-foreground outline-none transition hover:border-hotpink sm:h-9"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.id} value={o.id} className="bg-card">
              {o.label}
            </option>
          ))}
        </select>

        {/* artist picker - Popover on desktop, Sheet on mobile */}
        <Popover>
          <PopoverTrigger asChild>
            <Sheet>
              <SheetTrigger asChild>
                <button className="flex h-8 items-center gap-1 rounded-md border border-white/15 bg-card/60 px-2.5 font-mono-funk text-[10px] tracking-wide text-foreground transition hover:border-lime sm:h-9 sm:px-3 sm:text-[11px]">
                  <Users className="size-3 sm:size-3.5" /> <span className="hidden sm:inline">ARTISTS</span>
                </button>
              </SheetTrigger>
              <SheetContent className="w-full max-w-sm p-0 sm:hidden">
                <div className="sticky top-0 bg-popover p-1.5 pb-1">
                  <Input
                    placeholder="Filter artists…"
                    value={artistSearch}
                    onChange={(e) => setArtistSearch(e.target.value.toLowerCase())}
                    className="h-7 border-white/15 bg-card/60 font-grotesk text-xs"
                    id="artist-filter-mobile"
                  />
                </div>
                <div className="max-h-[55vh] overflow-y-auto p-0.5 scrollbar-funky">
                  {artists
                    .filter((a) => a.name.toLowerCase().includes(artistSearch))
                    .map((a) => (
                      <button
                        key={a.name}
                        onClick={() => {
                          setFilters({ ...filters, artist: filters.artist === a.name ? null : a.name });
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded px-2 py-1 text-left font-grotesk text-xs transition",
                          filters.artist === a.name ? "bg-hotpink text-black" : "hover:bg-white/5"
                        )}
                      >
                        <span className="truncate">{a.name}</span>
                        <span className="ml-2 shrink-0 font-mono-funk text-[9px] opacity-60">{a.count}</span>
                      </button>
                    ))}
                </div>
              </SheetContent>
            </Sheet>
          </PopoverTrigger>
          <PopoverContent
            className="max-h-[60vh] w-[320px] overflow-y-auto border-white/15 bg-popover p-0 scrollbar-funky"
            align="end"
            sideOffset={8}
          >
            <div className="sticky top-0 bg-popover p-1.5 pb-1">
              <Input
                placeholder="Filter artists…"
                className="h-7 border-white/15 bg-card/60 font-grotesk text-xs"
                id="artist-filter-desktop"
                onChange={(e) => {
                  const v = e.target.value.toLowerCase();
                  const items = document.querySelectorAll<HTMLElement>("[data-artist-name]");
                  items.forEach((it) => {
                    it.style.display = it.dataset.artistName?.toLowerCase().includes(v) ? "" : "none";
                  });
                }}
              />
            </div>
            <ul className="p-0.5">
              {artists.map((a) => (
                <li key={a.name}>
                  <button
                    data-artist-name={a.name}
                    onClick={() => setFilters({ ...filters, artist: filters.artist === a.name ? null : a.name })}
                    className={cn(
                      "flex w-full items-center justify-between rounded px-2 py-1 text-left font-grotesk text-sm transition",
                      filters.artist === a.name ? "bg-hotpink text-black" : "hover:bg-white/5"
                    )}
                  >
                    <span className="truncate">{a.name}</span>
                    <span className="ml-2 shrink-0 font-mono-funk text-[10px] opacity-60">{a.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-1.5 font-mono-funk text-[10px] tracking-wider text-muted-foreground">
          <span className="text-lime">{resultCount.toLocaleString()}</span>
        </div>
      </div>

      {/* Row 2: genre chips (horizontal scroll with show all toggle on mobile) */}
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-[1800px] items-center gap-1.5 px-2 py-1.5 sm:gap-2 sm:px-3 sm:py-2">
          <SlidersHorizontal className="size-3 shrink-0 text-amber sm:size-3.5" />
          <div className="flex flex-1 gap-1 overflow-x-auto pb-0.5 scrollbar-funky">
            {visibleGenres.map((g) => {
              const active = filters.genres.includes(g.name);
              const color = ACCENTS[hashStr(g.name, ACCENTS.length)];
              return (
                <button
                  key={g.name}
                  onClick={() => toggleGenre(g.name)}
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 font-mono-funk text-[9px] tracking-wide transition-all",
                    active ? "border-transparent text-black" : "border-white/15 text-foreground/75 hover:scale-105"
                  )}
                  style={active ? { backgroundColor: color } : undefined}
                >
                  {g.name}
                  <span className="ml-0.5 opacity-50 text-[8px]">{g.count}</span>
                </button>
              );
            })}
          </div>
          {genres.length > 120 && (
            <button
              onClick={() => setShowAllGenres(!showAllGenres)}
              className="shrink-0 rounded-full border border-white/15 px-2 py-0.5 font-mono-funk text-[9px] tracking-wide text-muted-foreground transition hover:border-hotpink hover:text-foreground sm:px-2.5 sm:py-1 sm:text-[10px]"
            >
              {showAllGenres ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              <span className="ml-1 hidden sm:inline">{showAllGenres ? "LESS" : "MORE"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 3: letters + duration + active filters */}
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-3 gap-y-1.5 px-2 py-1.5 sm:gap-x-4 sm:gap-y-2 sm:px-3 sm:py-2">
          {/* letters - responsive grid on mobile */}
          <div className="flex flex-wrap items-center gap-0.5">
            {LETTERS.map((L) => (
              <button
                key={L}
                onClick={() => setFilters({ ...filters, letter: filters.letter === L ? null : L })}
                className={cn(
                  "size-5 rounded font-mono-funk text-[10px] transition-all",
                  filters.letter === L
                    ? "bg-lime text-black"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                {L}
              </button>
            ))}
          </div>

          <div className="hidden h-4 w-px bg-white/10 sm:block" />

          {/* duration */}
          <div className="flex items-center gap-0.5">
            {DURATION_BUCKETS.map((b) => (
              <button
                key={b.id}
                onClick={() => setFilters({ ...filters, duration: b.id })}
                className={cn(
                  "rounded-md px-1.5 py-0.5 font-mono-funk text-[9px] tracking-wide transition-all",
                  filters.duration === b.id
                    ? "bg-grape text-white"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* active filters */}
          <div className="ml-auto flex flex-wrap items-center gap-1">
            <AnimatePresence>
              {filters.artist && (
                <FilterPill label={filters.artist} onClear={() => setFilters({ ...filters, artist: null })} color="var(--hotpink)" />
              )}
              {filters.letter && (
                <FilterPill label={`Letter ${filters.letter}`} onClear={() => setFilters({ ...filters, letter: null })} color="var(--lime)" />
              )}
              {filters.genres.map((g) => (
                <FilterPill key={g} label={g} onClear={() => toggleGenre(g)} color={ACCENTS[hashStr(g, ACCENTS.length)]} />
              ))}
            </AnimatePresence>
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 rounded-full border border-white/20 px-1.5 py-0.5 font-mono-funk text-[9px] tracking-wide text-foreground/80 transition hover:border-destructive hover:text-destructive"
              >
                <X className="size-2.5" /> CLEAR
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterPill({ label, onClear, color }: { label: string; onClear: () => void; color: string }) {
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      className="flex items-center gap-1 rounded-full px-2 py-1 font-mono-funk text-[10px] tracking-wide text-black"
      style={{ backgroundColor: color }}
    >
      <span className="max-w-[140px] truncate">{label}</span>
      <button onClick={onClear} className="rounded-full hover:bg-black/20">
        <X className="size-3" />
      </button>
    </motion.span>
  );
}
