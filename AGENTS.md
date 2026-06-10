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
- **Cinematic mode is shipped:** full-screen 3D globe season tour (react-globe.gl,
  lazy-loaded). Spec: `docs/superpowers/specs/2026-06-10-cinematic-mode-design.md`.
  Entry: gold "✦ Cinematic" button on the sport map page.
- **In progress: Schedule Import (CSV → sport JSON).**
  Spec: `docs/superpowers/specs/2026-06-10-schedule-import-design.md` — read it in
  full before continuing. Check `git log` for which pieces are already committed;
  each piece lands as its own commit.

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

## Owner

Eric Rash (Director of Applied Performance, Baylor Athletics). He is the only
schedule-data editor; coaches/admins only view the site.
