"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { Search, X, SlidersHorizontal, Users, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Grid, Check, X as XIcon } from "lucide-react";
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
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

const ACCENTS = ["var(--hotpink)", "var(--lime)", "var(--amber)", "var(--grape)", "var(--cyan)"];
function hashStr(s: string, n: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % n;
}

const DECADES = ["2020s", "2010s", "2000s", "1990s", "1980s", "1970s", "1960s", "1950s", "1940s"];

function isDecade(genre: string): boolean {
  return DECADES.includes(genre);
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
  const [showDecadePicker, setShowDecadePicker] = useState(false);
  const [artistSearch, setArtistSearch] = useState("");
  const genreScrollRef = useRef<HTMLDivElement>(null);
  const scrollGenres = useCallback((dir: "left" | "right") => {
    const el = genreScrollRef.current;
    if (!el) return;
    const amount = 200;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }, []);

  const { decadeGenres, otherGenres } = useMemo(() => {
    const decades: GenreInfo[] = [];
    const others: GenreInfo[] = [];
    for (const g of genres) {
      if (isDecade(g.name)) decades.push(g);
      else others.push(g);
    }
    decades.sort((a, b) => DECADES.indexOf(a.name) - DECADES.indexOf(b.name));
    return { decadeGenres: decades, otherGenres: others };
  }, [genres]);

  return (
    <div className="sticky top-14 z-40 border-y border-white/10 bg-background/85 backdrop-blur-xl">
      {/* Row 1: search + sort + artist + count */}
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-1 px-1.5 py-1.5 sm:gap-2 sm:px-3 sm:py-2.5">
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

        {/* artist picker - Sheet on mobile, Popover on desktop (mutually exclusive) */}

        {/* Mobile: Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="sm:hidden flex h-8 items-center gap-1 rounded-md border border-white/15 bg-card/60 px-2.5 font-mono-funk text-[10px] tracking-wide text-foreground transition hover:border-lime">
              <Users className="size-3" /> ARTISTS
            </button>
          </SheetTrigger>
          <SheetContent className="w-full max-w-sm p-0" side="bottom">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <span className="font-mono-funk text-[10px] tracking-wider text-muted-foreground uppercase">Artists</span>
              <SheetClose className="rounded-full bg-white/10 p-1.5 text-foreground transition hover:bg-white/20">
                <X className="size-4" />
              </SheetClose>
            </div>
            <div className="sticky top-0 bg-popover p-1.5 pb-1">
              <Input
                placeholder="Filter artists…"
                value={artistSearch}
                onChange={(e) => setArtistSearch(e.target.value.toLowerCase())}
                className="h-9 border-white/15 bg-card/60 font-grotesk text-sm"
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
                      "flex w-full items-center justify-between rounded px-3 py-2 text-left font-grotesk text-sm transition min-h-[44px]",
                      filters.artist === a.name ? "bg-hotpink text-black" : "hover:bg-white/5"
                    )}
                  >
                    <span className="truncate">{a.name}</span>
                    <span className="ml-2 shrink-0 font-mono-funk text-[10px] opacity-60">{a.count}</span>
                  </button>
                ))}
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop: Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="hidden sm:flex h-9 items-center gap-1 rounded-md border border-white/15 bg-card/60 px-3 font-mono-funk text-[11px] tracking-wide text-foreground transition hover:border-lime">
              <Users className="size-3.5" /> ARTISTS
            </button>
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
          <span className="text-lime">{resultCount.toLocaleString("en-US")}</span>
        </div>
      </div>

      {/* Row 2: Genre filter with Decades dropdown first */}
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-[1800px] items-center gap-1 px-1.5 py-1 sm:gap-2 sm:px-3 sm:py-2">
          <SlidersHorizontal className="size-3 shrink-0 text-amber sm:size-3.5" />

          {/* Decades Dropdown */}
          <div className="relative">
            <Popover open={showDecadePicker} onOpenChange={setShowDecadePicker}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-0.5 font-mono-funk text-[9px] tracking-wide transition-all flex items-center gap-1",
                    filters.genres.some((g) => isDecade(g)) ? "border-transparent text-black bg-amber" : "border-white/15 text-foreground/75 hover:scale-105"
                  )}
                >
                  <Grid className="size-3" />
                  <span className="hidden sm:inline">DECADES</span>
                  <ChevronDown className={cn("size-3 transition-transform", showDecadePicker && "rotate-180")} />
                  {filters.genres.some((g) => isDecade(g)) && (
                    <span className="ml-0.5 text-[8px] bg-black/20 rounded px-0.5">
                      {filters.genres.filter((g) => isDecade(g)).length}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-48 p-2 border-white/15 bg-popover"
                side="bottom"
                align="start"
                sideOffset={4}
              >
                <div className="flex items-center justify-between px-1 py-1 mb-1">
                  <span className="font-mono-funk text-[10px] tracking-wider text-muted-foreground">Select Decade</span>
                  <button
                    onClick={() => {
                      const decadeFilters = filters.genres.filter((g) => isDecade(g));
                      setFilters({ ...filters, genres: filters.genres.filter((g) => !isDecade(g)) });
                    }}
                    className="text-[9px] text-muted-foreground hover:text-destructive font-mono-funk"
                  >
                    Clear All
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1 max-h-[300px] overflow-y-auto scrollbar-funky">
                  {DECADES.map((decade) => {
                    const genreInfo = decadeGenres.find((g) => g.name === decade);
                    const active = filters.genres.includes(decade);
                    const color = ACCENTS[hashStr(decade, ACCENTS.length)];
                    return (
                      <button
                        key={decade}
                        onClick={() => toggleGenre(decade)}
                        className={cn(
                          "rounded border px-1.5 py-1 font-mono-funk text-[9px] tracking-wide transition-all text-center min-h-[44px] flex flex-col items-center justify-center",
                          active ? "border-transparent text-black" : "border-white/10 text-foreground/80 hover:border-white/30"
                        )}
                        style={active ? { backgroundColor: color } : undefined}
                      >
                        <span className="font-medium">{decade}</span>
                        {genreInfo && <span className="text-[7px] opacity-50 mt-0.5">{genreInfo.count}</span>}
                        {active && <Check className="size-3 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Separator */}
          <span className="shrink-0 text-white/20 font-mono-funk text-[9px] tracking-wider select-none">|</span>

          {/* Other Genres - horizontal scroll with Show All popover */}
          <Popover open={showAllGenres} onOpenChange={setShowAllGenres}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "shrink-0 rounded-full border px-2.5 py-0.5 font-mono-funk text-[9px] tracking-wide transition flex items-center gap-1",
                  showAllGenres ? "border-hotpink text-hotpink" : "border-white/15 text-muted-foreground hover:border-hotpink hover:text-foreground"
                )}
              >
                <ChevronDown className={cn("size-3 transition-transform", showAllGenres && "rotate-180")} />
                <span>{showAllGenres ? "LESS" : "MORE"}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[360px] max-h-[70vh] overflow-y-auto border-white/15 bg-popover p-2 scrollbar-funky"
              side="bottom"
              align="start"
              sideOffset={4}
            >
              <div className="sticky top-0 bg-popover pb-2 mb-2 border-b border-white/10 flex items-center justify-between">
                <span className="font-mono-funk text-[10px] tracking-wider text-muted-foreground">All Genres ({otherGenres.length})</span>
                <button
                  onClick={() => setShowAllGenres(false)}
                  className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-mono-funk text-muted-foreground hover:text-foreground transition"
                >
                  <XIcon className="size-3" /> Close
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4">
                {otherGenres.map((g) => {
                  const active = filters.genres.includes(g.name);
                  const color = ACCENTS[hashStr(g.name, ACCENTS.length)];
                  return (
                    <button
                      key={g.name}
                      onClick={() => {
                        toggleGenre(g.name);
                        setShowAllGenres(false);
                      }}
                      className={cn(
                        "rounded border px-2 py-1.5 font-mono-funk text-[9px] tracking-wide transition-all text-left min-h-[44px] flex items-center gap-1.5",
                        active ? "border-transparent text-black" : "border-white/10 text-foreground/80 hover:border-white/30"
                      )}
                      style={active ? { backgroundColor: color } : undefined}
                    >
                      <span className="truncate flex-1">{g.name}</span>
                      <span className="shrink-0 text-[8px] opacity-50">{g.count}</span>
                      {active && <Check className="size-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* Visible genres chips (horizontal scroll with arrow buttons) */}
          <div className="flex flex-1 items-center gap-1 overflow-hidden">
            <button
              onClick={() => scrollGenres("left")}
              className="shrink-0 flex size-6 items-center justify-center rounded-full border border-white/10 bg-card/60 text-muted-foreground hover:border-lime hover:text-lime transition"
              aria-label="Scroll genres left"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <div ref={genreScrollRef} className="flex flex-1 gap-1 overflow-x-auto no-scrollbar">
              {otherGenres.map((g) => {
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
            <button
              onClick={() => scrollGenres("right")}
              className="shrink-0 flex size-6 items-center justify-center rounded-full border border-white/10 bg-card/60 text-muted-foreground hover:border-lime hover:text-lime transition"
              aria-label="Scroll genres right"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: letters + duration + active filters */}
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-1.5 gap-y-0.5 px-1 py-0.5 sm:gap-x-4 sm:gap-y-2 sm:px-3 sm:py-2">
          {/* letters - responsive grid on mobile */}
          <div className="flex flex-wrap items-center gap-px sm:gap-0.5">
            {LETTERS.map((L) => (
              <button
                key={L}
                onClick={() => setFilters({ ...filters, letter: filters.letter === L ? null : L })}
                className={cn(
                  "size-5 sm:size-5 rounded font-mono-funk text-[9px] sm:text-[10px] transition-all",
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
          <div className="flex items-center gap-px sm:gap-0.5">
            {DURATION_BUCKETS.map((b) => (
              <button
                key={b.id}
                onClick={() => setFilters({ ...filters, duration: b.id })}
                className={cn(
                  "rounded-sm px-1 py-0.5 sm:px-1.5 sm:py-0.5 font-mono-funk text-[8px] sm:text-[9px] tracking-wide transition-all",
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

import { AnimatePresence, motion } from "framer-motion";

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