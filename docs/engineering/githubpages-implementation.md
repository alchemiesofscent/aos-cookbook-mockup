# GitHub Pages Implementation Plan (Bounded Patch)

This document evaluates `gitpages.md` and proposes a revised, *single bounded patch* to add GitHub Pages deployment plus a deterministic first-load dataset via a `seed.json` → localStorage overlay. It intentionally does **not** include the larger “replace all dummy reading data with storage-backed data” refactor.

## Evaluation of `gitpages.md`

What’s strong / should be kept:
- Correctly identifies the hard part: annotation UI relies on segment-level anchors, so MVP should store `combinedSegments` directly.
- Correctly frames GitHub Pages deployment + Vite `base` as routine/low-risk.
- Correctly separates MVP vs deferred (no Greek-only highlighting, no deep-link routing yet).

What to tighten for an actual implementation patch:
- **Bound the patch scope**: `gitpages.md` currently spans multiple phases (TS config, deploy, data migration, UI refactors). For a first patch, keep the surface area small.
- **Seed overlay must be explicit**: “seed from JSON then persist to localStorage” should be treated as required for GitHub Pages first-load.
- **Avoid `npm ci` if there’s no lockfile**: the repo currently lacks `package-lock.json`; `npm ci` will fail on Actions unless we add a lockfile or switch to `npm install`.
- **Remove Gemini surface area**: for a no-LLM Pages MVP, delete `GEMINI_API_KEY` defines and `@google/genai` usage/dependencies to keep CI predictable and avoid implying runtime API calls.

## Revised Strategy (Single Patch)

Goal: Deploy the existing app to GitHub Pages and ensure first-time visitors get deterministic content by fetching `public/data/seed.json` and writing it into the existing localStorage keys before the app renders.

Key principle: **Seed file is canonical demo content; localStorage is a per-browser overlay.** The rest of the UI stays unchanged.

## Scope (Do ONLY this)

1. GitHub Pages deploy via GitHub Actions (publish `dist/`).
2. Vite base-path support for project pages (`/<repo>/`).
3. Add `public/data/seed.json` (Option A) in `DatabaseState` shape.
4. Add a seed-overlay loader in `src/storage.ts`:
   - If localStorage is empty, fetch seed, populate the existing storage keys, then proceed.
   - If fetch fails, fall back to the current in-code `SEED_DATA` and populate keys from that.
5. Gate app startup on the seed-overlay loader (a tiny bootstrap wrapper in `src/main.tsx`).
6. Dev-only invariant checks remain guardrails:
   - hard error if any annotated segment id is missing from `recipe.annotations`
   - warning if segment visible text differs sharply from `annotation.term`
   - duplicate annotation ids forbidden only during array→map conversion at ingest time (`annotationsArrayToMap`)

## Non-Goals (Explicitly Out of Scope)

- No routing/deep links, no 404.html SPA fallback.
- No per-recipe JSON fetch orchestration (`index.json` + `recipes/<slug>.json`).
- No schema redesign beyond adding `seed.json` and the `combinedSegments`/`annotations` fields already added to `src/types.ts`.
- No removal/refactor of the existing hardcoded reading-page dummy constants (beyond optional renames to avoid footguns).
- No LLM integrations; any “LLM assistance” remains copy/paste external workflow only.

## Implementation Plan (Patch Steps)

### 1) GitHub Actions workflow: Pages deploy
Files:
- Add `.github/workflows/deploy.yml`

Workflow details:
- Trigger: `push` to default branch + `workflow_dispatch`.
- Permissions: `contents: read`, `pages: write`, `id-token: write`.
- Node: use Node 20 (or match `package.json` if pinned).
- Install:
  - If no lockfile: use `npm install`.
  - If we later add a lockfile: switch to `npm ci`.
- Build: `npm run build`.
- Deploy: `actions/upload-pages-artifact` (from `dist/`) + `actions/deploy-pages`.
- Concurrency: ensure only one Pages deploy at a time (recommended GitHub Pages pattern).

### 2) Vite base path for GitHub Pages
Files:
- Update `vite.config.ts`

Approach:
- Prefer an env-driven base to avoid hardcoding repo names in code:
  - `base: process.env.VITE_BASE ?? "/"`.
  - In the workflow, set `VITE_BASE=/${{ github.event.repository.name }}/`.
- Keep local dev base as `/` (no env set locally).

Also:
- Set `base` from `process.env.VITE_BASE` in CI to avoid hardcoding repo names.

### 3) Add `public/data/seed.json` (Option A)
Files:
- Add `public/data/seed.json`

Requirements:
- Must be valid JSON; no trailing commas.
- Shape must match `DatabaseState` in `src/types.ts`:
  - `recipes: Recipe[]` (include at least one recipe)
  - `masterIngredients/masterTools/masterProcesses/masterWorks/masterPeople` arrays (can be empty, but see note below)
- Each seeded recipe should include:
  - `text.original`, `text.translation`, `text.notes`
  - `text.combinedSegments` (the Combined view segments)
  - `annotations` (map keyed by id), where `annotation.term` can be English for tool/process highlights

Note on “minimal masters”:
- Prefer including the relevant master arrays for a richer browsing experience, or set `RecipeItem.masterId` to `null` consistently when master arrays are empty.

### 4) Implement seed-overlay loader in `src/storage.ts`
Files:
- Update `src/storage.ts`

Add exports:
- `loadState(): Promise<DatabaseState>`
  - If localStorage indicates the DB is already initialized, return `StorageAdapter.load()`.
  - If empty:
    - Fetch the seed file using a base-safe URL:
      - `new URL("./data/seed.json", import.meta.env.BASE_URL).toString()`
    - On success:
      - Parse as `DatabaseState`.
      - Write the arrays into the existing localStorage keys used by `StorageAdapter` (recipes, ingredients, tools, processes, works, people).
      - Return `StorageAdapter.load()`.
    - On failure:
      - Populate the existing localStorage keys from in-code `SEED_DATA` (current behavior), then return `StorageAdapter.load()`.
- `saveState(data: DatabaseState): void` as a thin wrapper over `StorageAdapter.save`.

Keep everything else in `src/storage.ts` unchanged.

### 5) Gate app startup on the loader (without refactoring pages)
Files:
- Update `src/main.tsx`

Approach:
- Add a tiny `Bootstrap` component that:
  - calls `await loadState()` on mount
  - renders a minimal loading placeholder until ready
  - then renders the existing `<App />` unchanged

Why:
- Ensures localStorage-backed state is initialized from seed-derived data.
- Avoids a broad refactor of all hardcoded demo constants in this patch.

### 6) Dev-only invariants run on seeded recipes (guardrail)
Files:
- Update `src/main.tsx` (or `src/storage.ts`, whichever is least invasive)

In DEV only:
- After `loadState()` resolves, iterate `db.recipes` and run:
  - `assertRecipeAnnotationInvariants({ segments: recipe.text.combinedSegments ?? legacyFallback, annotations: recipe.annotations })`
- This does not replace manual parity testing; it prevents silent breakage when seed JSON is edited.

## Repo Configuration Steps (Document in `gitpages.md`)

After merging the patch:
- GitHub repo → Settings → Pages
  - Source: **GitHub Actions**
- Confirm Pages environment deploy succeeds on default branch push.

## Acceptance Checklist (for this patch)

- CI: GitHub Actions workflow completes and deploys successfully.
- Pages: app loads at `https://<user>.github.io/<repo>/` with correct asset paths.
- First-load behavior: fresh browser profile (no localStorage) still loads content (seed overlay works).
- No behavior regressions: existing UI flows behave the same as before.
- Dev guardrail: breaking `seed.json` (missing annotation id) throws a clear error in dev.

## Inputs Needed Before Implementation

- Confirm default branch name (`main` vs `master`) for workflow trigger.
- Confirm repo name for Pages (expected: `aos-cookbook-mockup`), or confirm we should rely on `${{ github.event.repository.name }}` only.
- Decide whether `seed.json` should replicate `storage.ts`’s current `SEED_DATA` (safer for parity) or be “minimal + null masterIds” (smaller but potentially more edge cases).
- Decide whether `seed.json` should replicate `storage.ts`’s current `SEED_DATA` (safer for parity) or be “minimal + null masterIds” (smaller but potentially more edge cases).
