# Alchemies of Scent — The Laboratory (Cookbook mockup)

A small React/Vite static-site-friendly app for reading ancient scent recipes with a stable, pre-segmented annotated view and a data model that links ancient terms → identifications → modern materials.

Data source: the site seeds from `public/data/seed.json` (persisted per-browser in localStorage). There is no in-app editor in the static-site MVP; editing is via JSON + tooling/scripts.
Dataset version metadata lives in `public/data/version.json`. Validate dataset integrity locally with `npm run validate:seed`.

## Docs

- Docs index: `docs/README.md`
- PRD v3.0 (Static Site): `docs/prd/PRD_v3.0_StaticSite.md`
- Technical Spec v2.0 (Static Site): `docs/tech/Technical_Specification_v2.0_StaticSite.md`
- UX/IA Appendix v2.0 (Static Site): `docs/ux/UX_IA_Appendix_v2.0_StaticSite.md`

## Run locally

**Prerequisites:** Node.js

- Install: `npm install`
- Dev server: `npm run dev`
- Production build: `npm run build`
- Preview build: `npm run preview`

## Licence

MIT. See `LICENSE`.
