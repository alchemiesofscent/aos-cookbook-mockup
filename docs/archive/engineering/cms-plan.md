# CMS Plan — “Scriptorium” (Future editorial tool) — v0.2

**Repo context:** This repo is a React/Vite mock. An earlier localStorage-backed editor prototype lived in this repo, but it was removed as part of the static-site MVP scope (commit `547d639`). This document describes a future CMS/editor (“Scriptorium”) inspired by that prototype’s workflows.

**Implementation target:** WordPress 6.4+ on Hetzner (Ubuntu 22.04, PHP 8.2, MySQL 8) with **ACF Pro only** (no paid add-ons).

---

## 0) Goals, Non-goals, Principles

### Goals (MVP)
- Provide a scholar-friendly editorial interface (“Scriptorium”) inspired by the removed prototype editor’s workflows.
- Preserve the core prototype workflows:
  - Sidebar modules, searchable list views, Create/Edit flows.
  - Multi-tab Recipe editor: `Metadata`, `Text`, `Extraction`, `LLM Assistant`.
  - Inline creation of related records from within an edit flow.
  - JSON export/import (backup/restore and migration).
  - Copy-to-clipboard prompt + paste JSON to populate extraction.
  - Auto-create missing master records from pasted JSON **as Draft**.
- Add a **split-pane Preview** in the editor (edit left, front-end preview right).
- Match PRD/Tech Spec stack and constraints; prefer free/custom code over paid plugins.

### Non-goals (MVP)
- No external AI API integration inside the CMS (copy/paste workflow only).
- No multi-stage editorial workflow beyond Draft/Publish and minimal validation.
- No full “Studio” interactive recipe composer (explicitly Phase 2 in PRD).

### Principles
- **Scholarly care first:** optimize for deliberate manual entry, transparency, and provenance.
- **Stable citations:** URNs must be stable and resolvable forever; slug changes must not break citations.
- **Minimize WordPress friction:** reduce “WP admin clutter” and cognitive overhead for editors.

---

## 1) Architecture Options (and Recommendation)

### Option A — Native WP Admin + ACF (customized)
**What it is:** Use standard WP edit screens for each CPT, with ACF field groups, plus some admin customization (metabox ordering, custom columns, limited custom pages).

**Pros**
- Lowest custom engineering (no React admin app build pipeline).
- Leverages WP autosave/revisions/preview out of the box.
- Easier to maintain long-term if editors are WP-familiar.

**Cons**
- Hard to match the removed prototype editor’s clarity:
  - Inline “create related record” flows are clunky (new tab/window, relationship field UX limits).
  - Multi-tab editor + bulk “extraction rows” are awkward in ACF repeaters.
  - Split-pane preview is non-trivial without heavy customization.
- Higher risk of “WP complexity creep” for scholar workflows.

**Best fit when:** You’re OK with WP-native editing UX and mainly need the data model + templates.

### Option B — “Scriptorium” React App embedded in `wp-admin` (prototype-like UX)
**What it is:** A custom WP plugin adds a top-level admin menu (Scriptorium) whose page loads a bundled React app that mirrors the removed prototype editor’s workflows. Data persists to WordPress CPTs/ACF via authenticated WP REST endpoints.

**Pros**
- Closest to the removed prototype editor’s simplicity (same mental model, same flows).
- Split-pane preview is straightforward (iframe with WP preview URL).
- Can implement copy/paste JSON extraction exactly like the mock.
- Can enforce validations, “draft-only auto-create,” and de-cluttered UX centrally.

**Cons**
- More engineering up front (plugin + admin SPA + REST endpoints + build/deploy).
- Must design a clean mapping between the React admin state and WP/ACF fields.
- Need to handle performance and pagination for large datasets in custom UI.

**Feasibility on your stack:** Yes. WP REST API + cookie/nonce auth works well for an admin-embedded SPA on WP 6.4+/PHP 8.2. No external network calls needed.

**Recommendation:** **Option B** for MVP, because it best matches the prototype-inspired UX (split-pane preview + “inline create” flows + copy/paste extraction).

---

## 2) Naming + Model Changes (Rename Now)

You want to rename vocabulary for clarity:
- “Ancient Ingredient” → **Ancient Term**
- “Ingredient Product” → **Modern Ingredient**
- “Material Source” → **Natural Source**

### Recommendation on renaming now
Do it **now** (before content volume grows). It improves editor mental models and fits the project’s scholarly stance: recipes contain *terms*; identifications connect them to modern materials.

### What “rename now” means (to define explicitly)
1) **UI labels only** (low risk) vs
2) **CPT slugs + URN namespaces + URLs** (higher impact but cleaner)

Given you’re early and want intuition, choose **(2)** and update docs accordingly.

**Proposed CPT slugs / URL bases / URN namespaces**
- Recipe: `recipe` / `/recipes/` / `urn:aos:recipe:*`
- Work: `work` / `/works/` / `urn:aos:work:*`
- Person: `person` / `/people/` / `urn:aos:person:*`
- Ancient Term: `ancient_term` / `/ancient-terms/` / `urn:aos:ancient-term:*`
- Identification (claim): `identification` / (no archive) / `urn:aos:identification:*`
- Modern Ingredient: `modern_ingredient` / `/ingredients/` (or `/modern-ingredients/` to avoid ambiguity) / `urn:aos:modern-ingredient:*`
- Natural Source: `natural_source` / `/sources/` (or `/natural-sources/`) / `urn:aos:natural-source:*`
- Process: `process` / `/processes/` / `urn:aos:process:*`
- Tool: `tool` / `/tools/` / `urn:aos:tool:*`
- Replication Story: `replication_story` / `/experiments/` / `urn:aos:replication-story:*`

**Decision point:** confirm whether `/ingredients/` means “Modern Ingredients” in public IA (UX appendix currently uses `/products/` and `/sources/`).

---

## 3) Citation Stability: Slugs vs URNs (Locked-on-publish with resolvable history)

### Requirements
- Slugs and URNs can change until publish.
- After publish, URNs must remain stable.
- Post-publish slug fixes should be allowed, while **old URNs remain resolvable**.

### Implementation approach
- Generate and store a **canonical `urn` meta field** at first publish (ACF field, read-only thereafter).
- Never change `urn` automatically, even if the post slug changes.
- Optionally store `urn_aliases[]` (repeater) for exceptional cases (e.g., manual URN correction); resolver checks both canonical URN and aliases.

### Resolver behavior (aligning with Tech Spec intent)
Keep the `/id/{cpt}/{slug}` pattern, but resolve by **URN meta**, not by current post slug:
- Request: `/id/recipe/rose-perfume-dioscorides`
- Server builds URN: `urn:aos:recipe:rose-perfume-dioscorides`
- Query: find post by meta `urn == built_urn` OR `urn_aliases contains built_urn`
- Respond:
  - `Accept: text/html` → `303` to canonical permalink (current slug)
  - `Accept: application/ld+json` or `?format=jsonld` → return JSON-LD for that entity

This preserves old URNs even if permalinks/slugs change later.

---

## 4) “Scriptorium” CMS UX (Prototype-Inspired Mapping)

### Primary navigation (left sidebar)
Mirror the prototype editor’s modules, updated to the renamed model:
- Dashboard (counts + data tools)
- Recipes
- Works
- People
- Ancient Terms
- Tools
- Processes
- Modern Ingredients
- Natural Sources
- Identifications (optional in sidebar for MVP; but needed for core chain)
- Replication Stories (optional if not editing yet)

### List pages
For each module:
- Search input (name + slug + URN)
- Table list (key columns; avoid WP admin tables)
- Actions: Create, Edit, Delete (with confirmation)

### Create/Edit modals (for master records)
Replicate the prototype editor’s “master modal” patterns:
- Auto slug generation from transliteration/name
- URN display (draft: “will be assigned on publish”; published: immutable)
- Optional external links repeater for Works/People/Sources

### Recipe editor (multi-tab, same structure)
Tabs:
1) **Metadata**
   - Title, Source Work, attribution, author override, language, date, place
   - Slug (editable until publish)
   - URN read-only (blank/provisional until publish; locked after publish)
2) **Text**
   - Original text (Greek etc)
   - Translation
   - Notes
3) **Extraction**
   - “Add Ingredient/Tool/Process” rows
   - Rows include:
     - Master link dropdown + “Create new…” inline flow
     - Term + transliteration
     - Original quantity phrase + modern quantity string
     - Structured quantities (value+unit chips)
     - Role for ingredients
4) **LLM Assistant (copy/paste only)**
   - Copy prompt to clipboard (generated from Text tab)
   - Paste JSON response
   - Apply JSON → populate Extraction rows
   - Missing masters auto-created as **Draft** (Ancient Terms/Tools/Processes)

### Split-pane preview (requested)
In Recipe editor (and later other CPTs):
- Left: editor tabs
- Right: iframe preview of current entity on the public theme
- “Save draft & refresh preview” button (and/or auto-refresh after successful save)

Preview URL strategy:
- Draft: WordPress preview URL with nonce (`?preview=true`)
- Published: canonical permalink

---

## 5) Data Model in WordPress (CPTs + ACF)

Base on `docs/tech/Technical-Spec-v1.md`, with renamed CPTs/fields where appropriate.

### CPTs (MVP)
- `recipe`
- `work`
- `person`
- `ancient_term`
- `identification`
- `modern_ingredient`
- `natural_source`
- `process`
- `tool`
- `replication_story`
- Supporting: `event`, `news` (optional for MVP CMS; can be WP-native)

### Key relationships (interpretation chain)
- Recipe → links to **Ancient Terms** only (core principle).
- Identification → links Ancient Term → Modern Ingredient and/or Natural Source + source Work + confidence + locator.

### Recipe “Extraction” rows (storage)
Implement as ACF repeater (or custom table later if needed):
- `items[]` with:
  - `type` (ingredient/tool/process)
  - `ancient_term` relationship (required for ingredient-type rows in final model)
  - `tool` relationship / `process` relationship (for those row types)
  - `quantity_raw`, `quantity_translation`
  - `quantities[]` (value, unit)
  - `role`
  - `note` / `annotation` (future)

**Decision point:** whether to keep a single unified `items[]` repeater (prototype-like) or split into `ingredients[]`, `tools[]`, `processes[]` like the tech spec. Unified repeater matches the prototype and simplifies editor code; public rendering can regroup by type.

---

## 6) REST/API Layer (for React admin inside WP)

### Approach
Provide a small custom REST API namespace (e.g., `aos/v1`) to simplify the admin app:
- Avoids relying on “ACF in REST” settings and reduces coupling.
- Lets you enforce validations and URN/slug locking rules centrally.

### Endpoints (minimum set)
- `GET /aos/v1/bootstrap` → vocab lists, current user caps, controlled vocabularies
- `GET /aos/v1/{cpt}` → list + search + pagination
- `GET /aos/v1/{cpt}/{id}` → full entity (including ACF fields)
- `POST /aos/v1/{cpt}` → create draft
- `PUT /aos/v1/{cpt}/{id}` → update
- `DELETE /aos/v1/{cpt}/{id}` → delete (soft-delete optional)
- `POST /aos/v1/export` → download JSON backup
- `POST /aos/v1/import` → upload JSON backup (create/update by URN; “manual mode” default create-only)

Security:
- Cookie auth + `X-WP-Nonce` for authenticated admin users.
- Capability checks per CPT (`edit_posts`, `edit_others_posts`, etc).

---

## 7) Import/Export (prototype parity, scholar-friendly)

### Export JSON
- Single JSON containing all CPT records + relationships by URN (not numeric IDs).
- Download from Scriptorium Dashboard.

### Import JSON
- Upload JSON and show a dry-run summary:
  - creates/updates/errors
  - conflicts (same URN different title)
- Import strategy:
  - MVP default: create missing; update existing by URN only when explicitly enabled.

---

## 8) Annotation Manager (Later MVP+ / v1.1)

### Manual annotation manager
Goal: select text spans and attach annotation records.
- UI: recipe text view with selectable spans; “Create annotation from selection”.
- Storage options:
  1) Store anchors as character offsets (fragile under edits),
  2) Store as TEI/XML ids (best long-term, aligns with tech spec TEI anchors),
  3) Store as “occurrence of exact string” (works for MVP; fragile for repeated terms).

Recommendation:
- Start with **(3)** + occurrence index (as the UX appendix describes), then migrate to TEI anchors if/when TEI alignment is implemented.

### Auto-annotation suggestions (non-AI)
Goal: propose annotations for words matching master records.
- Tokenize original text; normalize diacritics; match against:
  - Ancient Term original forms + transliterations + stored variants
  - Process verbs list
  - Tool terms list
- Present suggestions with accept/dismiss; never auto-apply silently.

---

## 9) Milestones (Spec-kit style “Slices”)

### Slice 1 — WP Data Foundation
- Register CPTs + taxonomies.
- Implement ACF field groups (renamed model).
- Implement URN generation on publish + read-only locking.
- Implement `/id/...` resolver by `urn` meta + JSON-LD output (per tech spec).

### Slice 2 — Public Theme Skeleton
- Implement templates per UX/IA (Library/Workshop/About, archives, singles).
- Implement annotation display behavior (static show/hide for MVP).

### Slice 3 — Scriptorium Admin App (Parity)
- WP plugin adds admin page and enqueues React bundle.
- REST endpoints for CRUD + search + pagination.
- Implement modules + list pages.
- Implement master modal create/edit flows with inline create callback support.

### Slice 4 — Recipe Editor + LLM Copy/Paste + Draft Auto-create
- Multi-tab recipe editor matching the prototype editor’s workflow.
- Prompt generator + JSON apply workflow.
- Auto-create missing masters as **Draft** with a review queue.

### Slice 5 — Split Preview
- Add split-pane preview iframe.
- Save-and-refresh mechanics; handle draft preview URLs.

### Slice 6 — Import/Export
- JSON export and import with dry-run summary and URN-based matching.

### Slice 7 — Annotation Manager (v1.1)
- Manual annotation creation from selected text.
- Auto-annotation suggestions list + accept/dismiss.

---

## 10) Acceptance Criteria (MVP)
- Editors can create/edit Recipes, Works, People, Ancient Terms, Tools, Processes, Modern Ingredients, Natural Sources, Identifications entirely within Scriptorium.
- Recipe editor supports copy-prompt + paste-JSON extraction; applying JSON creates extraction rows and drafts for missing masters.
- Split-pane preview works for drafts and published content.
- Publishing locks canonical URN; changing post slug later does not break `/id/...` resolution.
- Export JSON produces a restorable dataset; import restores into a fresh WP install.

---

## 11) Risks & Mitigations
- **Complexity of mapping the prototype “unified items” to ACF:** mitigate by keeping a unified items repeater internally and grouping for display.
- **Performance of large reverse lookups (identification chain):** mitigate with caching/transients; keep archives paginated; consider lookup tables post-MVP.
- **Annotation anchoring fragility:** mitigate by starting with occurrence-based anchors and adding TEI alignment later.

---

## 12) Open Decisions to Confirm
1) Public IA naming: should `/ingredients/` mean Modern Ingredients, or do we keep `/products/` as in the UX appendix?
2) Unified `items[]` repeater vs separate repeaters for recipe ingredients/tools/processes.
3) Whether Identifications are edited in Scriptorium from day 1 (recommended: yes, because they’re the scholarly core).
