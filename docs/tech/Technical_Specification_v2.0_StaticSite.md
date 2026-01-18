# Technical Specification v2.0

Project: Alchemies of Scent — The Laboratory
Version: 2.0
Date: 16 January 2026
Companion to: PRD v3.0, UX/IA Appendix v2.0

Document purpose: Builder’s reference for the React static site. It defines dataset layout, entity schemas, storage and routing conventions, validation, and export requirements.

## 1. Platform

The MVP is a React single-page app built as a static site and deployed to a static host. There is no server-side database or CMS in MVP.

## 2. Canonical data locations

- public/data/seed.json is the canonical, versioned dataset seed.
- public/data/version.json is lightweight version metadata for footer display and exports.
- src/storage.ts loads seed.json, merges it into localStorage, and persists user edits.

## 3. Dataset identifiers

### 3.1 id

Each entity has a stable id field used for internal linking. ids must be globally unique within their collection. ids do not change after publication.
Cross-collection collisions are permitted; route prefix disambiguates.

### 3.2 urn

Each public entity has a persistent urn field (urn:*) used for citation and long-term stability. urns do not change after publication.

### 3.3 Naming and disambiguation (minimal contract)

- Entities have `id` and `urn` (and `slug` where used for routes/URLs).
- Display names/titles must not include provisional or disambiguation text.
- Any disambiguation must use secondary metadata (for example disambiguationLabel, notes, status) and be shown as a secondary line or badge, never in the primary name/title.
- Slug/urn normalisation rules are out of scope for MVP; only stability is required (never auto-regenerate published slugs/urns).

## 4. DatabaseState serialisation

seed.json serialises a single DatabaseState object.

### 4.1 Top-level shape

TypeScript sketch:

```ts
export type DatabaseState = {
  meta: {
    schemaVersion: string;           // for migrations
    datasetVersion: string;          // displayed in footer and exports
    generatedAt?: string;            // ISO
  };

  recipes: Recipe[];

  ancientIngredients: AncientIngredient[];
  identifications: Identification[];
  ingredientProducts: IngredientProduct[];
  materialSources: MaterialSource[];

  masterPeople: Person[];
  masterWorks: Work[];

  masterTools: Tool[];
  masterProcesses: Process[];
};
```

### 4.2 Placeholder and demo data

Any record may include:

```ts
placeholder?: boolean;
sourceKind?: string;               // optional provenance hint (policy-defined later)
disambiguationLabel?: string;      // optional secondary label (never the primary title/name)
```

If `placeholder === true`, the UI must surface a badge and any exports should retain the flag. (If present, `sourceKind` should be retained too.)

## 5. Core entities

This section defines the minimum fields needed for MVP. Collections may include additional fields, but the fields below are considered required for stable linking and citability.

### 5.1 Recipe

Recipe is a witness-level object. It links to ancient terms only.

```ts
export type Recipe = {
  id: string;
  urn: string;
  slug: string;
  title: string;

  attribution: {
    authorPersonId?: string;        // links to masterPeople
    sourceWorkId?: string;          // links to masterWorks
    citation?: string;              // e.g. 1.43.1–3
    editionNote?: string;           // e.g. Wellmann 42–43
    translator?: string;
  };

  text: {
    greek?: string;                 // full text (optional for placeholder)
    translation?: string;

    // Annotated mode is driven by combinedSegments.
    // If absent, the UI falls back to translation with a notice.
    combinedSegments?: Array<{
      id: string;
      kind: 'plain' | 'annotation';
      text: string;                 // the English text shown in annotated mode
      annotationId?: string;        // points into recipe.annotations
    }>;
  };

  items: RecipeItem[];              // ingredients, tools, processes, notes

  annotations?: RecipeAnnotation[]; // panel cards and pinned routing

  related?: {
    variants?: string[];            // recipe ids
    experiments?: string[];         // ids if present in future
  };

  tags?: {
    period?: string[];
    region?: string[];
  };

  placeholder?: boolean;
};

export type RecipeItem = {
  id: string;
  type: 'ingredient' | 'tool' | 'process' | 'note';

  // For ingredients, this is the only required link.
  ancientTermId?: string;           // id in ancientIngredients

  // Optional direct links to workshop items
  toolId?: string;                  // id in masterTools
  processId?: string;               // id in masterProcesses

  // Display
  displayTerm?: string;             // human label for UI
  originalTerm?: string;            // Greek or other source term
  originalAmount?: string;
  amount?: string;

  // Parsed quantities (optional)
  quantities?: Array<{ value: number; unit: string }>;

  role?: string;                    // if explicitly stated
  notes?: string;
};

export type RecipeAnnotation = {
  id: string;
  type: 'ingredient' | 'tool' | 'process' | 'philological' | 'editorial' | 'general' | 'cross-reference';

  // What the reader clicks in Annotated mode is the English segment.
  // The card heading should be the source-language label when available.
  heading?: string;
  body?: string;

  // Pinned resolution targets (no string matching).
  pinned?: {
    ancientTermId?: string;
    identificationId?: string;
    ingredientProductId?: string;
    materialSourceId?: string;
    workId?: string;
    personId?: string;
    toolId?: string;
    processId?: string;
  };
};
```

Required invariants:

- RecipeItem.ancientTermId is required when type === 'ingredient' and may be omitted only for non-ingredient items.
- Recipes do not link directly to Ingredient Product or Material Source.
- Annotated mode uses text.combinedSegments when present (otherwise fall back to Translation with notice).

### 5.2 Ancient Term (ancientIngredients)

```ts
export type AncientIngredient = {
  id: string;
  urn: string;
  slug: string;

  term: string;                     // source-language form (normalised where applicable)
  language?: 'grc' | 'lat' | string;

  gloss?: string;                   // short English label
  description?: string;

  relationships?: {
    parentTermId?: string;
    partOfTermId?: string;
    derivedFromTermId?: string;
    relatedTermIds?: string[];
  };

  placeholder?: boolean;
};
```

### 5.3 Identification (identifications)

Identification is a first-class scholarly claim that links an ancient term to a modern product and/or material source, with provenance.

```ts
export type Identification = {
  id: string;
  urn: string;

  ancientTermId: string;            // AncientIngredient.id
  ingredientProductId?: string;     // IngredientProduct.id
  materialSourceId?: string;        // MaterialSource.id

  workId: string;                   // Work.id
  locator?: string;                 // page, line, section, figure

  confidence?: 'established' | 'probable' | 'speculative' | 'unknown';
  notes?: string;

  placeholder?: boolean;
};
```

### 5.4 Ingredient Product (ingredientProducts)

Scent lives here.

```ts
export type IngredientProduct = {
  id: string;
  urn: string;
  slug: string;

  name: string;
  description?: string;

  derivedFromSourceId?: string;     // MaterialSource.id (primary)
  partUsed?: string;                // resin, flower, leaf, root, etc.

  scentProfile?: {
    family?: string;                // e.g. Resinous > Balsamic
    primaryNotes?: string[];
    secondaryNotes?: string[];
    evolution?: string;
    comparisons?: string;
  };

  relationships?: {
    parentProductId?: string;
    derivedFromProductId?: string;
  };

  placeholder?: boolean;
};
```

### 5.5 Material Source (materialSources)

```ts
export type MaterialSource = {
  id: string;
  urn: string;
  slug: string;

  name: string;                     // scientific or conventional
  type?: 'plant' | 'mineral' | 'animal' | 'other' | string;

  description?: string;
  nativeRange?: string[];

  externalLinks?: Array<{ label: string; url: string }>;

  placeholder?: boolean;
};
```

### 5.6 Work (masterWorks)

```ts
export type Work = {
  id: string;
  urn: string;
  slug: string;

  title: string;
  workType?: string;                // ancient_text, edition, translation, monograph, article, chapter, lexicon, thesis

  authors?: string[];               // Person.id (optional)

  date?: string;
  language?: string;

  citation?: string;                // short display citation
  bibliographicNote?: string;

  placeholder?: boolean;
};
```

### 5.7 Person (masterPeople)

There is one people dataset. Display is driven by categories.

```ts
export type Person = {
  id: string;
  urn: string;
  slug: string;

  displayName: string;
  sortName?: string;

  categories?: string[];            // at minimum: historical, team

  bio?: string;
  roles?: string[];                 // used for team display

  externalIds?: {
    orcid?: string;
    viaf?: string;
    wikidata?: string;
  };

  placeholder?: boolean;
};
```

### 5.8 Tool and Process (masterTools, masterProcesses)

```ts
export type Tool = {
  id: string;
  urn: string;
  slug: string;
  name: string;
  description?: string;
  placeholder?: boolean;
};

export type Process = {
  id: string;
  urn: string;
  slug: string;
  name: string;
  description?: string;
  placeholder?: boolean;
};
```

## 6. Storage and merge behaviour

### 6.1 localStorage keys

Recommended keys:

- aos:db for the merged DatabaseState
- aos:db:meta for local metadata (for example firstRunAt)

### 6.2 Merge policy (seed → local)

- Load seed.json.
- Load local db if present.
- Merge collections by id.
- If a record exists in both, local wins field-by-field.
- Never delete a seed record automatically. Deletion, if supported, is a local tombstone that does not mutate the seed.

### 6.3 Schema migrations

- DatabaseState.meta.schemaVersion enables migrations.
- src/storage.ts may apply deterministic migrations on load.
- Migrations must be id-safe and urn-safe.

## 7. Routing

Canonical routes are route strings.

Examples:

- recipe:r-example
- ancient-term:ai-example
- identification:id-example
- ingredient-product:ip-example
- material-source:ms-example
- work:w-example
- person:p-example
- workshop-tool:t-example
- workshop-process:pr-example

Legacy routes may exist (for example recipe_rose) but must not be generated by new navigation.

Implementation guidance:

- Define a Route union and parse helpers.
- Serialise the current route into the browser URL (hash or query parameter) to support deep links and refresh.

## 8. Recipe annotation resolution

Do not link annotations by string matching. Annotated mode uses combinedSegments, where each annotation segment references a recipe annotation by id. Each recipe annotation can pin to target entity ids (for example ancientTermId).

This approach supports:

- repeated terms without occurrence bookkeeping
- stable resolution when copy changes
- click targets on English segments while showing Greek (or other source-language) headings in cards

### 8.1 Pins during transition

Target state: pinned resolution data lives in the dataset (for example `seed.pins.*` in `public/data/seed.json`) so it is exportable and citable.

The static-site MVP stores pins in `public/data/seed.json` (no code-level pins map).

## 9. Version metadata

public/data/version.json is a small, stable file for display and export labelling.

Recommended shape:

```json
{
  "datasetVersion": "0.1.0",
  "releasedAt": "2026-01-18",
  "schemaVersion": "v2"
}
```

The footer displays datasetVersion.

## 10. Exports

### 10.1 JSON-LD

Provide JSON-LD exports for, at minimum:

- recipe
- ancient term
- identification
- ingredient product
- material source
- work
- person

Export builders live in src/exports/jsonld.ts and should:

- include urn and canonical URL
- include datasetVersion
- prefer stable ids for internal references
- retain placeholder flags

### 10.2 Dataset export

Provide at least one downloadable dataset artefact:

- the full seed.json
- optionally per-collection exports (recipes.json, ancientIngredients.json, etc.)

Exports should be version-labelled and accompanied by version.json.

## 11. Validation

A validation step must run before release (and ideally in CI). It should check:

- uniqueness of ids per collection
- presence and uniqueness of urn per public collection
- referential integrity across ids
- recipe invariants (ingredient items have ancientTermId)
- no navigation to deprecated legacy routes from new UI

Validation output should be deterministic and fail the build on error.

## 12. Deployment notes

For static hosting:

- build output must reference assets relatively (respect base path if using GitHub Pages)
- seed.json and version.json must be copied into the build output
- fetches for /data/seed.json should use relative URLs (for example import.meta.env.BASE_URL)
