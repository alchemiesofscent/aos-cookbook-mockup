# Product Requirements Document v2.2 (Revised)

**Project:** Alchemies of Scent — The Laboratory  
**Version:** 2.2  
**Date:** 8 January 2026  
**Target:** MVP live by mid-February 2026  
**Platform:** WordPress on Hetzner Cloud (CAX21)  
**Budget:** ≤ €200/year hosting + €49/year ACF Pro

**Document Purpose:** This is the canonical governing document. It defines scope, non-negotiables, MVP boundaries, and scholarly commitments. For implementation details, see the Technical Specification. For interface design, see the UX/IA Appendix.

---

## 1. Vision

Ancient perfume recipes are compressed artifacts. A few lines of Greek encode ecological knowledge, technical expertise, sensory experience, economic networks, and cultural meaning.

**The Laboratory decompresses them.** It makes the interpretive craft sensible — a reader can move from "σχοίνου λίτρας πέντε" to holding a vial of lemongrass-infused oil and understanding why that choice, why that quantity, why that process. It is a place where knowledge is made, where apprentices learn by watching masters work, where materials are handled, where theory meets practice.

Most scholarly databases present recipes as inert text with metadata. Most "historical recreation" sites strip away the uncertainty and just give you a modern recipe. Neither teaches the interpretive craft — the moves a scholar makes to get from ancient text to modern material. This is what the Laboratory aims at.

---

## 2. Product in One Sentence

A citable, public research platform that connects ancient perfume recipe texts, ambiguous ingredient terms, modern identifications with sensory profiles, and experimental evidence — designed to teach the craft of historical interpretation while creating desire for material experience.

---

## 3. User Experiences

### 3.1 The Curious Reader

**Sarah, a perfume enthusiast, discovers the site through a blog post about ancient fragrances.**

She lands on a recipe page for Dioscorides' Rose Perfume. The text is clean, readable — Greek on the left, English on the right. She notices that "σχοῖνος" is highlighted. She clicks it.

A panel opens: this word means something like "rush" or "reed," but scholars think it's actually lemongrass. She sees two proposed identifications, each with a confidence level and a citation to the scholarly work that proposed it. She clicks through to the Ingredient Product page for lemongrass oil and reads about its scent — bright, citrusy, with a green herbal edge.

She returns to the recipe. Now she understands something she didn't before: this "rose perfume" isn't just roses. It has a lemony brightness underneath. She wants to smell it.

**What the site did:** Made the interpretive chain visible. Turned a dead word into a sensory possibility.

### 3.2 The Graduate Student

**Marcus is writing a thesis on aromatic trade in the Hellenistic Mediterranean.**

He needs to know which recipes use myrrh, and whether the "myrrh" in Greek texts is the same substance as Egyptian ʿntyw. He goes to the Ancient Ingredient page for σμύρνα (smyrna).

He finds: ancient references (what Dioscorides, Theophrastus, and Pliny said about it), and a list of identifications — each one a distinct scholarly claim, linked to the Work that proposed it, with page numbers and confidence levels. Commiphora myrrha is "established" per Steuer (1943). Commiphora guidottii is "probable" for certain contexts per Tucker (1986).

He clicks through to see all recipes using σμύρνα. He exports the JSON-LD for his reference manager. He cites the page using the URN.

**What the site did:** Provided citable, structured data with scholarly provenance. Preserved ambiguity instead of collapsing it. Made identifications traceable to their sources.

### 3.3 The Experimental Perfumer

**Diana is part of the project team, attempting to recreate ancient perfumes.**

She's working on Megalleion, a famous ancient compound perfume. She opens the recipe and sees the ingredient list: balanos oil, cassia, cinnamon, myrrh, and others. For each ingredient, she can click through to see what modern materials might correspond — and who proposed each identification.

For "cassia," she finds two possibilities: Cinnamomum cassia (Chinese cassia) and Cinnamomum iners (wild cinnamon). The identifications show different scholars, different confidence levels. She reads the scent profiles for both, comparing them.

She makes a choice — Chinese cassia, because the scent profile matches ancient descriptions of "pungent and biting." She records her decision and her reasoning.

Later, when the Replication Story is published, readers can see exactly which interpretive choices she made and why.

**What the site did:** Supported informed experimental choices without pretending there's a single "correct" interpretation.

### 3.4 The Returning Visitor

**James visited the site months ago and bookmarked a recipe.**

He returns using the same URL. It still works — the URN resolves to the current page. The recipe has been updated: a new annotation explains a contested reading in the Greek text. The "last modified" date tells him something changed. He can see the same recipe in Sprengel's edition linked as a variant.

**What the site did:** Provided stable, citable identifiers. Made updates visible without breaking references.

### 3.5 The Classroom Teacher

**Professor Chen is teaching a course on ancient technology.**

She assigns her students to explore the site and choose one recipe to analyze. The students don't need accounts — the site is fully public. They can browse by period, by ingredient, by process.

One student becomes fascinated by the tools — the kratēr, the mortar, the straining cloths. Another focuses on the processes — how is ancient "boiling" different from modern techniques? A third traces a single ingredient, frankincense, across a dozen recipes.

In class, they discuss what they found. The site gave them different entry points into the same material.

**What the site did:** Supported multiple modes of exploration without requiring a single "correct" path through the content.

---

## 4. The Three Spaces

### 4.1 The Library

**The ancient sources and their world.**

Where scholars live. Clean, typographically excellent presentation of texts with translation. Stable, citable, authoritative. The text breathes — but it's alive with entry points. Hover on a word and you sense there's more beneath.

**Contains:**
- Recipes (the textual witnesses)
- Works (ancient texts, editions, translations, and scholarship)
- People (authors, attributed figures, historical actors, team members)

### 4.2 The Workshop

**Where ancient meets modern.**

The interpretation layer. Click into any ingredient term and enter the space where identification happens. See what the ancients said, what scholars think, what we've tried, what you can use.

**Contains:**
- Ancient Ingredients (the philological hub)
- Identifications (the scholarly claims linking ancient to modern)
- Ingredient Products (the interpretive bridge, with scent profiles)
- Material Sources (the scientific foundation)
- Processes (techniques)
- Tools (implements)
- Replication Stories (our experimental narratives)

### 4.3 The Studio

**Where you make.**

Deferred to Phase 2. An interactive space where recipes become actionable. Users choose their interpretations, compose their own version, and generate a practical recipe that links back to the scholarly evidence.

---

## 5. What Users Can Do (MVP)

- Read recipes with original text, translation, and layered annotations
- Navigate the interpretation chain: ancient term → identification → modern product → material source
- See the scholarly provenance of each identification (who proposed it, where, with what confidence)
- Explore scent profiles and sensory descriptions
- Read stories about experimental replications
- Browse by ingredient, process, source, period, scent family
- Cite any entity via persistent URN
- Download structured data (JSON-LD)

---

## 6. Infrastructure

| Component | Choice | Cost |
|-----------|--------|------|
| Server | Hetzner Cloud CAX21 (4 vCPU ARM, 8GB RAM) | ~€78/year |
| Backups | Hetzner automated daily | ~€20/year |
| Domain | alchemiesofscent.org (owned) | ~€15/year |
| SSL | Let's Encrypt (free) | €0 |
| ACF Pro | License | €49/year |
| **Total** | | **~€162/year** |

**Server stack:**
- Ubuntu 22.04 LTS
- PHP 8.2
- MySQL 8
- WordPress 6.4+
- WP-CLI installed
- Git for theme deployment

---

## 7. Data Model (Conceptual Overview)

The database is built around interconnected content types organized into two spaces, with a third (The Studio) deferred.

### 7.1 The Interpretation Chain

This is the scholarly core of the project:

```
Recipe
   │
   │ links to ancient terms only
   ▼
Ancient Ingredient
   │         ▲
   │         │ Identification (the scholarly claim)
   │         │   - links Ancient Ingredient
   │         │   - links Ingredient Product and/or Material Source
   │         │   - links Work (with page/line locator)
   │         │   - confidence level
   │         │   - notes
   │         │
   ▼         │
Identification ──────────► Ingredient Product
                                 │
                                 │ derived from
                                 ▼
                           Material Source
```

**Key principle:** Recipes link only to Ancient Ingredients. They do not resolve ambiguity — that happens through Identification records, which are first-class scholarly objects with their own provenance.

### 7.2 The Identification CPT

The central innovation. An Identification is a scholarly claim that links:

- **An Ancient Ingredient** (the term being identified)
- **An Ingredient Product** and/or **Material Source** (what it's identified as)
- **A Work** (the scholarly source making the identification)
- **A locator** (page, line, section — where in the Work)
- **Confidence level** (established / probable / speculative)
- **Notes** (any clarification)

This structure means:
- Identifications are citable objects, not embedded metadata
- The source of each identification is explicit and traceable
- You can work through a reference work systematically (e.g., "extract all identifications from André 1985")
- Multiple scholars' identifications coexist without collapsing into a single "answer"

### 7.3 Unified Work Model

All authoritative texts are Works, differentiated by type:

| Work Type | Examples |
|-----------|----------|
| ancient_text | De materia medica, Natural History |
| edition | Wellmann (1907), Sprengel (1829) |
| translation | Beck (2005) |
| monograph | Brun (2000), Manniche (1999) |
| article | Journal articles |
| chapter | Book chapters |
| lexicon | LSJ, André's lexicon |
| thesis | Dissertations |

Additional flags:
- `includes_commentary` (boolean)
- `includes_translation` (boolean)

This unifies the old Bibliography Entry CPT into the Work model. An identification cites a Work directly — no separate bibliographic layer.

**Future integration:** A `zotero_key` field will allow sync with Zotero for full bibliographic data (post-MVP).

### 7.4 Unified Person Model

All people are represented in a single Person CPT:

- Ancient authors (Dioscorides, Theophrastus)
- Modern scholars (Wellmann, Manniche)
- Team members (project staff)
- Attributed figures (Megallus, Cleopatra)

Distinguished by flags:
- `is_team_member` (boolean) — generates Staff page, appears in Team section
- `is_historical` (boolean) — appears in prosopography / People archive

A person can be both (e.g., a team member who is also a published scholar).

### 7.5 Ancient Ingredient Relationships

Ancient terms have complex relationships to each other:

| Relationship | Field | Example |
|--------------|-------|---------|
| Specificity (kind of) | `parent_term` | ἴρις Ἰλλυρική → ἴρις |
| Mereology (part of) | `part_of` | ῥίζα ἴρεως → ἴρις |
| Derivation (product of) | `derived_from` | σποδός σμύρνης → σμύρνα |

These are separate relationship fields, not a repeater, for query simplicity.

### 7.6 Ingredient Product Relationships

| Relationship | Field | Example |
|--------------|-------|---------|
| Specificity hierarchy | `parent_product` | Rose Damascena Oil → Rose Oil (General) |
| Processing chain | `derived_from_product` | Rose absolute → Rose concrete |

The `part_used` field (resin / flower / leaf / root / etc.) captures which part of the Material Source the product comes from.

### 7.7 Content Type Summary

**The Library:**

| CPT | Purpose |
|-----|---------|
| Recipe | A textual witness, typically following a single scholarly edition |
| Work | Ancient texts, editions, translations, scholarship — all citable authorities |
| Person | Authors, scholars, team members, attributed figures |

**The Workshop:**

| CPT | Purpose |
|-----|---------|
| Ancient Ingredient | A term as it appears in ancient texts |
| Identification | A scholarly claim linking ancient term to modern material |
| Ingredient Product | A modern interpretive category with scent profile |
| Material Source | The scientific foundation — plants, minerals, animals |
| Process | Techniques used in recipes |
| Tool | Implements used in recipes |
| Replication Story | Narrative accounts of experimental work |

**Supporting:**

| CPT | Purpose |
|-----|---------|
| Event | Project events |
| News | Project announcements |

### 7.8 Scholarly Commitments

The data model embodies these non-negotiable principles:

1. **Ambiguity is preserved, not collapsed.** When an ancient term has multiple possible modern identifications, each is a separate Identification record with its own provenance.

2. **Identifications are first-class objects.** They have scholarly sources, confidence levels, and can be cited independently.

3. **The interpretation chain is visible.** Users can always trace: recipe → ancient term → identification(s) → modern product → material source.

4. **Recipes are witness-level objects.** Each recipe entry represents one textual witness, typically following a single scholarly edition. Different editions with meaningfully different content are separate entries, linked as variants.

5. **Recipes link only to Ancient Ingredients.** All interpretive resolution occurs through Identification records, not on the Recipe itself.

6. **Works are the authority layer.** All citations — for recipes, identifications, annotations — point to Works. This includes ancient texts, editions, translations, and modern scholarship.

7. **Scent lives on products, not sources.** Myrrh resin has a scent profile; Commiphora myrrha is a tree.

8. **Everything is citable.** Every entity has a persistent URN that resolves to a stable URL.

---

## 8. MVP Completion Criteria

MVP is complete when:

**Data Architecture**
- [ ] All CPTs registered with ACF fields
- [ ] Work ↔ Person relationships functional
- [ ] Recipe → Ancient Ingredient linking works
- [ ] Identification CPT functional (Ancient Ingredient ↔ Product/Source ↔ Work)
- [ ] Ancient Ingredient relationships (parent_term, part_of, derived_from) working
- [ ] URN resolver returns 303 → canonical URL
- [ ] JSON-LD validates for Recipe, Identification, Ingredient Product, Person

**Templates**
- [ ] All single templates render correctly
- [ ] Recipe archive with working filters
- [ ] Ancient Ingredient page shows linked Identifications
- [ ] Ingredient Product page shows reverse-linked Identifications ("ancient terms for this product")
- [ ] Annotation display functional (static minimum)
- [ ] Scent profiles display on Ingredient Product pages
- [ ] Person pages show works authored and (for team) experiments participated in

**Content (Minimum)**
- [ ] 5 complete recipes with linked Ancient Ingredients, 2+ annotations each, linked processes/tools
- [ ] 10 Ancient Ingredients
- [ ] 15 Identifications (demonstrating the chain)
- [ ] 10 Ingredient Products with scent profiles
- [ ] 5 Material Sources
- [ ] 3 Processes with full content
- [ ] 3 Tools with full content
- [ ] 5 People (ancient authors)
- [ ] 5 Works (mix of ancient texts and modern scholarship)
- [ ] 1 Replication Story

**Quality**
- [ ] Lighthouse performance > 70 mobile
- [ ] Accessibility: skip links, focus styles, lang attributes
- [ ] Site publicly accessible at alchemiesofscent.org

---

## 9. Versioning Discipline

| Version | Scope | Introduces |
|---------|-------|------------|
| **v1 (MVP)** | Library + Workshop foundation | Core CPTs, interpretation chain, basic templates |
| **v1.1** | Increased depth, density, polish | More content, refined filters, better search, structured experimental data |
| **v2** | The Studio | Interactive recipe builder — uses existing data, introduces no new interpretive claims |

This discipline ensures the Studio is built entirely on the scholarly foundation established in v1, not bolted on as an afterthought.

---

## 10. Explicitly Deferred

| Feature | Target Phase |
|---------|--------------|
| The Studio (interactive recipe builder) | 2.0 |
| Parallel Greek/English highlighting | 2.0 |
| Annotations on original Greek text | 2.0 |
| TEI import/export tooling | 2.0 |
| Edition comparison view | 2.0 |
| Zotero integration | 1.1 |
| Multi-facet filtering (AND logic) | 1.1 |
| Czech content translation | 1.1 |
| User accounts | 2.0 |
| Community features | 2.0 |
| Advanced visualizations (scent maps) | 2.0 |
| Structured experimental data | 1.1 |
| SPARQL endpoint | Future |

---

## 11. Visual Design Principles

**Typography**
- Exceptional Greek and Latin rendering
- Generous whitespace
- The text is a pleasure to read

**Color**
- Warm, natural palette
- Amber, cream, sage, terracotta
- Evokes materials, earth, age
- Not clinical white

**Motion**
- Subtle transitions
- Reveals feel like unfolding
- No flashy animation

**Density**
- Variable by context
- Library pages: spare, focused on text
- Workshop pages: richer, more visual
- Density matches mode

**Navigation**
- Defined by relationships, not hierarchy
- "From here, you could go..."
- Follow connections naturally

---

## 12. Licensing

| Asset | License |
|-------|---------|
| Theme code | GPL-3.0-or-later |
| Content (text, translations) | CC-BY-4.0 |
| Structured data exports | CC0-1.0 |
| Photography (project's own) | CC-BY-4.0 |

Displayed in site footer and JSON-LD.

---

## 13. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Scope creep from Studio features | High | High | Explicitly deferred to Phase 2; versioning discipline |
| Identification data entry bottleneck | Medium | High | Work-centered workflow (extract all IDs from one source at a time) |
| Work/Person ontology edge cases | Medium | Medium | Start with core entities; expand incrementally |
| Scent profile inconsistency | Medium | Low | Develop vocabulary guide; review process |
| Annotation authoring bottleneck | Medium | Medium | Start sparse; add over time |
| Photography gaps | Low | Medium | Mix of own photos + historical images |
| ACF relationship query performance | Low | Medium | Monitor; optimize queries if needed |

---

## 14. Work-Centered Scholarly Workflow

The Identification CPT enables a more efficient workflow for data entry:

**Old approach (ingredient-by-ingredient):**
1. Create Ancient Ingredient "σμύρνα"
2. Search multiple sources for identifications
3. Add each as a repeater row with citation details
4. Repeat for next ingredient

**New approach (work-centered):**
1. Open André (1985) or Beck (2005) or Manniche (1999)
2. Work through systematically, creating Identification records
3. Each Identification links to its Ancient Ingredient, proposed product/source, and the Work
4. The Work is linked once; the locator (page/line) varies per Identification

Benefits:
- Reduces redundant citation entry
- Matches how scholars actually work with sources
- Makes it easy to track "what have we extracted from this source?"
- Supports batch import from reference works

---

## Related Documents

- **Technical Specification v1** — Full CPT definitions, field lists, CSV schemas, importer logic, JSON-LD mappings, URN resolution
- **UX/IA Appendix** — Wireframes, navigation structure, annotation behavior, filter logic, user journeys

---

**Document version:** 2.2  
**Last updated:** 8 January 2026
