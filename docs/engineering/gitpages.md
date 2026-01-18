# GitHub Pages + Storage-Backed Data Plan (no implementation yet)

Note: This is the canonical deploy doc.

## Goals
- Deploy the Vite + React app to GitHub Pages.
- Replace any dummy data in `src/main.tsx` with data loaded from `src/storage.ts`, `src/units.ts`, and `src/types.ts`.
- Preserve **annotation behavior exactly as it works today** with the dummy data (same interactions, same state transitions, same UI behavior).
- Support **three text displays** for a recipe:
  - **Original Greek**
  - **English translation**
  - **Combined view** (English narrative where **ingredient terms remain in the original language/script** (Greek/Latin/Egyptian/etc.) for interpretive ambiguity, while **tools/processes remain English for readability**; highlights are a curated subset, not full coverage)

## Decisions / User Input Needed (before coding)
1. **GitHub Pages target**
   - Repo URL and repo name (needed to set Vite `base`, e.g. `/<repo>/`).
   - Deploy to **`https://<user>.github.io/<repo>/`** (project page) or **`https://<user>.github.io/`** (user/org page).
2. **Deployment method**
   - Recommended: **GitHub Actions → Pages** (build on CI, publish artifact).
   - Alternative: `gh-pages` branch with a `dist/` push script.
3. **No LLM/API calls**
   - Confirm the app should ship with **zero** LLM integrations and **no** runtime API keys for LLMs.
   - Any “prompting” is done by the user manually (copy/paste), not through in-app API calls.
4. **Combined-view annotation policy (MVP)**
   - **Ingredients:** displayed inline in their original language/script; only selected terms/occurrences are annotated/highlighted/clickable.
   - **Tools & processes:** displayed inline in English; only selected terms/occurrences are annotated/highlighted/clickable (Greek lemma can live in the Notes card).
   - Notes card is the same shape for all annotation types (ingredient/tool/process); unannotated terms render as plain text.

## Implementation Plan

### Phase 1 — Baseline build correctness (local)
1. Fix TypeScript config so editor/build matches Vite aliasing:
   - Add `compilerOptions.baseUrl: "."` in `tsconfig.json` (required when using `paths`).
   - Confirm `@/...` imports resolve consistently between TS + Vite.
2. Install deps and confirm the app builds locally:
   - User runs: `npm install`
   - User runs: `npm run build`
   - User runs: `npm run preview` and checks core flows.

### Phase 2 — GitHub Pages deployment (CI)
1. Update Vite config for GitHub Pages base path:
   - Set `base` in `vite.config.ts` from an env var (recommended for CI):
     - `base: process.env.VITE_BASE || "/"`.
   - In GitHub Actions, set `VITE_BASE` to `"/<repo>/"` for project pages.
   - Keep local dev base as `/` (no env var set locally).
2. Add a GitHub Actions workflow to build + deploy:
   - Add `.github/workflows/deploy.yml` using:
     - `actions/checkout`
     - `actions/setup-node`
     - `npm install` (or `npm ci` if a lockfile is committed)
     - `npm run build`
     - `actions/upload-pages-artifact` (from `dist/`)
     - `actions/deploy-pages`
3. Configure repo settings (user input):
   - User goes to **Settings → Pages**:
     - Set **Source** to **GitHub Actions**.
     - Verify the environment is `github-pages` (workflow uses it by default).
4. SPA refresh behavior (only if URL routing is introduced):
   - Current app uses state-based routing (URL does not change), so **no** GitHub Pages `404.html` SPA fallback is needed yet.
   - If you later add deep links (shareable URLs), adopt one:
     - Hash routing (`/#/...`) or
     - URL routing + `404.html` fallback redirect.

### Phase 3 — Replace dummy data with storage-backed data (preserve annotations)
1. Identify the current “dummy data” sources and the annotation behavior:
   - Locate dummy dataset definitions in `src/main.tsx`.
   - Map what annotation state exists (shape, ids, how created/edited/deleted, how it attaches to entities).
   - Document invariants that must not change (e.g., annotation ids stable, selection rules, highlight behavior).
2. Lock the v1 **segments contract** (critical):
   - The current UI expects **pre-parsed `textSegments`** with inline annotation markers (the dummy Rose recipe format).
   - MVP choice (parity-first): make `combinedSegments` authoritative for the Combined view (store it directly; do **not** derive it from raw strings in v1).
   - Author/seed `combinedSegments` via the external-prompt → manual-revision workflow (see `annotations.md`).
   - Future (not v1): if we later want to derive highlights from raw text, consider explicit anchors/ranges or lightweight markup, but keep v1 simple and stable.
3. Define the “single source of truth” data model using `types.ts`:
   - Use `src/types.ts` as the canonical contract.
   - Ensure there is a canonical `AppState`/`CookbookState` type that includes:
     - The core cookbook entities (recipes, ingredients, etc.)
     - The annotation collection(s)
     - Any UI-persisted preferences (if applicable)
4. Model the **three recipe text displays**:
   - Store (or derive) three parallel representations:
     - `originalGreek` (string)
     - `englishTranslation` (string)
     - `combinedSegments` (segments array OR derivable via hydration)
   - Default view behavior:
     - Combined view is the primary annotated reading experience (ingredients in original language/script; tools/processes in English; any subset can be highlighted/clicked).
     - English-only and Greek-only views can be display-only initially (no requirement to annotate Greek-only, consistent with PRD “deferred” items).
     - Side-by-side is a UI presentation mode (English + Greek) and does not need a separate stored text representation.
5. Wire `storage.ts` to load/save the typed state:
   - Use `src/storage.ts` for local persistence and seed overlay.
   - Add `loadState()` / `saveState()` primitives if they don’t exist.
   - Add a **migration layer**:
     - If existing localStorage keys/shape differ, migrate old → new without breaking users.
6. Use `units.ts` during load/normalize (not in the UI):
   - Use `src/units.ts` for normalization helpers.
   - Normalize stored data into consistent internal units on load (or store normalized form).
   - Only convert for display at the edge (UI formatting).
7. Replace dummy initialization in `src/main.tsx`:
   - On startup:
     - Attempt to `loadState()` from storage.
     - If empty/uninitialized, seed with the current dummy dataset (so the app still has meaningful content).
     - For deterministic “first load” content on GitHub Pages for new visitors, seed from a committed JSON file (e.g. `public/data/seed.json`) and then persist into localStorage (overlay pattern).
   - Crucially: keep annotation handlers as-is:
     - Move them into a dedicated hook/module (e.g. `useAnnotations(...)`) without changing behavior.
     - Ensure the hook operates on the same state shape and emits the same updates; only persistence changes.
8. Persistence strategy to avoid behavior regressions:
   - Keep annotation updates synchronous in UI (optimistic) as currently implemented.
   - Persist after state updates (debounce optional, but only if it does not change UX semantics).

### Phase 4 — Validation checklist
1. Manual parity checklist (authoritative):
   - Create annotation(s), edit, delete, attach/detach (whatever current flows exist).
   - Verify selections, highlights, ordering, and rendering match current behavior.
   - Reload page: annotations persist and behave identically.
   - Parity harness: load the Rose recipe through the new seed/storage pipeline and confirm segment shape + click/selection behavior matches pre-migration.
2. Dev-only invariant check (guardrails; fail fast in development only):
   - Assert every `combinedSegments` annotation `id` exists in the `annotations` map.
   - (Optional) Assert every `annotation.links[].route` is a string.
   - (Optional) If ingesting annotations as an array, throw on duplicate annotation `id`s when converting to a map (ingest/build-time).
   - (Optional) Warn if an annotation `id` is used on segment text that differs sharply from `annotation.term` (helps catch accidental collisions).
   - Manual parity is authoritative; automated checks are guardrails.
3. Storage correctness:
   - Clear storage → app seeds correctly.
   - Existing storage (if any) migrates without crashing.
4. GitHub Pages smoke test:
   - After merge to default branch, Actions deploy succeeds.
   - Visit `https://<user>.github.io/<repo>/`:
     - Loads with correct asset paths (no 404s for JS/CSS).
      - Refresh works on deep links (if routing exists).

## Deliverables (what will be changed when we implement)
- `tsconfig.json`: add `baseUrl` (and any other small TS/Vite alignment tweaks).
- `vite.config.ts`: set `base` for GitHub Pages.
- `.github/workflows/deploy.yml`: GitHub Pages deployment pipeline.
- `public/data/seed.json`: versioned canonical demo content for first-load on GitHub Pages (localStorage becomes per-browser overlay).
- `src/main.tsx`: remove dummy-data wiring; load from `src/storage.ts` and keep existing annotation logic intact; support 3 text displays.
- Potential small refactors: extract annotation logic into a hook/module (no behavior change), add seed + migration logic in `src/storage.ts`.

## What I need from you before implementation
- Confirm the repo name used for Pages (the `/<repo>/` base path).
- Confirm the deployment approach (Actions→Pages recommended).
- Confirm the intended behavior of annotations across the three displays (default: annotations in Combined view; English/Greek views display-only initially; Combined view supports optional highlights for any subset of ingredient/tool/process terms while keeping tools/processes in English for readability).
