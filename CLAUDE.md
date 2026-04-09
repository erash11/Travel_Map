# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Current state:** Single-file React/D3 application visualizing travel demands for the 2026 Baylor Softball season. No build system, no package manager, no test framework.

**Planned next:** Multi-sport hosted web app (Vite + React SPA). See `docs/superpowers/specs/2026-04-09-multi-sport-travel-map-design.md` for the full spec. Key decisions:
- **Approach B** — Vite + React SPA with per-sport JSON data files. Adding a sport = drop in one JSON file.
- **Approach C is the roadmap goal** — future drag-and-drop CSV/JSON upload so staff can update schedules without touching code.
- The `swing` field on games becomes `tripId`; `TRIP_SWINGS` becomes `trips` in the JSON schema.
- New features: time zone overlay on map, time zone crossing summary, travel mode arc styles (flight/bus/charter), congestion flagging (auto-detected via sliding window).

## How to Run / Develop

**Option 1 — Claude.ai artifact (primary development environment)**
Paste the full contents of `baylor-softball-travel-map.jsx` into a Claude.ai artifact. React and D3 are available in that environment without imports.

**Option 2 — Vite scratch server**
```bash
npm create vite@latest scratch -- --template react
# Copy baylor-softball-travel-map.jsx into src/App.jsx
# npm install d3
npm run dev
```

**Option 3 — Static page with CDN**
Wrap the component in a minimal HTML page loading React, ReactDOM, and D3 via CDN, then render `<App />` into a div.

The TopoJSON for US state boundaries is fetched at runtime from `https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json`. This requires a network connection on first render.

## Architecture

The file has three logical sections, top to bottom:

1. **Data layer** (~lines 1–117): constants, `games` array, utility functions
2. **`USMap` component** (~lines 140–430): D3-powered SVG map, all visual rendering
3. **`App` component** (~lines 432–664): layout shell, filter state, sidebar

### Component Responsibilities

**`USMap`** owns all map rendering. It receives `destinations` (grouped, filtered), `selectedDest`, `hoveredDest`, and two callbacks (`onHover`, `onSelect`). It manages its own D3 zoom state, SVG dimensions (via ResizeObserver), and TopoJSON feature state. It does not know about filters.

**`App`** owns filter state and selection state. It derives `destinations` from `filteredGames` → `groupByDest()`, computes sidebar stats from the unfiltered `allDests`, and passes everything down to `USMap` and the sidebar JSX.

Stats (`totalMiles`, `awayTrips`, etc.) are always calculated from the full unfiltered game list — this is intentional, the stat cards represent season totals regardless of active filter.

## Key Patterns and Conventions

### Zoom-aware sizing
Every SVG element that should not scale with zoom divides its size by `zoom.k`:
```js
strokeWidth={1.2 / zoom.k}
fontSize={11 / zoom.k}
```
Do not add new SVG elements without applying this pattern.

### `proj()` argument order
Use the local `proj(lat, lng)` shorthand defined inside `USMap` rather than calling `projection([lng, lat])` directly. The helper takes `(lat, lng)` but internally inverts for D3's `[lng, lat]` convention.

### D3 zoom stored on DOM node
The zoom behavior is stored as `svgRef.current.__zoomBehavior`. This lets `handleZoomIn`, `handleZoomOut`, and `handleReset` callbacks access it without React state or a ref. Do not remove this pattern without updating all three handlers.

### Inline CSS only
No stylesheet, no CSS modules, no Tailwind. All styles are inline `style` objects or a single `<style>` tag in `App` for `@import` and global resets.

### Color constants
Colors are hardcoded strings throughout. Keep these three consistent:
- `#154734` — Baylor green (header background)
- `#FFB81C` — Baylor gold (Big 12, home, accents)
- `#4ecdc4` — teal (non-conference, Florida Swing, farthest trip card)

## Data Model

### `games` array
```js
{
  date: "Mar 11",          // display string; may be a range ("Mar 7-8")
  opponent: "Stetson",
  location: "DeLand, FL",  // used as destination key throughout
  lat: 29.0283,
  lng: -81.3032,
  home: false,
  result: null,            // null = upcoming; "W 6-3" or "L 0-8" = played
  conference: false,
  tournament: "...",       // optional display name
  swing: "florida-swing",  // optional; links to a TRIP_SWINGS entry by id
}
```

### `TRIP_SWINGS`
Defines multi-stop road trips:
```js
{ id: "florida-swing", label: "Florida Swing", stops: ["DeLand, FL", "Orlando, FL"] }
```
`stops` must exactly match `location` values in `games`. Adding a new swing requires: (a) adding a `TRIP_SWINGS` entry, (b) tagging relevant game records with `swing: "your-id"`.

### Mileage calculation (`calcTotalMiles`)
- Normal away trip: `haversine(Waco, dest) * 2`
- Swing trip: `haversine(Waco, stop1) + haversine(stop1, stop2) + ... + haversine(lastStop, Waco)`

Each swing is counted once as a continuous route.

## What NOT to Touch

**`baylor-softball-globe.jsx`** is the archived v2 Three.js 3D globe version. It is kept for reference only — do not modify it or treat it as a development target.

## Source of Truth

**`baylor-softball-travel-map-spec.md`** is the authoritative design document. When there is ambiguity about intended behavior, check the spec before modifying the code.
