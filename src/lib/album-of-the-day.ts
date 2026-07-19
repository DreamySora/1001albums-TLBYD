import { ALBUMS } from "@/data/albums";
import type { Album } from "@/lib/albums-client";

function getDayOfYear(date: Date): number {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function getAlbumForDate(date: Date): Album {
  const dayOfYear = getDayOfYear(date);
  const year = date.getUTCFullYear();
  const seed = `${year}-${dayOfYear}`;
  const index = hashStr(seed) % ALBUMS.length;
  return ALBUMS[index];
}

export function getAlbumOfTheDay(): Album {
  return getAlbumForDate(new Date());
}

export function getTimeUntilNextChange(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(9, 0, 0, 0);
  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  const diff = next.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { hours, minutes, seconds };
}

export function getAlbumOfTheDayHistory(days: number = 200): { date: string; album: Album }[] {
  const result: { date: string; album: Album }[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    result.push({ date: dateStr, album: getAlbumForDate(date) });
  }
  return result;
}