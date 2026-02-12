---
title: Architecture overview
---

## Summary
The Cookbook is a static React SPA. All canonical data is shipped as JSON in `public/data/seed.json` and loaded at runtime into `localStorage` by `src/storage.ts`. The app is designed to run on static hosting with no server-side CMS.

## Data flow
- Build-time data lives in `public/data/seed.json` and `public/data/version.json`.
- On first load (or when the local DB version changes), the app fetches the seed and writes it to `localStorage`.
- Subsequent loads read from `localStorage` for performance and offline resilience, with selective merges from the seed.

## Routing
- Internal routes are canonical strings (e.g. `recipe:r-rose-perfume`, `person:p-sean-coughlin`).
- The browser URL uses a query-param route for static hosting: `/?r=routeString` (plus `q` and filters for search).
- Legacy routes are accepted and canonicalized on load.

## Constraints
- No host rewrites (path-based routing is avoided).
- All content is static or derived from localStorage.
- The dataset is the source of truth for navigation, not hand-built lists.
