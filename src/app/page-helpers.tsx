"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Disc3, Loader2, Ghost, ArrowUp } from "lucide-react";

export function SkeletonGrid() {
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

export function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <Ghost className="size-12 text-grape" />
      <h3 className="mt-4 font-display text-2xl uppercase">No records match</h3>
      <p className="mt-2 max-w-md font-grotesk text-sm text-muted-foreground">
        That crate is empty, friend. Try loosening a filter or clearing the lot.
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

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/40">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-2 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <Disc3 className="size-4 text-hotpink" />
          <span className="font-display text-sm uppercase tracking-tight">1001.</span>
          <span className="font-mono-funk text-[10px] tracking-wider text-muted-foreground">
            a curated crate made for listening
          </span>
        </div>
        <p className="font-mono-funk text-[10px] tracking-wider text-muted-foreground">
          No metal No country No filler only the good stuff
        </p>
      </div>
    </footer>
  );
}

export function BackToTop() {
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