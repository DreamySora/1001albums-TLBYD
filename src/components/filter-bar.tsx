"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, X, SlidersHorizontal, Users } from "lucide-react";
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

  return (
    <div className="sticky top-[57px] z-40 border-y border-white/10 bg-background/85 backdrop-blur-xl">
      {/* Row 1: search + sort + artist + count */}
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-2 px-3 py-2.5 sm:px-5">
        <div className="relative min-w-[160px] flex-1 sm:min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search title, artist, genre…"
            className="border-white/15 bg-card/60 pl-9 font-grotesk text-sm"
          />
        </div>

        {/* sort */}
        <select
          aria-label="Sort"
          value={filters.sort}
          onChange={(e) => setFilters({ ...filters, sort: e.target.value as Filters["sort"] })}
          className="h-9 rounded-md border border-white/15 bg-card/60 px-2 font-mono-funk text-[11px] tracking-wide text-foreground outline-none transition hover:border-hotpink"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.id} value={o.id} className="bg-card">
              {o.label}
            </option>
          ))}
        </select>

        {/* artist picker */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex h-9 items-center gap-1.5 rounded-md border border-white/15 bg-card/60 px-3 font-mono-funk text-[11px] tracking-wide text-foreground transition hover:border-lime">
              <Users className="size-3.5" /> ARTISTS
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="max-h-[60vh] w-[320px] overflow-y-auto border-white/15 bg-popover p-0 scrollbar-funky"
            align="end"
          >
            <div className="sticky top-0 bg-popover p-2 pb-1.5">
              <Input
                placeholder="Filter artists…"
                className="h-8 border-white/15 bg-card/60 font-grotesk text-xs"
                id="artist-filter"
                onChange={(e) => {
                  const v = e.target.value.toLowerCase();
                  const items = document.querySelectorAll<HTMLElement>("[data-artist-name]");
                  items.forEach((it) => {
                    it.style.display = it.dataset.artistName?.toLowerCase().includes(v) ? "" : "none";
                  });
                }}
              />
            </div>
            <ul className="p-1">
              {artists.map((a) => (
                <li key={a.name}>
                  <button
                    data-artist-name={a.name}
                    onClick={() => setFilters({ ...filters, artist: filters.artist === a.name ? null : a.name })}
                    className={cn(
                      "flex w-full items-center justify-between rounded px-2 py-1.5 text-left font-grotesk text-sm transition",
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

        <div className="flex items-center gap-2 font-mono-funk text-[11px] tracking-wider text-muted-foreground">
          <span className="hidden sm:inline">SHOWING</span>
          <span className="text-lime">{resultCount.toLocaleString()}</span>
        </div>
      </div>

      {/* Row 2: genre chips (horizontal scroll) */}
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-[1800px] items-center gap-2 px-3 py-2 sm:px-5">
          <SlidersHorizontal className="size-3.5 shrink-0 text-amber" />
          <div className="flex flex-1 gap-1.5 overflow-x-auto pb-1 scrollbar-funky">
            {genres.slice(0, 120).map((g) => {
              const active = filters.genres.includes(g.name);
              const color = ACCENTS[hashStr(g.name, ACCENTS.length)];
              return (
                <button
                  key={g.name}
                  onClick={() => toggleGenre(g.name)}
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-1 font-mono-funk text-[10px] tracking-wide transition-all",
                    active ? "border-transparent text-black" : "border-white/15 text-foreground/75 hover:scale-105"
                  )}
                  style={active ? { backgroundColor: color } : undefined}
                >
                  {g.name}
                  <span className="ml-1 opacity-50">{g.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: letters + duration + active filters */}
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 sm:px-5">
          {/* letters */}
          <div className="flex items-center gap-0.5">
            {LETTERS.map((L) => (
              <button
                key={L}
                onClick={() => setFilters({ ...filters, letter: filters.letter === L ? null : L })}
                className={cn(
                  "size-6 rounded font-mono-funk text-[11px] transition-all",
                  filters.letter === L
                    ? "bg-lime text-black"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                {L}
              </button>
            ))}
          </div>

          <div className="hidden h-5 w-px bg-white/10 sm:block" />

          {/* duration */}
          <div className="flex items-center gap-1">
            {DURATION_BUCKETS.map((b) => (
              <button
                key={b.id}
                onClick={() => setFilters({ ...filters, duration: b.id })}
                className={cn(
                  "rounded-md px-2 py-1 font-mono-funk text-[10px] tracking-wide transition-all",
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
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
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
                className="flex items-center gap-1 rounded-full border border-white/20 px-2 py-1 font-mono-funk text-[10px] tracking-wide text-foreground/80 transition hover:border-destructive hover:text-destructive"
              >
                <X className="size-3" /> CLEAR
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
