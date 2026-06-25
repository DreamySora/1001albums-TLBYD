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
