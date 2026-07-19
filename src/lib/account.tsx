"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { Star } from "lucide-react";
import type { Album } from "@/lib/albums-client";

export type AlbumStatus = "listened" | "want" | "owned";
export type OwnershipFormat = "vinyl" | "cd" | "cassette" | "other";
export type AccountAlbum = Pick<Album, "id" | "artist" | "title" | "cover">;

export type AlbumEntry = {
  id: number;
  artist: string;
  title: string;
  cover: string | null;
  status: AlbumStatus;
  rating: number;
  review: string;
  ownershipFormat?: OwnershipFormat;
  addedAt: number;
};

const STORAGE_KEY = "album-crate-account-v1";
const EMPTY_ENTRIES: Record<number, AlbumEntry> = {};
const listeners = new Set<() => void>();

let entries: Record<number, AlbumEntry> = EMPTY_ENTRIES;
let initialized = false;

function isAlbumStatus(value: unknown): value is AlbumStatus {
  return value === "listened" || value === "want" || value === "owned";
}

function isOwnershipFormat(value: unknown): value is OwnershipFormat | undefined {
  return value === undefined || value === "vinyl" || value === "cd" || value === "cassette" || value === "other";
}

function isAlbumEntry(value: unknown): value is AlbumEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    Number.isSafeInteger(entry.id) &&
    typeof entry.artist === "string" &&
    typeof entry.title === "string" &&
    (typeof entry.cover === "string" || entry.cover === null) &&
    isAlbumStatus(entry.status) &&
    typeof entry.rating === "number" &&
    Number.isFinite(entry.rating) &&
    typeof entry.review === "string" &&
    isOwnershipFormat(entry.ownershipFormat) &&
    typeof entry.addedAt === "number" &&
    Number.isFinite(entry.addedAt)
  );
}

function load(): Record<number, AlbumEntry> {
  if (typeof window === "undefined") return EMPTY_ENTRIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_ENTRIES;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return EMPTY_ENTRIES;

    const validEntries: Record<number, AlbumEntry> = {};
    for (const value of Object.values(parsed)) {
      if (isAlbumEntry(value)) validEntries[value.id] = value;
    }
    return validEntries;
  } catch {
    return EMPTY_ENTRIES;
  }
}

function save(next: Record<number, AlbumEntry>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Keep the in-memory account usable when storage is unavailable or full.
  }
}

function initialize() {
  if (initialized || typeof window === "undefined") return;
  entries = load();
  initialized = true;
}

function notify() {
  for (const listener of listeners) listener();
}

function getSnapshot() {
  initialize();
  return entries;
}

function getServerSnapshot() {
  return EMPTY_ENTRIES;
}

function subscribe(listener: () => void) {
  initialize();
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    entries = load();
    notify();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function updateEntries(updater: (current: Record<number, AlbumEntry>) => Record<number, AlbumEntry>) {
  initialize();
  entries = updater(entries);
  save(entries);
  notify();
}

export function useAccount() {
  const accountEntries = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setStatus = useCallback((album: AccountAlbum, status: AlbumStatus) => {
    updateEntries((current) => {
      const next = { ...current };
      const existing = next[album.id];
      if (existing && existing.status === status) {
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
      return next;
    });
  }, []);

  const setRating = useCallback((album: AccountAlbum, rating: number) => {
    updateEntries((current) => {
      const existing = current[album.id];
      return {
        ...current,
        [album.id]: {
          id: album.id,
          artist: album.artist,
          title: album.title,
          cover: album.cover,
          status: existing?.status ?? "listened",
          rating: existing?.rating === rating ? 0 : rating,
          review: existing?.review ?? "",
          ownershipFormat: existing?.ownershipFormat,
          addedAt: existing?.addedAt ?? Date.now(),
        },
      };
    });
  }, []);

  const setReview = useCallback((album: AccountAlbum, review: string) => {
    updateEntries((current) => {
      const existing = current[album.id];
      return {
        ...current,
        [album.id]: {
          id: album.id,
          artist: album.artist,
          title: album.title,
          cover: album.cover,
          status: existing?.status ?? "listened",
          rating: existing?.rating ?? 0,
          review,
          ownershipFormat: existing?.ownershipFormat,
          addedAt: existing?.addedAt ?? Date.now(),
        },
      };
    });
  }, []);

  const setOwnership = useCallback((album: AccountAlbum, format: OwnershipFormat) => {
    updateEntries((current) => {
      const existing = current[album.id];
      return existing ? { ...current, [album.id]: { ...existing, ownershipFormat: format } } : current;
    });
  }, []);

  const remove = useCallback((albumId: number) => {
    updateEntries((current) => {
      const next = { ...current };
      delete next[albumId];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    updateEntries(() => EMPTY_ENTRIES);
  }, []);

  return {
    entries: accountEntries,
    loaded: initialized,
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
