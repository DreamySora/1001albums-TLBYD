// Shared album-matching logic for iTunes Search API results.
// Used by both the cover-fetch script and the tracklist API to avoid
// accepting the wrong album (e.g. "Currents B-Sides" instead of "Currents",
// or the "Wednesday" Netflix soundtrack instead of the band Wednesday).

export function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, " ") // parentheticals
    .replace(/\[.*?\]/g, " ")
    .replace(/\b(-|–|—)\s*(ep|single|album|deluxe( edition)?|remastered|expanded edition|bonus track version|b-sides.*|anniversary edition|2014|2015|2016|2017|2018|2019|2020|2021|2022|2023|2024|2025|2026)\b.*$/i, " ")
    .replace(/[^a-z0-9]/g, "");
}

// Score how well an iTunes result matches the searched artist+title.
// Returns 0 (no match) .. 1 (perfect). Threshold ~0.6 to accept.
export function matchScore(
  resultArtist: string,
  resultTitle: string,
  wantArtist: string,
  wantTitle: string
): number {
  const ra = norm(resultArtist);
  const rt = norm(resultTitle);
  const wa = norm(wantArtist);
  const wt = norm(wantTitle);
  if (!rt || !wt) return 0;

  // Title must be a close match. Allow exact, or one containing the other
  // (e.g. "currents" vs "currentsbsidesremixes" — but that should FAIL because
  // we stripped "bsides" above; if it remains, exactness catches it).
  let titleScore = 0;
  if (rt === wt) titleScore = 1;
  else if (rt.startsWith(wt) || wt.startsWith(rt)) {
    // prefix match — only accept if the difference is small (avoid "currents" vs "currentsbsides")
    const diff = Math.abs(rt.length - wt.length);
    titleScore = diff <= 2 ? 0.9 : 0.3;
  } else if (rt.includes(wt) && wt.length >= 4) {
    titleScore = 0.7;
  } else {
    titleScore = 0;
  }

  // Artist: must overlap meaningfully.
  let artistScore = 0;
  if (ra === wa) artistScore = 1;
  else if (ra.includes(wa) || wa.includes(ra)) artistScore = 0.85;
  else if (wa.length >= 4 && (ra.includes(wa.slice(0, 6)) || wa.includes(ra.slice(0, 6)))) artistScore = 0.6;
  else artistScore = 0;

  // Both must be decent.
  if (titleScore < 0.6 || artistScore < 0.5) return 0;
  return Math.min(titleScore, artistScore);
}

export const MATCH_THRESHOLD = 0.6;
