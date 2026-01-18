# Roadmap (Current)

Where we are now
- Static dataset site (React/Vite) with no in-app editor.
- Canonical data: `public/data/seed.json`.
- Dataset version metadata: `public/data/version.json`.
- Dataset validation: `npm run validate:seed` (seed + version + link integrity checks).
- Pins live in `public/data/seed.json` (`db.pins`) for exportable joins.
- Deployment target: GitHub Pages (static hosting).

v0.1 definition of done
- `npm run build` and `npm run validate:seed` pass on a clean checkout.
- No dangling ids across core collections (recipes, terms, identifications, products, sources, works, people).
- Footer displays dataset version from `public/data/version.json` (or “unavailable” if missing).
- Core navigation works end-to-end: Recipe → Ancient Term → Identification → Product → Source.

Next milestones
- Add CI step to run `npm run validate:seed` before build/deploy.
- Extend `validate:seed` to check route targets in curated content (homepage routes).
- Add export artefact(s) (downloadable dataset JSON) labelled by `public/data/version.json`.
- Add “Cite this” blocks for core entities (recipe, term, identification, product, source, work, person).
- Add JSON-LD exports for the same entity set.
- Add link/invariant checks for `combinedSegments` coverage and annotation link targets.
- Expand real recipe corpus (add 3–5 fully curated recipes with combinedSegments + annotations).
- Mobile QA pass for recipe reading + notes panel (annotated mode).

