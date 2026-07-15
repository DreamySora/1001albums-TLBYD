"use client";

// Extract up to N dominant colors from an image URL using a canvas.
// Runs client-side; returns hex colors. Falls back to [] on any error.
export type RGB = { r: number; g: number; b: number };

export function rgbToCss(c: RGB, alpha = 1): string {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
}

export function rgbToHex(c: RGB): string {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

const cache = new Map<string, RGB[]>();

export function getDominantColors(url: string, count = 3): Promise<RGB[]> {
  if (cache.has(url)) return Promise.resolve(cache.get(url)!);
  return new Promise((resolve) => {
    const img = new Image();
    // Only set crossOrigin for known-CORS hosts (iTunes/mzstatic.com).
    // Discogs images don't send CORS headers and would taint the canvas.
    if (url.includes("mzstatic.com")) img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 48;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve([]);
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        // Quantize: bucket colors, ignore near-black/near-white/near-transparent.
        const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 125) continue;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const lum = (max + min) / 2;
          if (lum < 24 || lum > 235) continue; // skip near-black/white
          // quantize to 5 bits per channel
          const key = `${r >> 3}|${g >> 3}|${b >> 3}`;
          const ex = buckets.get(key);
          if (ex) {
            ex.count++;
            ex.r += r;
            ex.g += g;
            ex.b += b;
          } else {
            buckets.set(key, { count: 1, r, g, b });
          }
        }
        const sorted = [...buckets.values()]
          .sort((a, b) => b.count - a.count)
          .slice(0, count * 4)
          .map((b) => ({
            r: Math.round(b.r / b.count),
            g: Math.round(b.g / b.count),
            b: Math.round(b.b / b.count),
            count: b.count,
          }));
        // Pick top `count` that are sufficiently distinct (min distance).
        const picked: { r: number; g: number; b: number }[] = [];
        for (const c of sorted) {
          if (picked.length >= count) break;
          const tooClose = picked.some(
            (p) => Math.abs(p.r - c.r) + Math.abs(p.g - c.g) + Math.abs(p.b - c.b) < 60
          );
          if (!tooClose) picked.push({ r: c.r, g: c.g, b: c.b });
        }
        // fill remaining with top entries
        while (picked.length < count && sorted.length > picked.length) {
          const next = sorted[picked.length];
          picked.push({ r: next.r, g: next.g, b: next.b });
        }
        cache.set(url, picked);
        resolve(picked);
      } catch {
        resolve([]);
      }
    };
    img.onerror = () => resolve([]);
    img.src = url;
  });
}

// Blend N colors into a single glow color (weighted toward the most saturated/vivid).
export function blendColors(colors: RGB[]): RGB | null {
  if (!colors.length) return null;
  if (colors.length === 1) return colors[0];
  // weight by saturation (vividness) so neon pops survive the blend.
  const weighted = colors.map((c) => {
    const max = Math.max(c.r, c.g, c.b);
    const min = Math.min(c.r, c.g, c.b);
    const sat = max === 0 ? 0 : (max - min) / max;
    return { c, w: 0.4 + sat };
  });
  const totalW = weighted.reduce((s, x) => s + x.w, 0);
  const r = Math.round(weighted.reduce((s, x) => s + x.c.r * x.w, 0) / totalW);
  const g = Math.round(weighted.reduce((s, x) => s + x.c.g * x.w, 0) / totalW);
  const b = Math.round(weighted.reduce((s, x) => s + x.c.b * x.w, 0) / totalW);
  return { r, g, b };
}
