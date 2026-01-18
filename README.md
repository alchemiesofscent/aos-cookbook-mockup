# Alchemies of Scent — The Laboratory (Cookbook mockup)

A small web app for turning ancient recipe texts into structured, linkable data while preserving scholarly uncertainty. It supports close reading (original text + translation), a curated “Combined view” for readable annotation, and a lightweight editing workflow that can run entirely on GitHub Pages.

Point of the project (MVP)
- Read one recipe as text, with selected terms highlighted.
- Click highlights to open short notes (ingredient / tool / process / philological notes).
- Keep the Combined view readable by leaving ingredient terms in the original script (Greek/Latin/Egyptian), while tools and processes stay in English.
- Store Combined view as pre-segmented text so annotation behaviour is stable and predictable.

This repo is intentionally “static-site friendly”: no database, no server, no runtime LLM calls, and no API keys.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   - `npm install`
2. Run the dev server:
   - `npm run dev`
3. Build and preview production bundle:
   - `npm run build`
   - `npm run preview`

## What exists in this repo

- A Vite + React + TypeScript app (`src/`).
- Deterministic seed data for GitHub Pages (`public/data/seed.json`).
- localStorage persistence (per browser) so the seed overlay persists without a backend (no in-app editor in the static-site MVP).
- Dev-only guardrails to catch broken annotation ids (`src/invariants.ts`).
- Project documentation (`docs/`), including PRD / Tech Spec / UX.

## How data works (seed overlay → local edits)

This app uses a seed overlay pattern:

1) First load (fresh browser / empty localStorage)
- Fetch `public/data/seed.json`
- Copy it into localStorage
- Render from localStorage state

2) After that
- localStorage is the active state for that browser
- changes persist on refresh

Why this design:
- GitHub Pages needs deterministic demo content.
- localStorage gives “database-like” persistence without a server.
- later, this can be swapped for a real database without changing the core data model too much.

Key contracts:
- `src/types.ts` defines `DatabaseState` and entity types.
- `public/data/seed.json` must conform to `DatabaseState`.

## The annotation model (why pre-segmented Combined view)

The Combined view is stored as an ordered array of segments:
- `recipe.text.combinedSegments`: `[{ text }, { text, type: "annotation", id } …]`

Each annotated segment references:
- `recipe.annotations[id]`

This avoids fragile runtime anchoring (string search / offsets / tokenisation drift) and makes the wireframe reliable.

Rules:
- Reusing the same annotation id across multiple segments is allowed (same note reused).
- In dev mode, missing annotation ids are a hard error.
- In dev mode, obvious mismatches between segment text and `annotation.term` warn.

## Ingesting a recipe (manual workflow, MVP)

We do not ingest recipes in-app yet. The MVP workflow is manual copy/paste + JSON:

1) Gather inputs
- Source work (edition/translation)
- Citation/locator
- Original text (as edited)
- English translation

2) Produce an ingest JSON
- Use `docs/engineering/recipe-ingest.md` as the specification.
- You can use an external LLM to help generate the JSON, but you must review and correct it.

3) Merge into seed
- Add the new recipe (and any required master entities) into `public/data/seed.json`
- Run locally in dev and watch the console for invariant errors.

What the ingest output should include (at minimum):
- recipe metadata (`src/types.ts` fields) plus any extra bibliographic detail in `masterWorks` and/or `recipe.text.notes`
- original text and translation
- `combinedSegments` for Combined view
- `annotations` map
- `items` list (ingredients/tools/processes with quantities, where available)

## GitHub Pages deployment

Deployment uses GitHub Actions: `.github/workflows/deploy.yml`

Setup:
- Repo Settings → Pages → Source: GitHub Actions

Important:
- Vite must build with the correct base path for project pages.
- The workflow sets `VITE_BASE` to `/<repo>/` during build.

URL:
- `https://<user>.github.io/<repo>/`

## Repo structure

- `docs/`: PRD, Tech Spec, UX, and engineering notes (including ingest spec).
- `public/`: static assets; seed data lives in `public/data/seed.json`.
- `src/`: app code (storage, types, invariants, UI).

## Development notes

- `node_modules/` and `.venv/` should not be committed (they are local environment artefacts).
- If you edit `seed.json` and something breaks, check the dev console first (invariants are designed to fail fast).

## Licence

MIT. See `LICENSE`.
