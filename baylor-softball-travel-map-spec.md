# Baylor Softball 2026 — Season Travel Map

## Project Spec Sheet & Summary

**Prepared for:** Baylor Athletics
**Department:** Applied Performance
**Date:** March 10, 2026
**Author:** Eric Rash, Director of Applied Performance

---

## Project Overview

This is an interactive travel visualization for the 2026 Baylor Softball season. The tool gives coaches, support staff, and athletes a clear picture of the travel demands across the full schedule — 54 games, 10 away destinations, and an estimated 13,000+ round-trip miles.

The final deliverable is a browser-based React application that renders an SVG map of the continental United States with real state boundaries, curved travel arcs from Waco to each away destination, and a sidebar with game-by-game detail. It runs entirely in the browser with no backend required.

---

## Objectives

- Visualize the geographic scope of the season's travel demands on a US map
- Provide interactive filtering by game type (All, Away, Home, Big 12 Conference)
- Show mileage, opponent, date, and result for each destination
- Accurately model multi-stop trips (e.g., the Florida Swing) rather than treating each stop as a separate round trip
- Support zoom and pan for detailed exploration of regional clusters
- Present summary statistics (total miles, trip count, home/away split) at a glance

---

## Technical Specification

### Architecture

| Component | Detail |
|-----------|--------|
| Framework | React (JSX, functional components with hooks) |
| Map Rendering | D3.js v7 with geoAlbersUsa projection, SVG-based |
| Geography Data | US Census TopoJSON (us-atlas@3/states-10m.json) decoded client-side |
| Zoom/Pan | D3 zoom behavior (1x to 8x), scroll wheel + drag + button controls |
| Styling | Inline CSS, DM Sans + JetBrains Mono via Google Fonts |
| Color Scheme | Baylor green (#154734) base, gold (#FFB81C) for Big 12, teal (#4ecdc4) for non-conference |
| Hosting | Static file, runs in any modern browser (Claude.ai artifact, localhost, or web server) |
| Dependencies | React, D3.js (both available in artifact environment) |

### Key Features

#### Interactive US Map

Real state boundaries rendered from TopoJSON via D3's Albers USA projection. Curved bezier arcs connect Waco (home) to each away destination. Gold arcs represent Big 12 conference games; teal arcs represent non-conference and tournament games. Hovering or clicking a destination highlights the arc with a glow effect and displays the mileage inline.

#### Zoom and Pan

Full zoom (1x to 8x) via scroll wheel, trackpad, or the +/- buttons in the bottom-right corner. A reset button returns to the default view. All labels, dots, and stroke widths scale proportionally with zoom level so the map stays clean at any magnification. A zoom percentage indicator appears when zoomed past 100%.

#### Multi-Stop Trip Routing

The Florida Swing (Stetson in DeLand, then UCF in Orlando) is modeled as a single continuous trip: Waco to DeLand to Orlando to Waco. When either Florida destination is hovered, the entire three-leg route highlights together with a combined mileage label. This structure is extensible via the TRIP_SWINGS array for other multi-stop road trips.

#### Sidebar Panel

The right-side panel contains a 2x2 grid of stat cards (Total Travel Miles, Away Trips, Home Games, Big 12 Games), a Farthest Trip callout, and a scrollable destination list. Each destination card expands on click to show full game details with date, opponent, and result (color-coded green for wins, red for losses, gray for upcoming). Tournament names and Florida Swing membership are labeled on each card.

#### Filters

Four filter buttons in the header (All, Away, Home, Big 12) dynamically update both the map and sidebar. Selecting a filter clears any active selection and redraws arcs/dots for the filtered subset only.

---

## Season Data Summary

| Metric | Value |
|--------|-------|
| Total Games | 54 |
| Home Games | 30 (Getterman Stadium, Waco) |
| Away Games | 24 |
| Away Destinations | 10 unique locations |
| Big 12 Conference Games | 21 |
| Estimated Total Travel Miles | ~13,000 (round-trip) |
| Farthest Destination | San Diego, CA (~1,300 mi one-way) |
| Multi-Stop Trips | 1 (Florida Swing: DeLand + Orlando) |
| Current Record (as of Mar 10) | 17-6 (.739) |

### Away Destinations

| Destination | Dates | Games | Distance | Type |
|-------------|-------|-------|----------|------|
| San Diego, CA | Feb 12-14 | 5 | 1,303 mi | Tournament |
| Clemson, SC | Feb 20-22 | 4 | 1,007 mi | Tournament |
| Huntsville, TX | Feb 25 | 1 | 158 mi | Non-Conf |
| DeLand, FL | Mar 11 | 1 | 1,038 mi | FL Swing |
| Orlando, FL | Mar 13-15 | 3 | 1,059 mi | FL Swing / Big 12 |
| Austin, TX | Mar 20 | 1 | 100 mi | Non-Conf |
| Tucson, AZ | Mar 27-29 | 3 | 884 mi | Big 12 |
| Arlington, TX | Apr 8 | 1 | 96 mi | Non-Conf |
| Lawrence, KS | Apr 10-12 | 3 | 520 mi | Big 12 |
| San Marcos, TX | Apr 22 | 1 | 120 mi | Non-Conf |
| Lubbock, TX | Apr 30-May 2 | 3 | 280 mi | Big 12 |
| Oklahoma City, OK | May 6-9 | TBD | 280 mi | Big 12 Tourn. |

---

## Development Process

### Iteration History

The project went through four major iterations based on feedback:

- **Version 1:** Flat SVG US map with hand-drawn state grid, straight dashed travel lines, sidebar with 2x2 stat cards and scrollable destination list. Functional but the map lacked geographic accuracy.
- **Version 2:** 3D globe using Three.js with curved arcs, rotation, and destination dots. Visually impressive but the flat map was preferred for practical readability.
- **Version 3:** D3.js flat map with real US Census TopoJSON state boundaries, curved bezier arcs, and glow effects on hover. Sidebar switched to a compact monospace style.
- **Version 4 (Final):** Added D3 zoom/pan (scroll + buttons, 1x-8x). Fixed the Florida Swing to model DeLand and Orlando as a single multi-stop trip instead of separate round trips. Restored the original v1 sidebar style with the 2x2 stat card grid, farthest trip callout, and padded destination cards.

### Data Source

All schedule data was scraped directly from baylorbears.com/sports/softball/schedule/2026 on March 10, 2026. Results are populated through March 8 (Iowa State series sweep). Remaining games are marked as upcoming. Coordinates for each destination were manually assigned based on venue locations.

---

## File Deliverables

| File | Type | Description |
|------|------|-------------|
| baylor-softball-travel-map.jsx | React Component | Final interactive travel map (v4) |
| baylor-softball-globe.jsx | React Component | 3D globe version (v2, archived) |
| This document | .md | Project spec sheet and summary |

---

## Future Considerations

- Adapt the same visualization for the football schedule or other sports with heavy travel
- Add estimated flight vs. bus thresholds (e.g., trips over 500 miles are likely flights)
- Overlay travel load data with athlete monitoring metrics (Player Load, CMJ scores) to assess the physiological cost of road trips
- Integrate with the AMS/Power BI pipeline for automatic schedule ingestion from Catapult or internal databases
- Add additional multi-stop trip definitions as the TRIP_SWINGS array supports any number of connected destinations
