# Status Summary (Current State)

This file is a concise snapshot of where the project stands and what has been decided so far.

## Platform Direction

- **React static site is the chosen platform** (published corpus; single maintainer).
- WordPress is not planned for MVP. A headless CMS is optional later only if editorial needs change.

## Data & Architecture

- Canonical dataset seed lives at `public/data/seed.json` and is loaded/merged into localStorage via `src/storage.ts`.
- No in-app editor in the static site; editing is via JSON files (`public/data/seed.json`) and tooling/scripts. Future CMS is out of scope.
- The project uses stable `id` fields plus persistent `urn:*` identifiers for citability.
- The interpretation chain exists as first-class collections:
  - `Ancient Term` (`ancientIngredients`) → `Identification` (`identifications`) → `Ingredient Product` (`ingredientProducts`) → `Material Source` (`materialSources`)
- Recipes link **only** to Ancient Terms via `RecipeItem.ancientTermId` (pins provide bridge during transition).

## Routing (Current Conventions)

- Canonical routes are string routes of the form:
  - `recipe:${recipeId}`
  - `ancient-term:${aiId}`
  - `identification:${identId}`
  - `ingredient-product:${ipId}`
  - `material-source:${msId}`
  - `work:${workId}`
  - `person:${personId}`
  - `workshop-tool:${toolId}`, `workshop-process:${processId}`, etc.
- Legacy routes exist for compatibility (e.g. `recipe_rose`, `work_materia_medica`, `person_dioscorides`) but are deprecated and not used for new navigation.

## People & Works

- There is a **single** people dataset: `db.masterPeople`.
- `masterPeople[].categories` is used to distinguish:
  - `"historical"` vs `"team"` (at minimum).
- Team listing is data-driven:
  - Team page filters `categories` including `"team"`.
- People listing is data-driven:
  - People page filters out `"team"` (or can be grouped later).
- Works are data-driven from `db.masterWorks`.

## Recipe Reading UX

- Recipe page supports three functioning modes:
  - **Annotated** (default): uses `text.combinedSegments` if present; falls back to translation with notice if not.
  - **Translation**
  - **Greek**
- Ingredient links on recipe pages resolve via `ancientTermId` (or pinned maps) and do not default to a single term.
- Annotation panel “View ancient term” resolves via pinned annotation mapping (no fragile string matching).

## Workshop UX

- Tools and Processes index pages are data-driven from:
  - `db.masterTools`
  - `db.masterProcesses`
- “Materials” section uses the interpretation-chain entities and marks demo data clearly with badges.

## Seeds / Demo Content

- `public/data/seed.json` currently includes:
  - Rose + Lily recipes as real content, plus placeholder Megalleion + Cinnamon Perfume recipes
  - Demo/placeholder terms/products/sources/identifications, clearly stamped with `placeholder: true`.
- Candidate labels were reformatted from:
  - `"Candidate A — … (placeholder)"`
  - to noun-first: `"…, … (Candidate A)"` style.

## Linking UX Improvements

- “RECIPES*” sections now render **clickable cards** (not bullet rows), showing:
  - `Title (Author / Attribution) →`

## Release / Versioning Docs

- Added:
  - `VERSIONING.md` (SemVer rules; 1.0 criteria; DOI policy)
  - `RELEASE.md` (release checklist; DOI minting guidance)
  - `CHANGELOG.md` (starter changelog)
- Decision: start versioning now; mint DOIs for major/minor releases (not patches).

## Open Items / Next Steps

- Add **footer versioning** (Dataset version + Site version) and a lightweight version metadata file (e.g. `public/data/version.json`), then display in footer for citability.
- Strengthen FAIR/citability deliverables:
  - consistent “Cite this” block per entity
  - JSON-LD exports per entity type
  - dataset export artifact(s) + version metadata
- Add scent profiles to `IngredientProduct` and enable filtering by scent families/notes (future).
- Continue hardening link invariants (no dangling IDs; stable IDs; validation script).
