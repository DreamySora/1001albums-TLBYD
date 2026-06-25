"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Heart, Disc3, Trash2, FileText, X, Save } from "lucide-react";
import type { Album } from "@/lib/albums-client";

export type AlbumStatus = "listened" | "want" | "owned";
export type OwnershipFormat = "vinyl" | "cd" | "cassette" | "other";

export type AlbumEntry = {
  id: number;
  artist: string;
  title: string;
  cover: string | null;
  status: AlbumStatus;
  rating: number; // 0 = none, 1-5 stars
  review: string;
  ownershipFormat?: OwnershipFormat;
  addedAt: number;
};

const STORAGE_KEY = "album-crate-account-v1";

function load(): Record<number, AlbumEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<number, AlbumEntry>) : {};
  } catch {
    return {};
  }
}

function save(data: Record<number, AlbumEntry>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota
  }
}

export function useAccount() {
  const [entries, setEntries] = useState<Record<number, AlbumEntry>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntries(load());
    setLoaded(true);
  }, []);

  const persist = useCallback((next: Record<number, AlbumEntry>) => {
    setEntries(next);
    save(next);
  }, []);

  const setStatus = useCallback(
    (album: Album, status: AlbumStatus) => {
      const next = { ...entries };
      const existing = next[album.id];
      if (existing && existing.status === status) {
        // toggle off
        delete next[album.id];
      } else {
        next[album.id] = {
          id: album.id,
          artist: album.artist,
          title: album.title,
          cover: album.cover,
          status,
          rating: existing?.rating ?? 0,
          review: existing?.review ?? "",
          ownershipFormat: status === "owned" ? existing?.ownershipFormat ?? "vinyl" : existing?.ownershipFormat,
          addedAt: existing?.addedAt ?? Date.now(),
        };
      }
      persist(next);
    },
    [entries, persist]
  );

  const setRating = useCallback(
    (album: Album, rating: number) => {
      const next = { ...entries };
      const existing = next[album.id];
      next[album.id] = {
        id: album.id,
        artist: album.artist,
        title: album.title,
        cover: album.cover,
        status: existing?.status ?? "listened",
        rating: existing?.rating === rating ? 0 : rating,
        review: existing?.review ?? "",
        ownershipFormat: existing?.ownershipFormat,
        addedAt: existing?.addedAt ?? Date.now(),
      };
      persist(next);
    },
    [entries, persist]
  );

  const setReview = useCallback(
    (album: Album, review: string) => {
      const next = { ...entries };
      const existing = next[album.id];
      next[album.id] = {
        id: album.id,
        artist: album.artist,
        title: album.title,
        cover: album.cover,
        status: existing?.status ?? "listened",
        rating: existing?.rating ?? 0,
        review,
        ownershipFormat: existing?.ownershipFormat,
        addedAt: existing?.addedAt ?? Date.now(),
      };
      persist(next);
    },
    [entries, persist]
  );

  const setOwnership = useCallback(
    (album: Album, format: OwnershipFormat) => {
      const next = { ...entries };
      const existing = next[album.id];
      if (!existing) return;
      next[album.id] = { ...existing, ownershipFormat: format };
      persist(next);
    },
    [entries, persist]
  );

  const remove = useCallback(
    (albumId: number) => {
      const next = { ...entries };
      delete next[albumId];
      persist(next);
    },
    [entries, persist]
  );

  const clearAll = useCallback(() => {
    persist({});
  }, [persist]);

  return {
    entries,
    loaded,
    setStatus,
    setRating,
    setReview,
    setOwnership,
    remove,
    clearAll,
  };
}

export { STORAGE_KEY };

export function Stars({ value, onChange, size = 14 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange?.(n)}
          className={onChange ? "transition-transform hover:scale-125" : "cursor-default"}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            style={{ width: size, height: size }}
            className={n <= (hover || value) ? "fill-amber text-amber" : "text-muted-foreground/40"}
          />
        </button>
      ))}
    </div>
  );
}

export { motion, AnimatePresence, Heart, Disc3, Trash2, FileText, X, Save };
