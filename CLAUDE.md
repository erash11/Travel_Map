# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Current state:** Deployed Vite + React SPA visualizing travel demands by sport for Baylor Athletics. Live at `https://erash11.github.io/Travel_Map/`. Deployed via GitHub Actions on push to `main`.

**Roadmap:** Approach C — drag-and-drop CSV/JSON upload so staff can update schedules without touching code.

## How to Run / Develop

```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
```

TopoJSON for US state boundaries is fetched at runtime from `https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json`. Requires network on first render.

Git worktrees live at `.worktrees/` (gitignored). Use `git worktree add .worktrees/<branch> -b <branch>` for isolated feature work.

## Architecture

```
src/
  App.jsx                   — top-level router (grid ↔ sport map views)
  components/
    SportGrid.jsx            — landing page; sport selection cards
    SportMap.jsx             — map page for a single sport
    USMap.jsx                — D3 SVG map component
  data/
    index.js                 — exports `sports` array (registry)
    softball.json            — 2026 Baylor Softball schedule + metadata
  utils/
    groupByDest.js           — groups flat games[] into destination objects
    calcMiles.js             — haversine-based season mileage
    haversine.js             — great-circle distance (R=3959 miles)
    parseDate.js             — date string → sort key / day-of-year
    timezones.js             — FIPS→TZ map, TZ colors, crossing computation
    congestion.js            — sliding-window high-load detection
```

### Component Responsibilities

**`App`** holds a single `view` state `{ page: 'grid' | 'sport', sport? }`. No router library.

**`SportGrid`** renders sport selection cards. Active cards show mileage, trip count, TZ crossings. Coming-soon cards are muted and non-clickable.

**`SportMap`** owns all filter state, selection state, and sidebar/panel state. Derives `destinations` from `filteredGames → groupByDest()`. Stats are always computed from the **unfiltered** game list (season totals). Layout:
- Baylor green header — back button, title, filter buttons, Time Zones toggle, Schedule toggle
- Horizontal stats strip — Total Miles, Away Trips, Home Games, Conf. Games, Farthest Trip, TZ Crossings, High Load badges
- Full-width map area — contains `USMap`, floating destination detail card, optional schedule panel

**`USMap`** owns all SVG rendering. Manages D3 zoom state, SVG dimensions (ResizeObserver), and TopoJSON feature state. Does not know about filters or app state.

### Layout — SportMap

```
┌─────────────────────────── Header (green) ───────────────────────────┐
├──────────────────────── Stats strip (white) ─────────────────────────┤
│                                                                       │
│   USMap (flex:1, full width by default)    │ Schedule panel (280px)  │
│                                            │ (hidden unless toggled) │
│   [Floating detail card — bottom-left]     │                         │
└───────────────────────────────────────────────────────────────────────┘
```

Clicking a map dot → floating detail card at `bottom: 80px, left: 16px` over the map (dismiss with ✕).
"Schedule" header button → 280px panel slides in from the right (pushes map, doesn't overlay it).

## Key Patterns and Conventions

### Zoom-aware sizing
Every SVG element that should not scale with zoom divides its size by `zoom.k`:
```js
strokeWidth={1.2 / zoom.k}
fontSize={11 / zoom.k}
```
Do not add new SVG elements without applying this pattern.

### `proj()` argument order
Use the local `proj(lat, lng)` shorthand inside `USMap`. It takes `(lat, lng)` but inverts internally for D3's `[lng, lat]` convention.

### D3 zoom stored on DOM node
Zoom behavior stored as `svgRef.current.__zoomBehavior`. Used by `handleZoomIn`, `handleZoomOut`, `handleReset`. Do not remove without updating all three handlers.

### Projection scaling
```js
const scale = Math.min(dims.w / 960, dims.h / 500) * 1000;
```
Uses the more-constraining dimension so the full US always fits regardless of aspect ratio.

### Inline CSS only
No stylesheet, no CSS modules, no Tailwind. All styles are inline `style` objects.

### Color palette (light mode)
- `#154734` — Baylor green (header background; always dark)
- `#FFB81C` — Baylor gold (conference arcs, stat values, active filter)
- `#4ecdc4` — teal (non-conference arcs, farthest trip accent)
- `#f1f5f9` — page background
- `#ffffff` — sidebar / card backgrounds
- `#e2e8f0` — borders / dividers
- `#0f172a` — primary text
- `#94a3b8` — muted / label text

### Map colors
- State fill: `#dde3ea`
- State border: `#7a9bbf` at `0.8 / zoom.k`
- Active arc/dot highlight: `#0f172a` (not white — light map background)

## Data Model

### Sport JSON schema (`src/data/<sport>.json`)
```json
{
  "sport": "softball",
  "label": "Softball",
  "season": "2026",
  "lastUpdated": "2026-04-09",
  "colors": { "conference": "#FFB81C", "nonConference": "#4ecdc4" },
  "home": { "city": "Waco, TX", "lat": 31.5493, "lng": -97.1467 },
  "congestionThreshold": { "games": 4, "windowDays": 10 },
  "trips": [
    { "id": "trip-id", "label": "Trip Name", "stops": ["City, ST", "City2, ST"], "travelMode": "flight" }
  ],
  "games": [
    {
      "date": "Mar 11",
      "opponent": "Stetson",
      "location": "DeLand, FL",
      "lat": 29.0283,
      "lng": -81.3032,
      "home": false,
      "result": null,
      "conference": false,
      "tournament": "Tournament Name",
      "tripId": "trip-id",
      "travelMode": "flight"
    }
  ]
}
```

Field notes:
- `result`: `null` = upcoming; `"W 6-3"` or `"L 0-8"` = played
- `tripId`: links game to a `trips` entry; all games sharing a tripId are part of one continuous road trip
- `travelMode`: `"flight"` | `"bus"` | `"tbd"` — controls arc dash style on map
- `tournament`: optional display label shown in detail card

### Adding a new sport
1. Create `src/data/<sport>.json` following the schema above
2. Import and add to the `sports` array in `src/data/index.js`
3. Set `status: 'coming-soon'` until data is ready (renders as a muted card)

### Mileage calculation
- Normal away trip: `haversine(home, dest) * 2`
- Multi-stop trip: `haversine(home, stop1) + haversine(stop1, stop2) + ... + haversine(lastStop, home)`
- Pass the **unfiltered** `awayDests` list to `calcTotalMiles` — filtering drops trip stops and causes silent undercounting

### Timezone system
- FIPS code → timezone: `FIPS_TIMEZONES` (used for SVG state tint fills)
- Location string → timezone: `getDestinationTimezone("City, ST")` (parses state abbreviation)
- Crossings: `computeTimezoneChanges(allDests, trips, home)` — deduplicates multi-stop trips visiting the same zone

## Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`): push to `main` → `npm ci` → `npm run build` → deploy to GitHub Pages.

`vite.config.js` sets `base: '/Travel_Map/'` so all asset paths work under the GitHub Pages subdirectory.

To trigger a fresh deploy without a code change: use the "Run workflow" button in the Actions tab (workflow_dispatch). Do not re-run a failed job — it creates a duplicate artifact error.

## What NOT to Touch

- `baylor-softball-globe.jsx` — archived Three.js 3D globe, reference only
- `docs/superpowers/` — design specs and implementation plans, do not modify
