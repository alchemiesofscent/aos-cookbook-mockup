# UX/IA Appendix v2.0

Project: Alchemies of Scent — The Laboratory
Version: 2.0
Date: 16 January 2026
Companion to: PRD v3.0, Technical Specification v2.0

Document purpose: Interface guide for the React static site. It describes the information architecture, routing conventions, key page behaviours, annotation behaviour, filter logic, and user journeys.

## 1. Information architecture

### 1.1 Primary sections

The site is organised into two public spaces plus supporting pages.

The Library

- Recipes
- Works
- People

The Workshop

- Ancient Terms
- Materials (Ingredient Products and Material Sources)
- Identifications
- Processes
- Tools

About

- Project
- Team
- News
- Events

Search

- Site-wide search (MVP may be a simple client-side search)

### 1.2 Entity-first navigation

Navigation is relationship-driven. The main affordance is always, from any entity page, a set of adjacent entities (for example recipes using this ancient term; identifications for this term; products identified with this term; works cited by these identifications).

## 2. Routing

### 2.1 Canonical route strings

Canonical routes are internal route strings with stable ids.

- recipe:{recipeId}
- ancient-term:{aiId}
- identification:{identId}
- ingredient-product:{ipId}
- material-source:{msId}
- work:{workId}
- person:{personId}
- workshop-tool:{toolId}
- workshop-process:{processId}

The app should serialise the current route string into the browser URL so that deep links can be shared. The exact URL encoding is implementation-defined, but the route string must be recoverable losslessly.

### 2.2 Legacy routes

Legacy routes (for example recipe_rose, work_materia_medica, person_dioscorides) exist for compatibility only. The router should accept them and immediately redirect internally to the canonical route string. New UI navigation must not emit legacy routes.

## 3. Global navigation and layout

### 3.1 Header

Primary navigation groups:

- Library: Recipes, Works, People
- Workshop: Ancient Terms, Materials, Processes, Tools
- About: Project, Team, News, Events

A persistent search affordance may be present if implemented.

### 3.2 Footer

Footer includes:

- Licensing summary
- Institutional credit
- Site version and Dataset version (from public/data/version.json)

## 4. Page patterns

### 4.0 Entity titles and placeholder display (all entity pages)

- Page titles use the entity’s primary display name only.
- Placeholder/demo status is shown via a badge and (optionally) a secondary line drawn from notes/disambiguation metadata; never by modifying the title.

### 4.1 Recipe page

Recipe page supports three reading modes.

- Annotated (default)
- Translation
- Greek

Annotated mode

- Uses text.combinedSegments when present.
- If combinedSegments is absent, falls back to Translation view and shows a notice that annotated segmentation is not available.

Notes panel

- Desktop: notes panel visible alongside the text.
- Mobile: notes panel becomes a bottom sheet.

Link behaviour

- Ingredient tokens resolve to ancient terms via RecipeItem.ancientTermId or, during transition, via pinned annotation mapping.
- No link defaults directly to a single modern identification.

Recipe page sections

- Source block (work, citation, edition/translator metadata)
- Reading mode selector
- Text panel (annotated tokens or plain text)
- Notes panel (annotation cards)
- Ingredients (cards or rows; each resolves to ancient-term:{id})
- Processes and Tools (cards; resolve to workshop-process:{id} and workshop-tool:{id})
- Related (variants, related experiments if present)
- Cite this (copyable citation plus JSON-LD download)

### 4.2 Ancient term page

The philological hub.

Core blocks

- Term and language metadata
- What the ancients said (curated quotations, each with a work reference)
- Modern identifications, grouped by confidence
- Related terms (parent/part-of/derived-from if present)
- Recipes using this term (clickable recipe cards)
- Cite this and JSON-LD

### 4.3 Identification page

A single scholarly claim.

Core blocks

- Claim summary (ancient term → product and/or source)
- Confidence
- Source work and locator
- Notes
- Links to all referenced entities
- Cite this and JSON-LD

### 4.4 Ingredient product page

The interpretive bridge.

Core blocks

- Product definition
- Scent profile (optional in MVP if the dataset has it)
- Material sources (if applicable)
- Ancient terms for this product (reverse links via identifications)
- Recipes (optional, via linked ancient terms)
- Cite this and JSON-LD

### 4.5 Material source page

The scientific foundation.

Core blocks

- Source definition and type (plant/mineral/animal/other)
- External references (optional)
- Derived products
- Cite this and JSON-LD

### 4.6 Work page

Works are data-driven from db.masterWorks.

Core blocks

- Work metadata (type, date, language, authors)
- Relationships (editions/translations/commentaries if modelled)
- Recipes and identifications citing this work (where available)
- Cite this and JSON-LD

### 4.7 Person pages

People are data-driven from db.masterPeople.

Display categories

- Team page filters categories including team.
- People page filters out team.

Person page blocks

- Identity and metadata
- Works authored/edited/translated if modelled
- Recipes attributed if modelled
- Cite this and JSON-LD

### 4.8 Workshop tools and processes

Index pages

- Render as clickable cards from db.masterTools and db.masterProcesses.

Detail pages

- Definition
- Variations/notes
- Recipes using this tool/process
- Further reading (optional)
- Cite this and JSON-LD

## 5. Annotation behaviour

### 5.1 Anchoring principle

Each annotated token/segment must be resolvable deterministically to a RecipeAnnotation.id, which in turn may pin to target entity ids.

The preferred mechanism is combinedSegments in recipe text, where each segment can include an `annotationId` that points to `RecipeAnnotation.id`.

Pins policy (transition): preferred in `public/data/seed.json`; a temporary code bridge is allowed pre-1.0. No string matching.

### 5.2 States

- Default: annotated tokens are visually indicated as interactive.
- Hover: hover affordance on desktop.
- Active: selected token highlighted; corresponding annotation card shown.

### 5.3 Annotation card requirements

Annotation cards must support:

- A title
- A type (ingredient/process/tool/philological/editorial/cross-reference/general)
- Main content
- Link actions, where applicable, including View ancient term and See identifications

The View ancient term action must resolve via an explicit ancientTermId (or pinned mapping), not by searching for matching strings.

## 6. Filtering and browse behaviour

### 6.1 Recipe archive

Recipe archive is client-side and data-driven. Filters are computed from the dataset and applied in-memory.

MVP filters should include (at minimum):

- Work (source)
- Period (if present)
- Ancient term (direct)
- Process

Ingredient-product filtering (optional in MVP) requires traversing identifications → ancient terms → recipes.

### 6.2 URL persistence

Filtered views should be shareable. The app may persist filters in the URL (query string or hash) as long as it can be parsed deterministically.

## 7. Accessibility and typography

Accessibility requirements

- All interactive elements reachable via keyboard.
- Focus visible.
- Skip link to main content.
- Proper language attributes, including lang=grc for Greek.

Typography guidance

- Prioritise readable long-form text.
- Ensure polytonic Greek renders correctly.

## 8. Core user journeys

Interpretation chain

Recipe → annotated token → annotation card → ancient term → identification → ingredient product → material source

Research path

Ingredient product (or ancient term) → recipes filtered by that entity → recipe reading

Scholarly citation path

Identification (or recipe) → Cite this block → copy citation or download JSON-LD
