# Annotations PRD (Focused) — Current App Behavior

## Purpose
Annotations turn “dead words” inside a recipe into interactive entry points that expose interpretive context (linguistic + scholarly commentary) and route the reader into the interpretation chain (ancient term → identification(s) → modern material).

This PRD captures:
- **What the annotation feature does today** in the React mock (`src/app/App.tsx` + `src/pages/library/RecipePage.tsx`)
- The **intended user-facing behavior** implied by `docs/prd/PRD_v3.0_StaticSite.md` (MVP: recipe reading + annotations)

## In Scope (MVP)
- Highlighted terms embedded in the recipe text (in the current mock, the displayed recipe text is labeled “Translation”, but behaves like the annotated Combined view).
- Click-to-open notes panel showing the selected term’s annotation content.
- Optional call-to-action links from an annotation into other entities/pages (e.g., ingredient/process pages).
- Single active annotation at a time.
- Recipe text supports **three displays**:
  - **Original Greek**
  - **English translation**
  - **Combined view** (English narrative where **ingredient terms remain in the original language/script** (Greek/Latin/Egyptian/etc.) and **tools/processes remain English** for readability; highlights are a curated subset, not full coverage)

## Out of Scope (for now)
These are explicitly deferred or not implemented in the current app:
- Parallel Greek/English highlighting (PRD deferred to 2.0).
- Annotations on original Greek text (PRD deferred to 2.0).
- Multi-layer filtering of annotation types (linguistic vs chemical vs textual-criticism) beyond what’s represented as free text.
- Authoring/editing annotations, version history, “last modified” surface, or per-annotation provenance links to Works (mentioned conceptually in PRD, not implemented here).

## Primary User Story (from PRD)
As a curious reader, when I’m reading a recipe and see a highlighted term, I can click it to understand what it means and why it matters, then follow links to deeper context (e.g., identifications and scent profile), without losing my place in the recipe text.

## Current UX (as implemented in `src/pages/library/RecipePage.tsx`)

### Entry Point: highlighted terms in the recipe text
- The recipe text is rendered as a sequence of segments (`textSegments`).
- Some segments are marked as annotations via `{ type: "annotation", id: "<annotationId>" }`.
- Annotated segments render as an inline clickable element with visual emphasis:
  - A subtle amber underline/border by default.
  - On hover: background tint + stronger underline.
  - When active: stronger background tint + amber text weight/emphasis.

### Interaction model
- Clicking a highlighted term sets it as the **active annotation**.
- Only one annotation is active at a time; selecting a different term replaces the currently shown annotation content.
- There is no explicit “close” action; the empty state is only visible when no annotation has been selected yet.

### Notes panel behavior
- The recipe page uses a split layout: **Text column (left)** and **Notes column (right)**.
- The Notes column is sticky (stays visible while scrolling).
- Default state (no selection): instructional empty state message:
  - “Click any highlighted term to see commentary.”
- Selected state: shows an “annotation card” containing:
  - Term (headline)
  - Transliteration (secondary, italic)
  - Definition/body text (single paragraph)
  - Links section (0..N buttons)
    - If links exist: render each as a button labeled `→ {label}` that navigates to `route`.
    - If no links exist: render a single fallback button “→ View ancient term” (currently routes to a demo ingredient page).
- When a new annotation is selected, the card animates in with a short fade/slide (“fade-in”).

## Content Model (current mock data shape)

### Recipe text segmentation
The recipe text is stored as an ordered array of segments, where each segment is either:
- Plain text: `{ text: string }`
- Annotated text: `{ text: string, type: "annotation", id: string }`

### Three-display contract (behavioral)
- **Combined view** is the annotated reading experience (parity with today’s mock):
  - Ingredient terms appear inline in their original language/script (Greek/Latin/Egyptian/etc.); only selected terms/occurrences render as clickable annotated spans.
  - Tools/processes remain in English in the running text; only selected terms/occurrences render as clickable annotated spans (Greek lemma can be surfaced via `transliteration` in the Notes card).
  - Unannotated terms render as plain text (no implication of exhaustive highlighting).
- **English translation view** is English-only (no requirement to show annotations initially).
- **Original Greek view** is Greek-only (no requirement to show annotations initially, consistent with PRD deferrals).

### Annotation record
Annotations are stored in a map keyed by `id`, e.g. `annotations[annotationId]`, where each record contains:
- `term`: string
- `transliteration`: string
- `definition`: string
- `links`: array of `{ label: string, route: string }` (may be empty)

### Rendering contract (behavioral invariants)
To preserve current behavior when swapping in real data:
- Each annotated segment’s `id` must resolve to an annotation record.
- Clicking the rendered annotated term must:
  - Mark it active (visual state)
  - Populate the Notes panel with the record for that id
- An annotation may have zero links; the UI must still show a usable fallback CTA.
- The Notes panel must not shift the reader’s scroll position in the text column.

## Data Contract Requirement (for storage-backed implementation)
The UI behavior above relies on having segment-level annotation anchors. Any storage-backed model must provide one of:
- A precomputed segment array for the Combined view (preferred for exact parity), or
- A deterministic hydration/parsing function that converts stored text + anchors/markup into the same segment array shape.

## Combined View Authoring Workflow (MVP)
For the GitHub Pages wireframe, the simplest parity-first approach is to store `combinedSegments` directly and author it with an external “assist + revise” flow:
- Generate an initial `combinedSegments` draft (and corresponding annotation records) using an external LLM/chat prompt.
- Manually revise for accuracy, readability, and consistent IDs.
- Import/seed the resulting JSON into the app (no runtime API calls; copy/paste or file-based seed).
- For GitHub Pages first-load, commit a versioned seed file (e.g. `public/data/seed.json`) and use localStorage as a per-browser overlay.

Practical guidelines:
- Keep **tools/processes** readable in English in the running text; if useful, put the original-language lemma in the Notes card `transliteration`.
- Treat highlights as editorial: don’t try to annotate every occurrence; prefer the most interpretively valuable mentions.
- Ensure non-ingredient annotations (tools/processes) include at least one `links[]` entry so the UI doesn’t fall back to the ingredient-specific “View ancient term” CTA.
- Guardrails: in dev mode, fail fast if any annotated segment `id` is missing from the annotations map; warn if a segment’s visible text differs sharply from `annotation.term` (manual parity remains authoritative).

## Functional Requirements
1. **Clickable annotations:** Annotated terms in the recipe text are visually distinguished and clickable.
2. **Single selection:** Exactly one annotation can be active at a time.
3. **Notes panel:** Selecting an annotation shows its content in the Notes panel immediately.
4. **Deep-link CTAs:** An annotation may include 0..N CTAs that navigate to related entities.
5. **Graceful empty state:** When nothing is selected, show a clear instruction in the Notes panel.

## Non-Functional Requirements
- **Readability first:** Annotation styling must not overpower the text; it should signal depth without “link spam”.
- **Performance:** Annotation rendering must remain fast for long texts (segment rendering should be linear).
- **Accessibility (target, even if current mock falls short):**
  - Annotated terms should be keyboard-focusable and operable (Enter/Space).
  - Visible focus styling for annotated terms and CTA buttons.
  - Notes panel updates should be perceivable (e.g., heading change) without disrupting reading.

## Acceptance Criteria (parity with current behavior)
- Highlighted terms display inline in the recipe text with hover + active visual states.
- Clicking a highlighted term updates the Notes panel card content to match that term.
- Clicking a second highlighted term replaces the first card (no stacking).
- If an annotation has links, each renders as a clickable button that navigates to its route.
- If an annotation has zero links, the fallback “View ancient term” button appears.
- On first load with no selection, the Notes panel shows the instructional empty state.

## Notes on Alignment with `docs/prd/PRD_v3.0_StaticSite.md`
- The PRD’s “Curious Reader” narrative implies this exact pattern: highlighted term → click → explanatory panel → click-through to interpretive objects.
- The PRD frames annotations as part of “read recipes with original text, translation, and layered annotations” (MVP).
- The PRD explicitly defers:
  - Parallel Greek/English highlighting (2.0)
  - Annotations on original Greek text (2.0)

## Implementation Guardrails (for the upcoming data migration)
When evolving the implementation, preserve these invariants:
- The “annotated term” rendering remains inline with the same click behavior and active styling.
- The Notes panel remains sticky, with the same empty state and the same card structure.
- Annotation selection remains local UI state (immediate feedback), with any persistence happening behind the scenes (no UX lag).
