---
name: remedy-ingest
description: Ingest a new remedy/recipe into this repo's `public/data/seed.json` by converting source metadata + original text + English translation into a valid `DatabaseState` JSON object, following `docs/engineering/recipe-ingest.md` (combinedSegments + annotations map, no runtime LLM calls).
---

# Remedy / Recipe ingest (AOS Cookbook mockup)

Use this skill when the user wants to add (or update) a remedy/recipe in this repo’s wireframe data seed.

Primary reference: `docs/engineering/recipe-ingest.md` (load it and follow it; do not re-invent the schema).

## Inputs to collect (ask for these explicitly)

1) Source metadata
- `title`
- `author` (ancient or attributed)
- `citation` (work + locator)
- `time_period`, `region`
- `edition` (short ref + pages)
- `translator`
- optional `notes`

2) Text
- `original_text`
- `translation_text`

3) Optional editorial decisions
- curated highlight list (terms/occurrences to annotate)
- any exceptions to the default Combined view policy

If anything is missing, pause and ask; do not guess citations, attributions, or translations.

## Workflow (MVP: parity-first)

### 1) Load the spec and inspect current data
- Read `docs/engineering/recipe-ingest.md` to confirm current rules and controlled vocab.
- Open `public/data/seed.json` to reuse existing ID/slug conventions and avoid collisions.
- Use `src/types.ts` as the source of truth for field names (`DatabaseState`, `Recipe`, `RecipeItem`, etc.).

### 2) Decide what master entities you need
For each entity referenced by the recipe, either:
- Reuse an existing master entity (preferred), or
- Add a new one in the appropriate top-level array:
  - `masterIngredients` (`id` prefix `i-`)
  - `masterTools` (`id` prefix `t-`)
  - `masterProcesses` (`id` prefix `pr-`)
  - `masterWorks` (`id` prefix `w-`)
  - `masterPeople` (`id` prefix `p-`)

Keep `id`, `slug`, and `urn` stable, kebab-case, and consistent with `public/data/seed.json`.

### 3) Build the `Recipe`

#### Required identifiers
- `id`: `r-…`
- `slug`: kebab-case, human-readable
- `urn`: `urn:aos:recipe:<slug>`

#### Metadata mapping (this repo’s `Recipe.metadata`)
Map the pasted source metadata into the existing fields as best as possible:
- `title` → `metadata.title`
- `author` → `metadata.author` (or `masterPeople` + `masterWorks.authorId` where possible)
- `citation` / `edition` / `translator` → prefer `metadata.attribution` (and/or `text.notes` if it won’t fit cleanly)
- `time_period` → `metadata.date`
- `region` → `metadata.place`
- choose a `metadata.language` that matches the original text (e.g. “Ancient Greek”, “Latin”)
- ensure `metadata.sourceWorkId` points to an entry in `masterWorks` (add one if needed)

#### Text fields
- `text.original` = `original_text`
- `text.translation` = `translation_text`
- `text.notes` = editorial notes / edition details / translator notes (keep short)

#### Combined view (`text.combinedSegments`)
Follow the default policy from `docs/engineering/recipe-ingest.md`:
- Ingredients inline in original language/script.
- Tools & processes inline in English.
- Curate highlights: only annotate selected terms/occurrences.

Segments must be pre-split, and any segment with `{ type: "annotation", id: "…" }` must have a corresponding entry in `recipe.annotations`.

#### Annotations (`recipe.annotations`)
Store annotations as a map keyed by annotation id:
- `term`: visible label (may be English for tool/process)
- `transliteration` / `lemma` when useful for Greek
- `definition`: short plain text (optional)
- `annotationType`: use the vocabulary in `docs/engineering/recipe-ingest.md`
- `links`: optional `[{ label, route }]` (route must be a string)

Annotation id reuse across multiple segments is allowed; missing ids are a hard error in dev.

#### Items (`recipe.items`)
Create `RecipeItem` entries for each ingredient/tool/process you want represented in the “workshop” UI:
- Set `type` to `ingredient | tool | process`.
- Use `masterId` when you can match a master entity; otherwise `null` and consider `needsReview` in quantities.
- Keep `originalTerm` in original script; use `displayTerm` for English display.
- Normalize units in `quantities[].unit`; put raw ancient unit forms in `quantities[].unitRaw` (see spec).
- Set `role` for ingredients using the controlled vocab from `docs/engineering/recipe-ingest.md`.

### 4) Produce output as a valid `DatabaseState`
Return a single JSON object with *all* required top-level keys:
- `recipes`, `masterIngredients`, `masterTools`, `masterProcesses`, `masterWorks`, `masterPeople`

Even if you only add one recipe, include all arrays (use empty arrays when none).

### 5) Merge into the seed
- Merge the new `DatabaseState` into `public/data/seed.json` (single-seed approach).
- Preserve valid JSON and keep formatting consistent with the file.

## Validation

Minimum checks before finishing:
- Every annotated segment id exists in `recipe.annotations`.
- Tools/processes are English in Combined view unless explicitly overridden.
- `Quantity.unit` uses normalized codes; raw Greek forms only appear in `unitRaw`.

Optional fast local check:
- `node -e "JSON.parse(require('fs').readFileSync('public/data/seed.json','utf8')); console.log('seed.json ok')"`

