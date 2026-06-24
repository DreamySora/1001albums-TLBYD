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
