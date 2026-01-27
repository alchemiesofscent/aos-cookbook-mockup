# /docs Folder Audit Summary

## 1. File Inventory

| File | Size | Description |
|------|------|-------------|
| **docs/README.md** | 1.1K | Documentation index pointing to current specs, status, and engineering notes |
| **docs/prd/PRD_v3.0_StaticSite.md** | 7.5K | Current product requirements for React static site MVP |
| **docs/tech/Technical_Specification_v2.0_StaticSite.md** | 13K | Current schema definitions, entity types, storage & routing conventions |
| **docs/ux/UX_IA_Appendix_v2.0_StaticSite.md** | 7.8K | Current IA structure, page patterns, routing, annotation behavior |
| **docs/engineering/annotations.md** | 9.8K | Annotation feature behavior, data contracts, Combined View policy |
| **docs/engineering/recipe-ingest.md** | 5.5K | Recipe ingestion workflow with controlled vocabularies |
| **docs/engineering/versioning.md** | 3.0K | SemVer policy for dataset and site |
| **docs/engineering/release.md** | 1.9K | Release checklist and DOI minting guidance |
| **docs/engineering/gitpages.md** | 9.7K | GitHub Pages deployment checklist |
| **docs/engineering/studio-preview.md** | 2.9K | Studio preview notes |
| **docs/status/STATUS-SUMMARY.md** | 4.3K | Current project state snapshot |
| **docs/roadmap/ROADMAP.md** | 1.6K | Current roadmap and next milestones |
| **docs/archive/seed.json** | 14K | Legacy seed data structure (pre-v2.0 schema) |
| **docs/archive/prd/PRD-v2.2.md** | 21K | Superseded PRD (WordPress-based) |
| **docs/archive/tech/Technical-Spec-v1.md** | 44K | Superseded tech spec (WordPress CPT definitions) |
| **docs/archive/ux/UX-IA-Appendix.md** | 91K | Superseded UX appendix with extensive wireframes |
| **docs/archive/ux/UX-UI-Evaluation-Report.md** | 26K | Platform evaluation report |
| **docs/archive/engineering/cms-plan.md** | 16K | Archived CMS planning |
| **docs/archive/engineering/githubpages-implementation.md** | 8.1K | Archived GitHub Pages implementation notes |
| **docs/archive/roadmap/EVALUATION-AND-ROADMAP.md** | 40K | Historical evaluation and roadmap |

---

## 2. Data Model Elements

### 2.1 Entity Type Definitions (from Technical_Specification_v2.0)

```ts
export type DatabaseState = {
  meta: {
    schemaVersion: string;
    datasetVersion: string;
    generatedAt?: string;
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

### 2.2 Parent/Child Relationship Definitions

**Ancient Ingredient (Term) Relationships:**
```ts
relationships?: {
  parentTermId?: string;
  partOfTermId?: string;
  derivedFromTermId?: string;
  relatedTermIds?: string[];
};
```

**Ingredient Product Relationships:**
```ts
relationships?: {
  parentProductId?: string;
  derivedFromProductId?: string;
};
```

**Work Relationships:**
```ts
workType?: string;  // ancient_text, edition, translation, monograph, article, chapter, lexicon, thesis
authors?: string[];  // Person.id (optional)
```

**Person Categories:**
```ts
categories?: string[];  // at minimum: historical, team
```

### 2.3 The Interpretation Chain (Core Data Flow)

```
Recipe → Ancient Term → Identification → Ingredient Product → Material Source
```

- Recipes link **only** to Ancient Terms via `RecipeItem.ancientTermId`
- Identifications are first-class scholarly claims linking ancient terms to modern products/sources

---

## 3. Controlled Vocabularies & Enum Lists

### 3.1 RecipeItem.role (from recipe-ingest.md)
```
base | aromatic | carrier | adjuvant | colorant | preservative | other
```

### 3.2 RecipeAnnotation.type (from Technical_Specification_v2.0)
```
ingredient | process | tool | philological | editorial | general | cross-reference
```

### 3.3 Identification.confidence (from Technical_Specification_v2.0)
```
established | probable | speculative | unknown
```

### 3.4 MaterialSource.type (from Technical_Specification_v2.0)
```
plant | mineral | animal | other | string
```

### 3.5 Person.categories (from STATUS-SUMMARY.md)
```
historical | team
```

### 3.6 Work.workType (from Technical-Spec-v1.md archive)
```
ancient_text | edition | translation | commentary | monograph | article | chapter | lexicon | thesis
```

### 3.7 IngredientProduct.partUsed (from Technical-Spec-v1.md archive)
```
resin | flower | leaf | root | seed | wood | bark | fruit | whole | oil | other
```

### 3.8 Quantity.unit codes (from recipe-ingest.md)
```
# Modern mass
mg | g | kg | lb | oz

# Modern volume
ml | l | drop

# Ancient mass (normalized codes)
litra | mna | ouggia | drachma | obol

# Ancient volume (normalized codes)
xestes | kotyle | kyathos

# Count
piece | bunch | leaf | number

# Fallback
unspecified
```

### 3.9 Period Taxonomy (from Technical-Spec-v1.md archive)
| Term | Dates |
|------|-------|
| Bronze Age | 3300–1200 BCE |
| Iron Age | 1200–550 BCE |
| Archaic | 800–480 BCE |
| Classical | 480–323 BCE |
| Hellenistic | 323–31 BCE |
| Roman | 31 BCE – 476 CE |
| Late Antique | 250–750 CE |
| Medieval | 500–1500 CE |
| Early Modern | 1500–1800 CE |
| Modern | 1800–present |

### 3.10 Place Taxonomy (from Technical-Spec-v1.md archive)
```
Egypt, Mesopotamia, Levant, Anatolia, Greece, Rome/Italy, Arabia, India, North Africa, Persia
```

### 3.11 Language Taxonomy (from Technical-Spec-v1.md archive)
```
Greek, Latin, Egyptian (Hieroglyphic/Demotic/Coptic), Akkadian, Hebrew, Arabic, Other
```

### 3.12 Scent Family Taxonomy (from Technical-Spec-v1.md archive)
```
Scent Family
├─ Resinous
│   ├─ Balsamic
│   ├─ Amber
│   └─ Incense
├─ Floral
│   ├─ Rose
│   ├─ White floral (jasmine, lily)
│   ├─ Honeyed
│   └─ Powdery
├─ Woody
│   ├─ Dry woods (cedar, cypress)
│   ├─ Sandalwood
│   └─ Oud
├─ Herbal
│   ├─ Aromatic (rosemary, thyme)
│   ├─ Camphoraceous
│   └─ Medicinal
├─ Spicy
│   ├─ Warm (cinnamon, clove)
│   ├─ Peppery
│   └─ Anise
├─ Citrus
│   ├─ Bright (lemon, bergamot)
│   └─ Bitter (neroli, petitgrain)
├─ Green
│   ├─ Grassy
│   ├─ Leafy
│   └─ Herbaceous
├─ Animalic
│   ├─ Musky
│   ├─ Leathery
│   └─ Civet / Castoreum
└─ Earthy
    ├─ Mossy
    └─ Mineral
```

---

## 4. ID/Naming Conventions

### 4.1 ID Patterns (from seed.json)
| Entity | Pattern | Example |
|--------|---------|---------|
| Recipe | `r-{slug}` | `r-rose-perfume` |
| Ancient Ingredient | `i-{name}` | `i-rose`, `i-lemongrass` |
| Process | `pr-{name}` | `pr-boiling` |
| Work | `w-{slug}` | `w-materia-medica` |
| Person | `p-{name}` | `p-dioscorides` |
| Recipe Item | `ri-{n}` or `rp-{n}` | `ri-1`, `rp-1` |

### 4.2 URN Format (from Technical_Specification_v2.0)
```
urn:aos:{entity-type}:{slug}
```

**Examples:**
```
urn:aos:recipe:rose-perfume-dioscorides
urn:aos:ingredient:rhoda
urn:aos:process:hepsein
urn:aos:work:de-materia-medica
urn:aos:person:pedanius-dioscorides
```

### 4.3 Route String Format (from Technical_Specification_v2.0)
```
recipe:{recipeId}
ancient-term:{aiId}
identification:{identId}
ingredient-product:{ipId}
material-source:{msId}
work:{workId}
person:{personId}
workshop-tool:{toolId}
workshop-process:{processId}
```

---

## 5. Content That Should Migrate

### 5.1 Recipe Texts & Translations (from seed.json)

**Rose Perfume (Dioscorides) - Full Greek Text:**
```
43
1 ῥοδίνου σκευασία· σχοίνου λίτρας πέντε οὐγγίας ὀκτώ ἐλαίου λίτρας εἴκοσι οὐγγίας πέντε κόψας καὶ φυράσας ἐν ὕδατι ἕψε ἀνακινῶν, εἶτα ἀπηθήσας εἰς τὰς εἴκοσι λίτρας καὶ οὐγγίας πέντε τοῦ ἐλαίου βάλε ῥόδων ἀβρόχων ἀριθμῷ χιλίων τὰ πέταλα, καὶ τὰς χεῖρας μέλιτι χρίσας εὐώδει ἀνακίνει πλεονάκις ὑποθλίβων ἠρέμα...
```

**Citation Pattern:**
```
De materia medica 1.43.1–3 (Wellmann, pp. 42–43), trans. Coughlin
```

### 5.2 Term Glossary / Identifications (from seed.json)

| Greek Term | Transliteration | Modern ID | Definition |
|------------|----------------|-----------|------------|
| σχοῖνος | skhoinos | Lemongrass | A rush or reed. Most scholars identify this as lemongrass (Cymbopogon schoenanthus). |
| ἔλαιον | elaion | Olive Oil | Olive oil, typically specifically 'omphacium' or unripe olive oil in perfume contexts for its stability. |
| ῥόδα | rhoda | Rose | Roses. The specific species is debated, but Rosa gallica or Rosa damascena are primary candidates. |
| μέλι | meli | Honey | Honey. Used here likely to prevent adhesion or as a fixative agent. |
| ἕψειν | hepsein | Boiling | To boil or seethe. Indicates hot maceration. |

### 5.3 Master Entity Records (from seed.json)

**Master Ingredients:**
```json
{
  "id": "i-rose",
  "name": "Rose",
  "originalName": "ῥόδα",
  "transliteratedName": "rhoda",
  "slug": "rhoda",
  "urn": "urn:aos:ingredient:rhoda",
  "description": "Rosa gallica or Rosa centifolia petals."
}
```

**Master Works:**
```json
{
  "id": "w-materia-medica",
  "name": "De materia medica",
  "slug": "de-materia-medica",
  "urn": "urn:aos:work:de-materia-medica",
  "description": "Encyclopedic pharmacological treatise.",
  "author": "Pedanius Dioscorides",
  "authorId": "p-dioscorides",
  "date": "c. 50-70 CE",
  "language": "Ancient Greek",
  "place": "Roman Empire"
}
```

**Master People:**
```json
{
  "id": "p-dioscorides",
  "name": "Pedanius Dioscorides",
  "slug": "pedanius-dioscorides",
  "urn": "urn:aos:person:pedanius-dioscorides",
  "description": "Greek physician, pharmacologist, and botanist, employed in the Roman army. Author of De materia medica.",
  "role": "Physician",
  "place": "Anazarbus",
  "date": "1st Century CE"
}
```

### 5.4 Source/Citation Conventions

**Recipe Attribution Pattern:**
```json
{
  "attribution": {
    "authorPersonId": "p-dioscorides",
    "sourceWorkId": "w-materia-medica",
    "citation": "1.43.1–3",
    "editionNote": "Wellmann 42–43",
    "translator": "Coughlin"
  }
}
```

**Identification Provenance Pattern:**
```json
{
  "workId": "w-materia-medica",
  "locator": "pp. 45-47",
  "confidence": "established"
}
```

---

## 6. Schema Artifacts

### 6.1 TypeScript Types (from Technical_Specification_v2.0)

**Recipe Type:**
```ts
export type Recipe = {
  id: string;
  urn: string;
  slug: string;
  title: string;

  attribution: {
    authorPersonId?: string;
    sourceWorkId?: string;
    citation?: string;
    editionNote?: string;
    translator?: string;
  };

  text: {
    greek?: string;
    translation?: string;
    combinedSegments?: Array<{
      id: string;
      kind: 'plain' | 'annotation';
      text: string;
      annotationId?: string;
    }>;
  };

  items: RecipeItem[];
  annotations?: RecipeAnnotation[];

  related?: {
    variants?: string[];
    experiments?: string[];
  };

  tags?: {
    period?: string[];
    region?: string[];
  };

  placeholder?: boolean;
};
```

**RecipeItem Type:**
```ts
export type RecipeItem = {
  id: string;
  type: 'ingredient' | 'tool' | 'process' | 'note';
  ancientTermId?: string;
  toolId?: string;
  processId?: string;
  displayTerm?: string;
  originalTerm?: string;
  originalAmount?: string;
  amount?: string;
  quantities?: Array<{ value: number; unit: string }>;
  role?: string;
  notes?: string;
};
```

**RecipeAnnotation Type:**
```ts
export type RecipeAnnotation = {
  id: string;
  type: 'ingredient' | 'tool' | 'process' | 'philological' | 'editorial' | 'general' | 'cross-reference';
  heading?: string;
  body?: string;
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

**AncientIngredient Type:**
```ts
export type AncientIngredient = {
  id: string;
  urn: string;
  slug: string;
  term: string;
  language?: 'grc' | 'lat' | string;
  gloss?: string;
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

**Identification Type:**
```ts
export type Identification = {
  id: string;
  urn: string;
  ancientTermId: string;
  ingredientProductId?: string;
  materialSourceId?: string;
  workId: string;
  locator?: string;
  confidence?: 'established' | 'probable' | 'speculative' | 'unknown';
  notes?: string;
  placeholder?: boolean;
};
```

**IngredientProduct Type:**
```ts
export type IngredientProduct = {
  id: string;
  urn: string;
  slug: string;
  name: string;
  description?: string;
  derivedFromSourceId?: string;
  partUsed?: string;
  scentProfile?: {
    family?: string;
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

**MaterialSource Type:**
```ts
export type MaterialSource = {
  id: string;
  urn: string;
  slug: string;
  name: string;
  type?: 'plant' | 'mineral' | 'animal' | 'other' | string;
  description?: string;
  nativeRange?: string[];
  externalLinks?: Array<{ label: string; url: string }>;
  placeholder?: boolean;
};
```

**Work Type:**
```ts
export type Work = {
  id: string;
  urn: string;
  slug: string;
  title: string;
  workType?: string;
  authors?: string[];
  date?: string;
  language?: string;
  citation?: string;
  bibliographicNote?: string;
  placeholder?: boolean;
};
```

**Person Type:**
```ts
export type Person = {
  id: string;
  urn: string;
  slug: string;
  displayName: string;
  sortName?: string;
  categories?: string[];
  bio?: string;
  roles?: string[];
  externalIds?: {
    orcid?: string;
    viaf?: string;
    wikidata?: string;
  };
  placeholder?: boolean;
};
```

**Tool and Process Types:**
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

### 6.2 JSON Schema (Version Metadata from Technical_Specification_v2.0)

```json
{
  "datasetVersion": "0.1.0",
  "releasedAt": "2026-01-18",
  "schemaVersion": "v2"
}
```

### 6.3 Seed Data Structure (from archive/seed.json)

```json
{
  "recipes": [...],
  "masterIngredients": [...],
  "masterTools": [...],
  "masterProcesses": [...],
  "masterWorks": [...],
  "masterPeople": [...]
}
```

---

## 7. Key Architectural Decisions

1. **Static Site First**: React/Vite static site deployed to GitHub Pages; no WordPress/CMS for MVP
2. **Interpretation Chain**: Recipes link only to Ancient Terms; resolution to modern products happens through Identifications
3. **Pinned Resolution**: Annotations use explicit IDs, not string matching
4. **Placeholder Discipline**: Demo data stamped with `placeholder: true` and visibly labeled
5. **Stable Identifiers**: `id` and `urn:*` never change after publication
6. **SemVer for Dataset**: Dataset version follows semantic versioning; DOIs minted for major/minor releases

---

## 8. Archive Contents (Superseded)

The `docs/archive/` folder contains superseded documentation from the WordPress-based platform direction:

- **Technical-Spec-v1.md**: Full WordPress CPT definitions, ACF field groups, CSV import schemas
- **UX-IA-Appendix.md**: Extensive wireframes (91K) with color palettes, typography, interaction patterns
- **PRD-v2.2.md**: WordPress-era PRD with ACF/CPT architecture
- **seed.json**: Pre-v2.0 seed data structure

These contain valuable reference material (especially taxonomies and field definitions) but are not the current source of truth.

---

*Generated: 2026-01-27*
