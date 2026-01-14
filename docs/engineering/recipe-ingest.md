# recipe-ingest.md (agent)

## Purpose
Convert one recipe (source metadata + original text + English translation) into JSON suitable for the GitHub Pages React wireframe, using the MVP “parity-first” strategy:
- **Combined view is pre-segmented** (`recipe.text.combinedSegments`).
- **Annotations are stored directly** on the recipe (`recipe.annotations` map).
- No runtime LLM/API calls; any “LLM assistance” happens outside the app with copy/paste + manual revision.

Target output: a **valid `DatabaseState` object** (same top-level shape as `src/types.ts`) containing the new/updated recipe plus any new master entities you introduced.

## What To Paste (exactly)

### 1) Source metadata
- `title`
- `author` (ancient or attributed)
- `citation` (work + locator, e.g. `De materia medica 1.43.1–3`)
- `time_period` (free text)
- `region` (free text)
- `edition` (short ref + pages)
- `translator` (name)
- optional `notes` (free text)

### 2) Text
- `original_text` (as edited; keep line numbers only if you want them displayed)
- `translation_text` (English)

### 3) Optional editorial decisions (only if needed)
- curated highlight list (terms/occurrences you want to annotate)
- any exceptions to the default Combined view policy

## Default Combined View Policy (MVP)
- **Ingredients:** rendered inline in the original language/script (Greek/Latin/Egyptian/etc.).
- **Tools & processes:** rendered inline in English (readability).
- **Highlights are curated**: only selected terms/occurrences are annotated; everything else is plain text.

## Controlled Vocabularies

### `RecipeItem.role` (ingredients)
`base | aromatic | carrier | adjuvant | colorant | preservative | other`

### `AnnotationRecord.annotationType`
`ingredient | process | tool | philological | editorial | cross-reference | general`

## Units (normalization + raw forms)

### Key rule
- `quantities[].unit` is a normalized **unit code** (may include ancient units, but never raw Greek forms).
- Raw Greek unit forms go in `quantities[].unitRaw`.

### `Quantity.unit` recommended codes
Use these when safe; otherwise use `"unspecified"` and set `needsReview: true`.
- Modern mass: `mg | g | kg | lb | oz`
- Modern volume: `ml | l | drop`
- Ancient mass (normalized codes): `litra | mna | ouggia | drachma | obol`
- Ancient volume (normalized codes): `xestes | kotyle | kyathos`
- Count: `piece | bunch | leaf | number`
- Fallback: `unspecified`

### `Quantity.unitRaw`
Always include when an ancient unit appears in the original text:
```json
{ "term": "λίτρα", "transliteration": "litra", "kind": "mass" }
```

## Output Shape (must match `DatabaseState` + recipe extensions)

Return a **single JSON object** with these top-level keys (all required, use empty arrays if none):
- `recipes`: array of `Recipe`
- `masterIngredients`: array of `MasterEntity`
- `masterTools`: array of `MasterEntity`
- `masterProcesses`: array of `MasterEntity`
- `masterWorks`: array of `MasterEntity`
- `masterPeople`: array of `MasterEntity`

### `Recipe` (required fields)
- `id`, `slug`, `urn`
- `metadata` (existing shape; map the pasted source metadata into these fields as best as possible)
- `text.original`, `text.translation`, `text.notes`
- `text.combinedSegments`: ordered array for Combined view, each element either:
  - `{ "text": "..." }`
  - `{ "text": "Boiling", "type": "annotation", "id": "ann_boiling_1" }`
- `annotations`: object map keyed by annotation id, each record:
  - `term` (the visible label; **may be English** for tool/process highlights)
  - `transliteration` (optional; use for Greek lemma if you want to preserve it)
  - `definition` (optional; short plain text)
  - `annotationType`
  - `links` (optional array of `{ label, route }`; omit or use `[]` for none)
- `items`: array of `RecipeItem` aligned to `src/types.ts` naming:
  - `id`
  - `type`: `ingredient | tool | process`
  - `masterId`: id of the matching master entity (or `null` if unknown)
  - `originalTerm` (original script; required for ingredients)
  - `transliteration` (optional)
  - `displayTerm` (English label for tools/processes; translated label for ingredients if desired)
  - `amount` (human-readable display string)
  - `originalAmount` (original measurement phrase)
  - `quantities`: array of `{ value, unit, isEstimate?, unitRaw?, needsReview? }`
  - `role` (ingredients only; use controlled vocab)

## Annotation ID Rules (MVP)
- Allowed: the same annotation id appears multiple times in `combinedSegments` (same notes card).
- Forbidden (hard error in dev): a segment annotation `id` missing from `recipe.annotations`.
- Recommended (warning in dev): if an annotation id is used on segment text that differs sharply from `annotations[id].term`, warn (likely a collision/mistake).

Because JSON objects can’t represent duplicate keys reliably, if you generate annotations as an array first, convert to a map with a duplicate check before finalizing the seed:
```ts
// Use `annotationsArrayToMap` from `src/invariants.ts` (throws on duplicate ids).
const annotationsMap = annotationsArrayToMap(annotationsArray);
```

## Validation Checklist (must pass)
- Every annotated segment id exists in `recipe.annotations` (hard error in dev).
- (Optional) Every `links[].route` is a string (hard error in dev if enabled).
- Tools/processes remain English in Combined view (unless you explicitly override).
- `Quantity.unit` uses normalized codes; raw Greek forms are only in `unitRaw`.

## Output Placement (MVP)
- Merge the resulting `DatabaseState` into `public/data/seed.json` (single-seed approach for GitHub Pages MVP).
