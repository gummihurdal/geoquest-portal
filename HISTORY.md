# GeoQuest Release History

## v1.0-stable — 2026-03-06 ✅ PRODUCTION BASELINE
**Tag:** `v1.0-stable`  
**Deployed to:** trivia.azurenexus.com

### Features in this release
- **World Map** — photorealistic 3D globe (NASA textures), full-sphere spin (up/down/left/right), pinch-to-zoom on mobile, auto-rotation pauses on country click and resumes on panel close
- **Amazing Facts panel** — shows all 5 game hints from the `_gc` database + 1 bonus amazing fact (study mode supplements game mode)
- **Guess Country** — 605 hand-crafted pub-quiz clues across 121 countries, AI fallback hints via Claude API, hint index resets correctly on next country
- **Challenge mode** — 12-second timer (extended from 7s)
- **Daily Cosmos** — NASA EPIC/APOD fetched and cached in Supabase `daily_cosmos` table via Edge Function; frontend reads from Supabase first (fast), falls back to NASA direct if cache stale
- **Admin analytics** — visitor country/IP data visible to Gudmundur_Thordarson
- **Globe size** — camera z=3.8 (tuned to fill viewport without clipping)

### Infrastructure
- Supabase schema `staging` created (mirrors all public tables)
- Edge Function `fetch-daily-cosmos` deployed
- Git tag `v1.0-stable` on `gummihurdal/geoquest-portal`
- Staging repo: `gummihurdal/geoquest-staging`
- Change management process documented in `.github/docs/CHANGE_MANAGEMENT.md`

---
*Future releases will be added above this line.*
