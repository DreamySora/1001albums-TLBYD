# Worklog — 1001 Albums Before You Die

This file tracks all agent work on the album-list website project.

---
Task ID: 1
Agent: main
Task: Project setup and first album batch (raw-1.ts)

Work Log:
- Explored existing Next.js 16 project structure (shadcn/ui, Prisma, framer-motion installed).
- Created /home/z/my-project/src/data/ and /home/z/my-project/scripts/.
- Wrote src/data/raw-1.ts with ~290 curated albums in compact tuple format:
  [artist, title, year, "g1|g2|g3|g4|g5", durationMin, "description"]
- Covered: indie/alt rock, dream pop/shoegaze, electronic/IDM, hip hop, post-rock,
  modern classical, neo-soul/R&B, psychedelic, 60s-80s classics, synthpop.
- Respected constraints: no Metal, no Country, max 2 albums per artist.

Stage Summary:
- raw-1.ts complete (~290 albums).
- Next: generate raw-2/3/4 via subagents (electronic/dance/jazz/soul/funk/world,
  pop/singer-songwriter/britpop/post-punk, hip-hop/R&B/ambient/experimental).
- Then: cover-fetch script (iTunes API), Prisma schema, funky dark UI, filters.
- Data combine module will dedupe by artist+title (keep first occurrence).

---
Task ID: 2 (multi-feature)
Agent: main
Task: New features + data changes + bug fixes

Work Log:
- Fixed critical cover/name shift bug: removed framer-motion `layout` prop and `mode="popLayout"` which caused DOM node reuse and image src mismatch during infinite scroll. Verified with VLM — covers now match titles.
- Added raw-6.ts (~190 albums): City Pop (Mariya Takeuchi, Tatsuro Yamashita, Anri, Taeko Onuki...), Japanese Jazz Fusion (Casiopea, T-Square, Masayoshi Takanaka, Ryo Fukui...), World Funk (Habibi Funk, Almamegretta, 99 Posse, Pino Daniele, Nu Genea...), Latin (Willie Colón, Rubén Blades, Eddie Palmieri, Irakere, Los Van Van...), more Funk (Cymande, Slave, Meters, Dr. John, Allen Toussaint...), Indie Pop (Camera Obscura, Radio Dept., Jens Lekman...), 2026 albums (Bon Iver, MJ Lenderman, Perfume Genius...).
- Updated albums.ts: import raw-6; added forbidden genres (EDM, Dubstep, Hardcore); reduced Electronic cap 200→150; kept Female Vocalist tagging via female-set.ts.
- Added /api/tracklist route returning tracks with previewUrl (iTunes 30s AAC previews) + featuring parsing + collectionId fallback search.
- Updated AlbumModal: 30s audio preview play/stop buttons per track (grey X/Ban icon when unavailable); AccountActions (LISTENED/WANT/OWN + star rating) integrated in modal.
- Created src/lib/colors.ts: client-side dominant-color extraction from cover via canvas (3 colors, blended, saturation-weighted) for per-card glow.
- Updated AlbumCard: glow now uses blended dominant cover colors (fallback to hashed accent).
- Created /random page: genre-picker → roll dice → random album from filtered pool.
- Created /wheel page: SVG wheel of 60 sampled albums, genre-filterable, spins to pick a winner.
- Created /account page: localStorage-based (no login) with listened/want/owned lists, 1-5 star ratings, reviews, ownership format (Vinyl/CD/Cassette/Other), stats, and Privacy/Cookie/API legal sections.
- Created src/lib/account.tsx: useAccount hook + Stars component.
- Created TopNav component (shared): links to Random/Wheel/Account + ThemeToggle (dark/light via next-themes), all with 1s-delay tooltips (shadcn Tooltip, delayDuration=1000).
- Added light theme CSS variables (warm cream + neon accents); wrapped app in Providers (ThemeProvider + TooltipProvider).
- Security: next.config.ts security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy); robots.txt + security.txt.
- Lint clean.

Stage Summary:
- 1546 albums total, Electronic capped at 150, Female Vocalist 267, 561 genres.
- New genres: City Pop(13), Jazz Fusion(32), Neapolitan(13), Afro-Funk(11), Salsa(23), Timba(3).
- Cover fetch ongoing: ~1068/1546 (69%). iTunes + MusicBrainz/Cover Art Archive dual-source.
- All new pages verified working via Agent Browser (home, /random, /wheel, /account, theme toggle, modal previews).

---
Task ID: 3 (cover/tracklist accuracy + UI polish)
Agent: main
Task: Fix cover/name shift, wrong tracklists, wheel sample cap, light mode, glow

Work Log:
- ROOT CAUSE of cover/tracklist mismatch: iTunes Search API returns wrong albums in first position
  (e.g. "Currents B-Sides & Remixes - EP" for "Currents", Netflix "Wednesday" soundtrack for the band).
  Old matching took results[0] blindly.
- Created src/lib/itunes-match.ts: strict matchScore() requiring near-exact title match + decent
  artist overlap (threshold 0.6). Rejects deluxe/remix/b-sides/EP variants.
- Updated fetch-covers.ts to use matchScore: only accepts results scoring >= 0.6. No match → null
  (MB fallback recovers correct cover).
- Updated tracklist API findCollectionId to use matchScore: rejects wrong albums (e.g. Netflix
  Wednesday). Tame Impala "Currents" and band "Wednesday" now correctly show "No tracklist found"
  instead of wrong tracks.
- Re-verified ALL 1546 albums with strict matching (REVERIFY mode, resumable via reverify-done.json).
  Removed 723 wrong covers. Recovered via MusicBrainz/Cover Art Archive (with release-group fallback).
  Final: 581 correct covers (vs 1209 before, ~723 of which were wrong).
- Improved MB script: title-scored release selection + release-group CAA fallback.
- Wheel: removed 60-album sample cap — now shows ALL albums for selected genres (1,546 total).
  Labels auto-hide when slices too thin (<6deg).
- Light mode: warmer/softer palette — cream background (oklch 0.96 0.018 70), muted neon
  (lower chroma), softer borders. VLM confirms "warm and soft, cream/paper-like".
- Glow: increased alpha 0.55→0.7, added double shadow (0 14px 60px + 0 0 24px).
- Lint clean. All verified via Agent Browser.

Stage Summary:
- Cover/tracklist mismatch: FIXED (strict iTunes matching, MB fallback).
- Shift bug: still fixed (framer-motion layout removed earlier). VLM confirms "All match".
- Wheel: shows all 1,546 records, genre-filterable, spins correctly.
- Light mode: warm cream, muted neon, less punchy.
- Glow: stronger, blended from cover colors.

---
Task ID: 4 (final fixes)
Agent: main
Task: Fix multi-genre filter (AND not OR), tracklist missing for iTunes-less albums, restart server

Work Log:
- Multi-genre filter: changed OR (some) → AND (every) in 3 places:
  - src/lib/albums-client.ts applyFilters()
  - src/app/random/page.tsx pool
  - src/app/wheel/page.tsx pool
  Now selecting "Electronic" + "House" shows only albums with BOTH genres (11 albums, e.g.
  Daft Punk Discovery, New Order Technique) — NOT Currents (only Electronic).
  Updated help text on random/wheel pages to clarify "selecting multiple genres shows only
  albums that have ALL of them".
- Tracklist missing for Strokes/Tame Impala: root cause = iTunes doesn't carry these albums
  (licensing), so collectionId is null and findCollectionId strict search correctly rejects
  wrong matches (B-Sides, Netflix Wednesday). Added MusicBrainz fallback in tracklist API:
  - mbFindRelease(): searches MB for release MBID (title-scored selection)
  - mbFetchRecordings(): fetches tracklist from MB /ws/2/release/{mbid}?inc=recordings
  - GET handler: tries iTunes first (with cid or findCollectionId), then falls back to MB
  Result: Strokes "Is This It" → 11 correct tracks; Tame Impala "Currents" → 13 correct tracks.
  MB tracks have durations but no audio previews (previewUrl: null → grey Ban icon).
- Dev server: restarted. Note: sandbox kills background processes when bash command returns;
  user should run `bun run dev` to start.
- Lint clean. All verified via Agent Browser.

Stage Summary:
- Genre filter: AND semantics (album must have ALL selected genres). Verified: Electronic+House
  → 11 albums, Currents excluded.
- Tracklist: MusicBrainz fallback recovers correct tracks for iTunes-less albums (Strokes,
  Tame Impala, etc.). No more "No tracklist found" for well-known albums.
