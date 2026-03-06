# GeoQuest Change Management Process
## ITIL-Aligned Release Pipeline

**Last Updated:** March 2026  
**Environments:** Production (`trivia.azurenexus.com`) | Staging (`gummihurdal.github.io/geoquest-staging`)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION ENVIRONMENT                       │
│  GitHub: gummihurdal/geoquest-portal                           │
│  URL:    https://trivia.azurenexus.com                         │
│  DB:     Supabase mjphpctvuxmbjhmcscoj  →  schema: public      │
│  Tag:    v1.0-stable (March 2026 baseline)                     │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                    Promote after UAT pass
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    STAGING ENVIRONMENT                          │
│  GitHub: gummihurdal/geoquest-staging                          │
│  URL:    https://gummihurdal.github.io/geoquest-staging        │
│  DB:     Supabase mjphpctvuxmbjhmcscoj  →  schema: staging     │
│  Banner: Orange "STAGING ENVIRONMENT" bar visible at top       │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                   Develop and test changes
                              │
┌─────────────────────────────────────────────────────────────────┐
│                   LOCAL DEVELOPMENT                             │
│  Clone: geoquest-staging repo                                  │
│  Edit:  assets/index-aPCSNaPL.js (minified bundle)            │
│  Test:  Open index.html in browser or local server             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Change Request Process

### Step 1 — Request & Planning
Before touching any code:
- [ ] Define what is changing (feature / bug fix / hotfix)
- [ ] Identify risk level: **Low** (UI tweak) | **Medium** (new feature) | **High** (DB schema / auth)
- [ ] For High risk: document rollback plan before starting

### Step 2 — Develop on Staging
```bash
# Always work from staging repo
git clone https://github.com/gummihurdal/geoquest-staging.git
cd geoquest-staging

# Make your changes to assets/index-aPCSNaPL.js
# The staging interceptor auto-routes DB calls to staging.* schema

# Test locally
python3 -m http.server 8080
# Open http://localhost:8080 — orange banner confirms staging mode

# Push to staging
git add .
git commit -m "feat: [description of change]"
git push origin main
```

### Step 3 — Staging Verification (UAT Checklist)
Test every item before promoting to production:

**Core functionality**
- [ ] Dashboard loads without black screen
- [ ] Globe auto-rotates on World Map page
- [ ] Globe spins up/down and left/right via drag
- [ ] Globe stops on country click, resumes on panel close
- [ ] Pinch-to-zoom works on mobile
- [ ] Country info panel opens and closes
- [ ] Amazing Facts shows 5 game hints + bonus fact

**Game modes**
- [ ] Guess Country: loads question, hints work, next country resets hint index
- [ ] Continents: globe loads, continent click works
- [ ] Speed Quiz: timer runs, score updates
- [ ] Challenge: challenge creation and acceptance

**Daily Cosmos**
- [ ] Page loads image (not blank)
- [ ] Image comes from Supabase cache (fast, <500ms)
- [ ] Falls back gracefully if NASA unreachable

**Auth & Profile**
- [ ] Login / Register works
- [ ] Profile page loads
- [ ] Score updates after game

**Admin** (Gudmundur_Thordarson only)
- [ ] Admin analytics page loads visitor data

### Step 4 — Production Promotion
Only after ALL checklist items pass:

```bash
# 1. Tag the staging commit
git tag -a v1.x-staging-pass -m "UAT passed - ready for prod"
git push origin --tags

# 2. Apply same changes to production repo
cd ../geoquest-portal  # switch to prod repo

# Copy changed files from staging (MINUS the staging-specific patches)
# The staging interceptor and banner must NOT go to production

# Make the equivalent changes manually in prod bundle
# Test one more time on prod: trivia.azurenexus.com

# 3. Tag production release
git tag -a v1.x-stable -m "Production release - [description]"
git push origin main --tags

# 4. Update HISTORY.md
echo "## v1.x - $(date +%Y-%m-%d)" >> HISTORY.md
echo "Changes: [description]" >> HISTORY.md
```

### Step 5 — Post-Release Monitoring
- Check trivia.azurenexus.com for 10 minutes after deployment
- Verify no JS console errors on Dashboard, World Map, Guess Country
- Confirm Daily Cosmos still loads from Supabase cache
- If any issue → **immediately rollback** (see below)

---

## Emergency Rollback

### Git Rollback (any environment)
```bash
# Revert to last known good tag
git checkout v1.0-stable          # or latest stable tag
git push origin HEAD:main --force

# GitHub Pages redeploys automatically within 2 minutes
```

### Database Rollback
- Staging schema: just delete and recreate (no real users)
- Production schema: use Supabase point-in-time recovery (PITR)
  - Dashboard → Settings → Backups
  - Or run the schema SQL from SUPABASE.md to restore structure

### Hotfix Process (production-critical bug)
If prod is broken and staging isn't ready:
```bash
# Fix directly in prod repo (exceptional only)
cd geoquest-portal
# Fix the issue
git add . && git commit -m "hotfix: [description]"
git push origin main

# THEN backport the fix to staging
cd ../geoquest-staging
# Apply same fix
git add . && git commit -m "hotfix: backport [description] from prod"
git push origin main
```

---

## Branch Strategy

```
main (staging) ── feature branches ── merge when tested
     │
     └── promote to ── main (production) when UAT passes
```

- **main** on staging = current test candidate
- **main** on production = live stable version
- **Tags** on production = auditable release history (v1.0, v1.1, etc.)

---

## Environment Configuration

| Setting | Staging | Production |
|---|---|---|
| GitHub Repo | `geoquest-staging` | `geoquest-portal` |
| URL | `gummihurdal.github.io/geoquest-staging` | `trivia.azurenexus.com` |
| Supabase Project | `mjphpctvuxmbjhmcscoj` | `mjphpctvuxmbjhmcscoj` |
| Supabase Schema | `staging` | `public` |
| Banner | Orange staging bar | None |
| CNAME | None (default GitHub URL) | `trivia.azurenexus.com` |
| NASA Cosmos | `staging.daily_cosmos` | `public.daily_cosmos` |

---

## Key Files Reference

| File | Purpose |
|---|---|
| `assets/index-aPCSNaPL.js` | Main compiled bundle (all React + game logic) |
| `assets/InteractiveGlobe-DN7xlCpu.js` | Continents mode 3D globe |
| `index.html` | Entry point + staging banner |
| `CNAME` | Custom domain (empty on staging) |
| `.github/docs/CHANGE_MANAGEMENT.md` | This document |
| `HISTORY.md` | Release log |

---

## Supabase Schema Reference

Tables in `public` (production) and `staging` (test):
- `players` — user accounts, scores
- `leaderboard` — high scores by game mode  
- `challenges` — multiplayer challenge records
- `visitor_countries` — admin analytics (IP + country)
- `daily_cosmos` — NASA EPIC/APOD cache
- `profile_photos` — avatar storage

Edge Functions (always in production Supabase):
- `fetch-daily-cosmos` — fetches NASA image, writes to `daily_cosmos`
- `hint` — Claude API proxy for AI hints in Guess Country

---

*This process follows ITIL Change Management principles: every change is planned, tested in an isolated environment, verified, and only then promoted to production with a clear rollback path.*
