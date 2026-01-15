# Studio (Preview) — Current Wireframe State

This repo includes a Phase 2 **Studio (Preview)** page that renders a modern recipe-style output for a single demo recipe (Rose Perfume). Studio is an offline, deterministic, read-only composer: users can only select among pre-authored interpretation options and scale quantities; they cannot create or edit scholarly claims.

## Where it lives

- Route: `studio` (string-switch routing in `src/main.tsx`)
- Page component: `src/pages/studio/StudioPage.tsx`
- Entry point: Rose Perfume recipe page includes an **Open in Studio** action in `src/main.tsx`

## What the Studio page does

- Renders a modern recipe layout:
  - Title + intro + yield + time note + hero image placeholder
  - Two-column body: ingredients (left) and steps (right)
  - Interpretation side drawer (right) for ambiguous ingredients
- Uses localStorage for sessions:
  - Creates/resumes a session per recipe and persists scale + selections
  - Keys: `AOS_STUDIO_SESSIONS`, `AOS_STUDIO_ACTIVE_SESSION_ID`
  - Implementation: `src/studio/storage.ts`
- Converts and scales quantities deterministically (no LLM conversion):
  - Displays **metric-only** amounts (g/kg, ml/l) and **count** for `n/a`
  - If conversion fails: shows `amount unavailable` (never shows original units)
  - Loader + cache: `src/studio/unitEquivalents.ts`
- Interpretation selection:
  - Ingredient list displays **English labels**; if an ingredient has options, the displayed label updates to the selected option label
  - Drawer shows the ancient term and the selectable options (confidence + placeholder badge)
  - Options are static data; the UI has no “add/edit option” controls
- Export:
  - **Copy-to-clipboard** only
  - Includes title/URN/scale/yield/time note, ingredients with scaled metric amounts, steps, and selected interpretations
  - Citations are included only for citable options (placeholders are excluded)

## Data files

- Seed DB (recipes/items): `public/data/seed.json`
  - Rose Perfume ingredient `ri-1` (skhoinos) is neutral (no pre-selected modern identification)
  - Rose petals (`ri-3`) uses a structured `count` quantity for deterministic scaling
- Unit equivalents (ancient + base units): `public/data/unit_equivalents.json`
  - Studio also merges a built-in modern conversion map for `lb`, `oz`, and `count` at runtime
- Studio recipe copy (curated intro/time/steps/disclaimers): `src/content/studioRecipes.ts`
- Studio identifications dataset (pre-authored options): `src/content/studioIdentifications.ts`

## Demo-specific notes (Rose Perfume)

- Yield basis is `ri-2` (carrier oil line) and is computed from structured quantities at the current scale.
- skhoinos has two demo options; both are marked placeholder and therefore:
  - display a visible placeholder badge in the UI
  - are excluded from the export citations list
