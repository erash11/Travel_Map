# Agent Handoff — Travel Map

This file orients any coding agent (Codex, Claude Code, etc.) picking up this project.
**Read `CLAUDE.md` first** — it has the full architecture, conventions, data schema,
and deployment workflow. This file adds current-state context that changes more often.

## Current state (2026-06-10)

- **Live site:** https://erash11.github.io/Travel_Map/ — deploys automatically on push
  to `main` (GitHub Actions). Never re-run a failed deploy job; use workflow_dispatch.
- **Softball 2026 data is complete and verified** against BaylorBears.com /
  big12sports.com (58 games incl. Big 12 Tournament + NCAA Austin Regional, 30-28,
  10,842 season miles). `src/data/softball.json` is the reference dataset.
- **Football and volleyball schedules are live:** commit `c8c4f11` added
  `src/data/football-2025.json` (12 games), `src/data/football-2026.json`
  (13 games), `src/data/volleyball-2025.json` (28 games), and
  `src/data/volleyball-2026-spring.json` (7 games). The editable CSV sources
  are in `schedule-imports/`.
- **Cinematic mode is shipped:** full-screen 3D globe season tour (react-globe.gl,
  lazy-loaded). Spec: `docs/superpowers/specs/2026-06-10-cinematic-mode-design.md`.
  Entry: gold "✦ Cinematic" button on the sport map page.
- **Schedule Import is shipped:** "+ Import Schedule" card on the grid → CSV upload,
  geocoding (bundled `public/us-cities.json`, regenerate via
  `node scripts/build-cities.mjs`), validation with inline unknown-city fixes,
  localStorage preview, Download JSON for publishing.
  Spec: `docs/superpowers/specs/2026-06-10-schedule-import-design.md`.
  To publish an imported sport permanently: Download JSON → `src/data/<sport>.json`
  → add to `src/data/index.js` → push.

## Gotchas an agent needs to know

- **Destination identity is `lat,lng`, never the location string** — Baylor visited
  Austin, TX twice in 2026 (March series + May NCAA regional, intentionally offset
  coords). Keying anything by location string reintroduces fixed bugs.
- Stats are always computed from the **unfiltered** game list (see CLAUDE.md).
- `buildTimeline` (cinematic) must keep its cumulative total identical to
  `calcTotalMiles` — there's a unit test locking this.
- Inline styles only; no CSS files. Baylor palette in CLAUDE.md.
- Tests: `npm test` (vitest). Build: `npm run build`. Both must pass before push;
  pushing to main deploys to production immediately.
- `.worktrees/` contains stale git worktree copies whose tests also run — ignore
  their results or remove the worktree.
- Baylor's official 2026 spring football item is a practice/Fan Fest
  announcement, not an opponent schedule suitable for the travel map. The
  active `football-2026` dataset is the fall regular-season schedule.

## Owner

Eric Rash (Director of Applied Performance, Baylor Athletics). He is the only
schedule-data editor; coaches/admins only view the site.
