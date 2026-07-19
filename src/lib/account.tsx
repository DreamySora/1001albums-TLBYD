"use client";

import { useState, useEffect, useCallback } from "react";

export type OwnershipFormat = "vinyl" | "cd" | "cassette" | "other";

export type AlbumEntry = {
  id: number;
  artist: string;
  title: string;
  cover: string | null;
  status: "listened" | "want" | "owned";
  rating: number;
  review: string;
  addedAt: number;
  ownershipFormat?: OwnershipFormat;
};

type AlbumLike = { id: number; artist: string; title: string; cover?: string | null };

const STORAGE_KEY = "1001albums_account";

function loadEntries(): Record<number, AlbumEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<number, AlbumEntry>;
  } catch {
    return {};
  }
}

function saveEntries(entries: Record<number, AlbumEntry>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

export function useAccount() {
  const [entries, setEntries] = useState<Record<number, AlbumEntry>>(() => loadEntries());
  const [loaded, setLoaded] = useState(() => true);

  useEffect(() => {
    if (loaded) saveEntries(entries);
  }, [entries, loaded]);

  const setStatus = useCallback((album: AlbumLike, status: AlbumEntry["status"]) => {
    setEntries((prev) => {
      const existing = prev[album.id];
      if (existing?.status === status) {
        const next = { ...prev };
        delete next[album.id];
        return next;
      }
      return {
        ...prev,
        [album.id]: {
          id: album.id,
          artist: album.artist,
          title: album.title,
          cover: album.cover ?? null,
          status,
          rating: existing?.rating ?? 0,
          review: existing?.review ?? "",
          addedAt: existing?.addedAt ?? Date.now(),
          ownershipFormat: existing?.ownershipFormat,
        },
      };
    });
  }, []);

  const setRating = useCallback((album: AlbumLike, rating: number) => {
    setEntries((prev) => {
      const existing = prev[album.id];
      if (!existing) return prev;
      return { ...prev, [album.id]: { ...existing, rating } };
    });
  }, []);

  const setReview = useCallback((album: AlbumLike, review: string) => {
    setEntries((prev) => {
      const existing = prev[album.id];
      if (!existing) return prev;
      return { ...prev, [album.id]: { ...existing, review } };
    });
  }, []);

  const setOwnership = useCallback((album: AlbumLike, format: OwnershipFormat) => {
    setEntries((prev) => {
      const existing = prev[album.id];
      if (!existing) return prev;
      return { ...prev, [album.id]: { ...existing, ownershipFormat: format } };
    });
  }, []);

  const remove = useCallback((id: number) => {
    setEntries((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setEntries({});
  }, []);

  return { entries, loaded, setStatus, setRating, setReview, setOwnership, remove, clearAll };
}

export function Stars({
  value,
  onChange,
  size = 16,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s)}
          className={`transition ${
            s <= value ? "text-amber" : "text-white/20"
          } ${onChange ? "cursor-pointer hover:scale-125" : "cursor-default"}`}
          aria-label={`${s} star${s !== 1 ? "s" : ""}`}
          disabled={!onChange}
          style={{ fontSize: size, lineHeight: 1, width: size, height: size }}
        >
          ★
        </button>
      ))}
    </span>
  );
}
