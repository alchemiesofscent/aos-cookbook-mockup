# Product Requirements Document v3.0

Project: Alchemies of Scent — The Laboratory
Version: 3.0
Date: 16 January 2026
Target: MVP release in Q1 2026
Platform: React static site (published corpus; single maintainer)

Document purpose: Canonical scope and commitments. For implementation details, see Technical Specification v2.0. For interface design and behaviour, see UX/IA Appendix v2.0.

## 1. Vision

Ancient perfume recipes are compressed artefacts. A few lines of Greek can encode ecological knowledge, technical expertise, sensory experience, economic networks, and cultural meaning.

The Laboratory decompresses them. It makes the interpretive craft visible by letting a reader move from a word in the recipe text to a philological term record, to competing scholarly identifications, to modern materials with sensory descriptions, and (where available) to experimental work.

## 2. Product in one sentence

A citable, public research corpus that links ancient perfume recipe texts to an explicit interpretation chain (ancient term → scholarly identification → modern product → material source), designed to preserve ambiguity while making interpretive moves inspectable.

## 3. Platform direction

The MVP is a React static site. It is a published corpus with one maintainer. There is no WordPress or server-side CMS in MVP. A headless CMS remains optional later only if editorial needs change.

## 4. Core data principles

1. Stable identifiers: every entity has a stable id and a persistent urn:* identifier suitable for citation.
2. Ambiguity is preserved: an ancient term may have multiple identifications, each a first-class scholarly object.
3. Recipes do not collapse ambiguity: recipes link only to ancient terms; interpretive resolution happens through identifications.
4. Provenance is mandatory for scholarly claims: identifications cite works with locators.
5. Published data is reproducible: the canonical dataset is versioned, exportable, and validates against a documented schema.

## 5. Data and architecture (MVP)

Canonical dataset seed

- Canonical dataset lives at public/data/seed.json.
- On first run, seed.json is loaded and merged into localStorage (via src/storage.ts). Local edits are stored in localStorage only.

Entity collections

The interpretation chain exists as first-class collections in the dataset:

- Ancient Term (ancientIngredients)
- Identification (identifications)
- Ingredient Product (ingredientProducts)
- Material Source (materialSources)

Recipes link only to Ancient Terms via RecipeItem.ancientTermId. During the transition from legacy annotations, pinned maps may bridge older annotation anchors to explicit ids.

## 6. Routing (current conventions)

Canonical routes are string routes of the form:

- recipe:{recipeId}
- ancient-term:{aiId}
- identification:{identId}
- ingredient-product:{ipId}
- material-source:{msId}
- work:{workId}
- person:{personId}
- workshop-tool:{toolId}
- workshop-process:{processId}

Legacy routes exist for compatibility (for example recipe_rose, work_materia_medica, person_dioscorides) but are deprecated and not used for new navigation.

## 7. People and works

People

- There is a single people dataset: db.masterPeople.
- masterPeople[].categories distinguishes at minimum historical and team.
- Team page is data-driven by filtering categories including team.
- People page is data-driven by filtering out team (or grouping later).

Works

- Works are data-driven from db.masterWorks.

## 8. Recipe reading experience

Recipe pages support three modes:

- Annotated (default): uses text.combinedSegments when present; otherwise falls back to Translation with a notice.
- Translation
- Greek

Ingredient links on recipe pages resolve via ancientTermId (or pinned maps) and do not default to a single modern identification. The annotation panel resolves View ancient term via pinned annotation mapping and does not rely on fragile string matching.

## 9. Workshop experience

- Tools and Processes index pages are data-driven from db.masterTools and db.masterProcesses.
- The Materials section uses interpretation-chain entities and marks demo/placeholder data clearly.

## 10. Seeds and demo content policy

The seed may include both real and placeholder/demo content. Placeholder entities must be stamped with placeholder: true and surfaced in the UI with a badge.

Placeholder discipline (to avoid “accidental scholarship”)

Placeholder entities must include placeholder: true and be visibly labelled in the UI (badge). Exports must retain placeholder (and any optional sourceKind) so placeholder content is mechanically separable from scholarly claims.

Naming discipline

- Primary display names must be canonical and stable; do not embed provisional/disambiguation strings in names/titles.

## 11. Linking and navigation conventions

Recipe-related sections render as consistent, clickable items (cards or equivalent) with clear navigation affordance.

## 12. Admin console (MVP)

Admin Console is an in-app editor for localStorage-backed editing. It must remain readable in night-mode, including explicit text colours in admin layout.

## 13. Versioning and releases

Versioning starts now.

- Site version follows SemVer (see VERSIONING.md).
- Dataset version is tracked separately and displayed alongside the site version.
- DOI minting policy: mint DOIs for major and minor releases, not patches.

MVP adds a lightweight version metadata file (public/data/version.json) and displays Site version plus Dataset version in the footer for citability.

## 14. MVP scope

MVP includes:

- Recipe reading with the three modes above
- Annotation panel driven by explicit ids or pinned mappings
- Navigation through the interpretation chain
- People and works pages driven from db
- Workshop tools and processes pages driven from db
- Cite this blocks for key entities (at minimum: recipe, ancient term, identification, ingredient product, material source, work, person)
- JSON-LD export for the same entity set
- Dataset export artefact(s) plus version metadata

## 15. Explicitly deferred

- The Studio (interactive recipe builder)
- TEI import/export tooling
- Edition comparison view
- Advanced multi-facet filtering (AND logic)
- Accounts and community features
- SPARQL endpoint
- Any requirement to run WordPress or a server-side database for MVP

## 16. Completion criteria (MVP)

Data integrity and invariants

- No dangling ids across collections
- Stable ids (no regeneration on edit)
- urn:* present for all public entities
- Validation script passes on seed.json

Core UX

- Recipe page: annotated/translation/greek modes function as specified
- Annotation panel resolves to ancient terms via ids or pinned mapping (no string matching)
- People, works, tools, processes index pages are db-driven and clickable
- Placeholder data is visibly labelled

Citability and exports

- Footer shows Site version and Dataset version
- Cite this block exists for each key entity type
- JSON-LD export exists for each key entity type
- Dataset export artefact plus version.json exists and is downloadable

Quality

- Lighthouse performance target met for a static site build
- Accessibility: focus styles, skip link, language attributes (including lang=grc for Greek)

## 17. Open items (next steps)

- Add version.json and show Site plus Dataset version in footer
- Strengthen FAIR/citability deliverables: consistent Cite this blocks, JSON-LD exports per entity type, and dataset export artefacts
- Continue hardening link invariants and add automated validation
- Future: add scent profiles to Ingredient Product and enable filtering by scent families/notes
