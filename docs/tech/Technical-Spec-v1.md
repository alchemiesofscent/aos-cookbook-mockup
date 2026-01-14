# Technical Specification v1

**Project:** Alchemies of Scent — The Laboratory  
**Version:** 1.0  
**Date:** 8 January 2026  
**Companion to:** PRD v2.2

**Document Purpose:** This is the builder's reference. It contains full CPT definitions, field specifications, CSV schemas, importer logic, JSON-LD mappings, and URN resolution. For scope and scholarly commitments, see the PRD. For interface design, see the UX/IA Appendix.

---

## 1. Custom Post Types Overview

### 1.1 The Library

| CPT | Slug | Icon | Public | Has Archive |
|-----|------|------|--------|-------------|
| Recipe | `recipe` | 📜 | Yes | Yes |
| Work | `work` | 📚 | Yes | Yes |
| Person | `person` | 👤 | Yes | Yes |

### 1.2 The Workshop

| CPT | Slug | Icon | Public | Has Archive |
|-----|------|------|--------|-------------|
| Ancient Ingredient | `ancient_ingredient` | 🏺 | Yes | Yes |
| Identification | `identification` | 🔗 | Yes | No |
| Ingredient Product | `ingredient_product` | 🧴 | Yes | Yes |
| Material Source | `material_source` | 🌿 | Yes | Yes |
| Process | `process` | ⚗️ | Yes | Yes |
| Tool | `tool` | 🏺 | Yes | Yes |
| Replication Story | `replication_story` | 🧪 | Yes | Yes |

### 1.3 Supporting

| CPT | Slug | Icon | Public | Has Archive |
|-----|------|------|--------|-------------|
| Event | `event` | 📅 | Yes | Yes |
| News | `news` | 📰 | Yes | Yes |

---

## 2. CPT Field Definitions

### 2.1 Recipe

The core content object. A textual witness, typically following a single scholarly edition.

| Field | Machine Name | Type | Required | Notes |
|-------|--------------|------|----------|-------|
| Title | `title` | text | yes | WordPress native title field |
| URN | `urn` | text | auto | Generated on publish: `urn:aos:recipe:<slug>` |
| Source Work | `source_work` | relationship → Work | yes | The edition this recipe follows |
| Citation | `citation` | text | yes | e.g., "1.43.1-3" |
| Page/Line | `page_line` | text | no | e.g., "pp. 42-43 Wellmann" |
| Attributed To | `attributed_to` | relationship → Person | no | If different from source work author |
| Attributed Work | `attributed_work` | relationship → Work | no | e.g., lost work being cited |
| Attribution Note | `attribution_note` | textarea | no | e.g., "Galen cites this as from Cleopatra's Kosmetika" |
| Original Text | `original_text` | textarea | yes | Full text as edited |
| Original Language | `original_language` | taxonomy → Language | yes | |
| Translation | `translation` | textarea | yes | English translation |
| Translator | `translator` | text | no | Who translated |
| Ingredients | `ingredients` | repeater | yes | See §2.1.1 |
| Processes | `processes` | relationship → Process | no | Multi-select |
| Tools | `tools` | relationship → Tool | no | Multi-select |
| Text Segments | `text_segments` | repeater | no | See §2.1.2 |
| Annotations | `annotations` | repeater | no | See §2.1.3 |
| TEI Anchors | `tei_anchors` | repeater | no | See §2.1.4 |
| Transmission Notes | `transmission_notes` | textarea | no | Notes on textual variants |
| Related Recipes | `related_recipes` | relationship → Recipe | no | Variant versions, parallels |
| Period | `period` | taxonomy → Period | no | |
| Place | `place` | taxonomy → Place | no | |
| Notes | `notes` | textarea | no | General notes |

#### 2.1.1 Ingredients Repeater

| Subfield | Machine Name | Type | Notes |
|----------|--------------|------|-------|
| Ancient Ingredient | `ancient_ingredient` | relationship → Ancient Ingredient | Required |
| Quantity | `quantity` | text | As stated in source |
| Role | `role` | select | base / aromatic / colorant / preservative / other |
| Optional | `optional` | true_false | Is this ingredient optional? |
| Note | `note` | textarea | Any clarification |

#### 2.1.2 Text Segments Repeater

Editorial subdivisions within the primary edition.

| Subfield | Machine Name | Type | Notes |
|----------|--------------|------|-------|
| Segment Label | `segment_label` | text | e.g., "§1", "Wellmann §2" |
| Reference String | `reference_string` | text | e.g., "Diosc. 1.43.1" |
| Page/Line | `segment_page_line` | text | e.g., "p. 78, ll. 3-19" |
| Segment Note | `segment_note` | textarea | e.g., "preparation instructions" |
| TEI XML ID | `tei_xml_id` | text | For future TEI alignment |

#### 2.1.3 Annotations Repeater

Structured commentary on specific portions of text.

| Subfield | Machine Name | Type | Notes |
|----------|--------------|------|-------|
| Anchor Text | `anchor_text` | text | The exact text to annotate |
| Anchor Type | `anchor_type` | select | word / phrase / sentence / passage |
| Occurrence | `occurrence` | number | Which occurrence if anchor appears multiple times (default: 1) |
| Annotation Type | `annotation_type` | select | ingredient / process / tool / philological / editorial / cross-reference / general |
| Title | `annotation_title` | text | Short label |
| Content | `annotation_content` | wysiwyg | Full annotation |
| Linked Ancient Ingredient | `linked_ancient_ingredient` | relationship → Ancient Ingredient | Optional |
| Linked Process | `linked_process` | relationship → Process | Optional |
| Linked Tool | `linked_tool` | relationship → Tool | Optional |
| Linked Recipe | `linked_recipe` | relationship → Recipe | For cross-references |
| Linked Work | `linked_work` | relationship → Work | For citations |

#### 2.1.4 TEI Anchors Repeater

For linking to external TEI editions.

| Subfield | Machine Name | Type | Notes |
|----------|--------------|------|-------|
| TEI Label | `tei_label` | text | e.g., "Wellmann", "Sprengel" |
| TEI Source URL | `tei_source_url` | url | URL to TEI file |
| TEI XML ID | `tei_anchor_xml_id` | text | The xml:id in the TEI source |
| TEI Citation | `tei_citation` | text | Human-readable citation |
| Note | `tei_anchor_note` | textarea | What this alignment represents |

---

### 2.2 Work

All authoritative texts: ancient works, editions, translations, scholarship.

| Field | Machine Name | Type | Required | Notes |
|-------|--------------|------|----------|-------|
| Title | `title` | text | yes | e.g., "De materia medica" or "Wellmann (1907)" |
| URN | `urn` | text | auto | Generated on publish |
| Author | `author` | relationship → Person | no | Allows anonymous works |
| Work Type | `work_type` | select | yes | See §2.2.1 |
| Parent Work | `parent_work` | relationship → Work | no | For editions/translations, links to ancient text |
| Date | `date` | text | no | e.g., "1st century CE" or "1907" |
| Date Sort | `date_sort` | number | no | For chronological sorting (e.g., 50, 1907) |
| Language | `language` | taxonomy → Language | yes | |
| Place | `place` | taxonomy → Place | no | |
| Description | `description` | wysiwyg | no | About this work |
| Reference System | `reference_system` | text | no | e.g., "book.chapter" — how citations work |
| Includes Commentary | `includes_commentary` | true_false | no | |
| Includes Translation | `includes_translation` | true_false | no | |
| Citation | `citation` | textarea | no | Full formatted citation |
| Short Reference | `short_ref` | text | no | e.g., "Manniche 1999" |
| DOI or URL | `doi_url` | url | no | |
| Zotero Key | `zotero_key` | text | no | For future Zotero sync |
| Notes | `notes` | textarea | no | |

#### 2.2.1 Work Type Options

| Value | Label | Examples |
|-------|-------|----------|
| `ancient_text` | Ancient Text | De materia medica, Natural History |
| `edition` | Edition | Wellmann (1907), Sprengel (1829) |
| `translation` | Translation | Beck (2005) |
| `commentary` | Commentary | Standalone commentary |
| `monograph` | Monograph | Brun (2000), Manniche (1999) |
| `article` | Article | Journal articles |
| `chapter` | Chapter | Book chapters |
| `lexicon` | Lexicon | LSJ, André's lexicon |
| `thesis` | Thesis | Dissertations |

---

### 2.3 Person

All people: ancient authors, modern scholars, team members, attributed figures.

| Field | Machine Name | Type | Required | Notes |
|-------|--------------|------|----------|-------|
| Name | `title` | text | yes | WordPress native title |
| URN | `urn` | text | auto | Generated on publish |
| Sort Name | `sort_name` | text | no | For alphabetical sorting |
| Floruit | `floruit` | text | no | e.g., "1st century CE", "fl. 50 CE" |
| Birth/Death | `birth_death` | text | no | e.g., "1867–1942" for modern scholars |
| Place | `place` | taxonomy → Place | no | Associated place |
| Is Team Member | `is_team_member` | true_false | no | Generates Staff page |
| Is Historical | `is_historical` | true_false | no | Appears in prosopography |
| Role | `role` | text | no | For team members: "Principal Investigator" etc. |
| Bio | `bio` | wysiwyg | no | |
| Image | `image` | image | no | Portrait, ancient depiction |
| Email | `email` | email | no | For team members |
| Website | `website` | url | no | |
| ORCID | `orcid` | text | no | |
| External Links | `external_links` | repeater | no | See §2.3.1 |
| Notes | `notes` | textarea | no | |

#### 2.3.1 External Links Repeater

| Subfield | Machine Name | Type | Notes |
|----------|--------------|------|-------|
| Label | `link_label` | text | e.g., "Wikipedia", "VIAF" |
| URL | `link_url` | url | |

---

### 2.4 Ancient Ingredient

A term as it appears in ancient texts. The philological hub.

| Field | Machine Name | Type | Required | Notes |
|-------|--------------|------|----------|-------|
| Name | `title` | text | yes | The term (e.g., "σμύρνα", "ʿntyw") |
| URN | `urn` | text | auto | Generated on publish |
| Language | `language` | taxonomy → Language | yes | |
| Transliteration | `transliteration` | text | no | e.g., "smyrna" |
| Description | `description` | wysiwyg | no | What ancient sources say about it |
| Grammatical Notes | `grammatical_notes` | textarea | no | |
| Parent Term | `parent_term` | relationship → Ancient Ingredient | no | For specificity (kind of) |
| Part Of | `part_of` | relationship → Ancient Ingredient | no | For mereology |
| Derived From | `derived_from` | relationship → Ancient Ingredient | no | For products of processing |
| Ancient References | `ancient_references` | repeater | no | See §2.4.1 |
| Notes | `notes` | textarea | no | |

#### 2.4.1 Ancient References Repeater

What ancient authors said about this ingredient.

| Subfield | Machine Name | Type | Notes |
|----------|--------------|------|-------|
| Source | `ref_source` | text | e.g., "Theophrastus, HP 9.4" |
| Text | `ref_text` | textarea | Original language |
| Translation | `ref_translation` | textarea | English |

---

### 2.5 Identification

A scholarly claim linking an ancient term to a modern material. The central innovation.

| Field | Machine Name | Type | Required | Notes |
|-------|--------------|------|----------|-------|
| Title | `title` | text | auto | Auto-generated: "[Ancient Ingredient] → [Product/Source] (Work)" |
| URN | `urn` | text | auto | Generated on publish |
| Ancient Ingredient | `ancient_ingredient` | relationship → Ancient Ingredient | yes | The term being identified |
| Ingredient Product | `ingredient_product` | relationship → Ingredient Product | no | What it's identified as |
| Material Source | `material_source` | relationship → Material Source | no | Alternative/additional target |
| Source Work | `source_work` | relationship → Work | yes | The scholarly source |
| Locator | `locator` | text | no | Page, line, section — where in the Work |
| Confidence | `confidence` | select | yes | established / probable / speculative |
| Notes | `notes` | textarea | no | Any clarification |

**Validation:** At least one of `ingredient_product` or `material_source` must be set.

**Auto-title logic:** On save, generate title from linked entities:
```
σμύρνα → Myrrh resin (Manniche 1999)
```

---

### 2.6 Ingredient Product

A modern interpretive category. The bridge between ancient term and material source. Scent lives here.

| Field | Machine Name | Type | Required | Notes |
|-------|--------------|------|----------|-------|
| Name | `title` | text | yes | e.g., "Myrrh resin", "Rose oil" |
| URN | `urn` | text | auto | Generated on publish |
| Description | `description` | wysiwyg | no | |
| Parent Product | `parent_product` | relationship → Ingredient Product | no | For hierarchy |
| Derived From Product | `derived_from_product` | relationship → Ingredient Product | no | For processing chains |
| Linked Material Sources | `linked_material_sources` | relationship → Material Source | yes | Multi-select |
| Part Used | `part_used` | select | no | See §2.6.1 |
| Processing | `processing` | text | no | e.g., "steam distilled", "cold pressed" |
| Scent Profile | `scent_profile` | group | no | See §2.6.2 |
| Image | `image` | image | no | The product itself |
| Image Credit | `image_credit` | text | no | |
| Availability | `availability` | select | no | available / rare / extinct / uncertain |
| Sourcing Notes | `sourcing_notes` | textarea | no | Where to obtain |
| Notes | `notes` | textarea | no | |

#### 2.6.1 Part Used Options

| Value | Label |
|-------|-------|
| `resin` | Resin |
| `flower` | Flower |
| `leaf` | Leaf |
| `root` | Root / Rhizome |
| `seed` | Seed |
| `wood` | Wood |
| `bark` | Bark |
| `fruit` | Fruit |
| `whole` | Whole plant |
| `oil` | Oil / Fat |
| `other` | Other |

#### 2.6.2 Scent Profile Group

| Subfield | Machine Name | Type | Notes |
|----------|--------------|------|-------|
| Scent Family | `scent_family` | taxonomy → Scent Family | Hierarchical |
| Primary Notes | `primary_notes` | repeater | See §2.6.3 |
| Secondary Notes | `secondary_notes` | textarea | |
| Evolution | `evolution` | textarea | How scent changes over time |
| Comparable To | `comparable_to` | textarea | "Drier than labdanum..." |
| Full Description | `full_description` | wysiwyg | Evocative prose |

#### 2.6.3 Primary Notes Repeater

| Subfield | Machine Name | Type | Notes |
|----------|--------------|------|-------|
| Note | `note` | text | e.g., "balsamic", "woody" |
| Intensity | `intensity` | select | dominant / moderate / subtle |

---

### 2.7 Material Source

The scientific foundation. Natural kinds — plants, minerals, animals.

| Field | Machine Name | Type | Required | Notes |
|-------|--------------|------|----------|-------|
| Name | `title` | text | yes | Common name |
| URN | `urn` | text | auto | Generated on publish |
| Binomial | `binomial` | text | no | Scientific name (Commiphora myrrha) |
| Material Type | `material_type` | select | yes | plant / mineral / animal / other |
| Family | `family` | text | no | Botanical/zoological family |
| Description | `description` | wysiwyg | no | |
| Native Range | `native_range` | textarea | no | Where it grows/occurs |
| Place | `place` | taxonomy → Place | no | Associated places |
| Image | `image` | image | no | The source organism/material |
| Image Credit | `image_credit` | text | no | |
| External Links | `external_links` | repeater | no | See §2.7.1 |
| Notes | `notes` | textarea | no | |

#### 2.7.1 External Links Repeater

| Subfield | Machine Name | Type | Notes |
|----------|--------------|------|-------|
| Label | `link_label` | text | e.g., "Kew Plants of the World" |
| URL | `link_url` | url | |

---

### 2.8 Process

A technique used in recipes.

| Field | Machine Name | Type | Required | Notes |
|-------|--------------|------|----------|-------|
| Name | `title` | text | yes | e.g., "Enfleurage" |
| URN | `urn` | text | auto | Generated on publish |
| Greek Term | `greek_term` | text | no | e.g., "ἐξιποῦν" |
| Latin Term | `latin_term` | text | no | |
| Transliteration | `transliteration` | text | no | |
| Description | `description` | wysiwyg | yes | Full explanation |
| Variations | `variations` | repeater | no | See §2.8.1 |
| Interpretation Notes | `interpretation_notes` | wysiwyg | no | Scholarly discussion |
| Image | `image` | image | no | |
| Image Credit | `image_credit` | text | no | |
| Bibliography | `bibliography` | relationship → Work | no | Multi-select |
| Notes | `notes` | textarea | no | |

#### 2.8.1 Variations Repeater

| Subfield | Machine Name | Type | Notes |
|----------|--------------|------|-------|
| Name | `variation_name` | text | e.g., "Cold enfleurage" |
| Description | `variation_description` | textarea | |

---

### 2.9 Tool

Implements used in recipes.

| Field | Machine Name | Type | Required | Notes |
|-------|--------------|------|----------|-------|
| Name | `title` | text | yes | e.g., "Kratēr" |
| URN | `urn` | text | auto | Generated on publish |
| Greek Term | `greek_term` | text | no | e.g., "κρατήρ" |
| Latin Term | `latin_term` | text | no | |
| Transliteration | `transliteration` | text | no | |
| Description | `description` | wysiwyg | yes | |
| Material | `material` | text | no | What it's made of |
| Interpretation Notes | `interpretation_notes` | wysiwyg | no | Scholarly discussion |
| Image | `image` | image | no | |
| Image Credit | `image_credit` | text | no | |
| Bibliography | `bibliography` | relationship → Work | no | Multi-select |
| Notes | `notes` | textarea | no | |

---

### 2.10 Replication Story

A narrative account of experimental work.

| Field | Machine Name | Type | Required | Notes |
|-------|--------------|------|----------|-------|
| Title | `title` | text | yes | |
| URN | `urn` | text | auto | Generated on publish |
| Linked Recipes | `linked_recipes` | relationship → Recipe | no | Multi-select |
| Summary | `summary` | textarea | yes | Short description for cards |
| Content | `content` | wysiwyg | yes | Full narrative |
| Team Members | `team_members` | relationship → Person | no | Filter: is_team_member = true |
| Date | `date` | date_picker | no | When work was done |
| Gallery | `gallery` | gallery | no | Photos, video stills |
| Status | `status` | select | no | ongoing / completed |
| Notes | `notes` | textarea | no | |

---

### 2.11 Event

| Field | Machine Name | Type | Required | Notes |
|-------|--------------|------|----------|-------|
| Title | `title` | text | yes | |
| Date | `event_date` | date_picker | yes | |
| End Date | `event_end_date` | date_picker | no | |
| Location | `location` | text | no | |
| Description | `description` | wysiwyg | no | |
| Image | `image` | image | no | |

---

### 2.12 News

| Field | Machine Name | Type | Required | Notes |
|-------|--------------|------|----------|-------|
| Title | `title` | text | yes | |
| Date | `news_date` | date_picker | yes | |
| Content | `content` | wysiwyg | yes | |
| Image | `image` | image | no | |

---

## 3. Taxonomies

### 3.1 Taxonomy Overview

| Taxonomy | Slug | Hierarchical | Applies To |
|----------|------|--------------|------------|
| Period | `period` | No | Recipe, Person, Work |
| Place | `place` | Yes | Recipe, Work, Person, Material Source |
| Language | `language` | No | Recipe, Work, Ancient Ingredient |
| Scent Family | `scent_family` | Yes | Ingredient Product |

### 3.2 Period Terms

| Term | Approximate Dates |
|------|-------------------|
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

### 3.3 Place Terms (Top Level)

- Egypt
- Mesopotamia
- Levant
- Anatolia
- Greece
- Rome / Italy
- Arabia
- India
- North Africa
- Persia

### 3.4 Language Terms

- Greek
- Latin
- Egyptian (Hieroglyphic / Demotic / Coptic)
- Akkadian
- Hebrew
- Arabic
- Other

### 3.5 Scent Family Taxonomy (Hierarchical)

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

## 4. URN System

### 4.1 Format

```
urn:aos:<cpt_slug>:<post_slug>
```

### 4.2 Examples

| Entity | URN |
|--------|-----|
| Recipe | `urn:aos:recipe:rose-perfume-dioscorides` |
| Work | `urn:aos:work:wellmann-1907` |
| Person | `urn:aos:person:dioscorides` |
| Ancient Ingredient | `urn:aos:ancient-ingredient:smyrna` |
| Identification | `urn:aos:identification:smyrna-myrrh-resin-manniche-1999` |
| Ingredient Product | `urn:aos:ingredient-product:myrrh-resin` |
| Material Source | `urn:aos:material-source:commiphora-myrrha` |
| Process | `urn:aos:process:enfleurage` |
| Tool | `urn:aos:tool:krater` |

### 4.3 Generation Logic

On `save_post` hook:
1. Check if URN field is empty
2. Generate URN from CPT slug and post slug
3. Save to `urn` ACF field (read-only in admin)

```php
function aos_generate_urn($post_id) {
    $post = get_post($post_id);
    $cpt = $post->post_type;
    $slug = $post->post_name;
    
    // Map CPT to URN namespace
    $cpt_map = [
        'recipe' => 'recipe',
        'work' => 'work',
        'person' => 'person',
        'ancient_ingredient' => 'ancient-ingredient',
        'identification' => 'identification',
        'ingredient_product' => 'ingredient-product',
        'material_source' => 'material-source',
        'process' => 'process',
        'tool' => 'tool',
        'replication_story' => 'replication-story',
    ];
    
    if (isset($cpt_map[$cpt])) {
        $urn = "urn:aos:{$cpt_map[$cpt]}:{$slug}";
        update_field('urn', $urn, $post_id);
    }
}
add_action('save_post', 'aos_generate_urn');
```

### 4.4 Resolution

Custom rewrite rule:

```
/id/<cpt>/<slug> → 303 redirect to canonical URL
```

With content negotiation:
- `Accept: text/html` → redirect to page
- `Accept: application/ld+json` → return JSON-LD
- `?format=jsonld` → return JSON-LD

```php
function aos_urn_resolver() {
    add_rewrite_rule(
        '^id/([^/]+)/([^/]+)/?$',
        'index.php?aos_resolve_cpt=$matches[1]&aos_resolve_slug=$matches[2]',
        'top'
    );
}
add_action('init', 'aos_urn_resolver');

function aos_handle_urn_resolution() {
    $cpt = get_query_var('aos_resolve_cpt');
    $slug = get_query_var('aos_resolve_slug');
    
    if ($cpt && $slug) {
        // Map URL namespace to CPT
        $cpt_map = [
            'recipe' => 'recipe',
            'work' => 'work',
            'person' => 'person',
            'ancient-ingredient' => 'ancient_ingredient',
            'identification' => 'identification',
            'ingredient-product' => 'ingredient_product',
            'material-source' => 'material_source',
            'process' => 'process',
            'tool' => 'tool',
            'replication-story' => 'replication_story',
        ];
        
        $post_type = $cpt_map[$cpt] ?? null;
        if (!$post_type) return;
        
        $post = get_page_by_path($slug, OBJECT, $post_type);
        if (!$post) {
            status_header(404);
            exit;
        }
        
        // Content negotiation
        $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
        $format = $_GET['format'] ?? null;
        
        if ($format === 'jsonld' || strpos($accept, 'application/ld+json') !== false) {
            header('Content-Type: application/ld+json');
            echo aos_generate_jsonld($post);
            exit;
        }
        
        // Default: 303 redirect
        wp_redirect(get_permalink($post), 303);
        exit;
    }
}
add_action('template_redirect', 'aos_handle_urn_resolution');
```

---

## 5. JSON-LD Output

### 5.1 Recipe

```json
{
  "@context": {
    "@vocab": "https://schema.org/",
    "aos": "https://alchemiesofscent.org/ns/"
  },
  "@type": "CreativeWork",
  "@id": "urn:aos:recipe:rose-perfume-dioscorides",
  "name": "Rose Perfume (Dioscorides)",
  "inLanguage": "grc",
  "aos:sourceWork": {
    "@id": "urn:aos:work:wellmann-1907",
    "name": "Wellmann (1907)"
  },
  "aos:citation": "1.43",
  "aos:originalText": "ῥοδίνου σκευασία...",
  "aos:translation": "Preparation of rose oil...",
  "aos:ingredients": [
    {
      "@type": "aos:RecipeIngredient",
      "aos:ancientIngredient": {
        "@id": "urn:aos:ancient-ingredient:skhoinos"
      },
      "aos:quantity": "5 lbs 8 oz",
      "aos:role": "aromatic"
    }
  ],
  "aos:processes": [
    {"@id": "urn:aos:process:enfleurage"}
  ],
  "aos:tools": [
    {"@id": "urn:aos:tool:krater"}
  ],
  "dateModified": "2026-01-08",
  "license": "https://creativecommons.org/licenses/by/4.0/"
}
```

### 5.2 Ancient Ingredient

```json
{
  "@context": {
    "@vocab": "https://schema.org/",
    "aos": "https://alchemiesofscent.org/ns/"
  },
  "@type": "aos:AncientIngredient",
  "@id": "urn:aos:ancient-ingredient:smyrna",
  "name": "σμύρνα",
  "aos:transliteration": "smyrna",
  "aos:language": "Greek",
  "aos:identifications": [
    {"@id": "urn:aos:identification:smyrna-myrrh-resin-manniche-1999"},
    {"@id": "urn:aos:identification:smyrna-opopanax-tucker-1986"}
  ],
  "dateModified": "2026-01-08"
}
```

### 5.3 Identification

```json
{
  "@context": {
    "@vocab": "https://schema.org/",
    "aos": "https://alchemiesofscent.org/ns/"
  },
  "@type": "aos:Identification",
  "@id": "urn:aos:identification:smyrna-myrrh-resin-manniche-1999",
  "aos:ancientIngredient": {
    "@id": "urn:aos:ancient-ingredient:smyrna"
  },
  "aos:ingredientProduct": {
    "@id": "urn:aos:ingredient-product:myrrh-resin"
  },
  "aos:sourceWork": {
    "@id": "urn:aos:work:manniche-1999",
    "name": "Manniche (1999)"
  },
  "aos:locator": "pp. 45-47",
  "aos:confidence": "established",
  "dateModified": "2026-01-08"
}
```

### 5.4 Ingredient Product

```json
{
  "@context": {
    "@vocab": "https://schema.org/",
    "aos": "https://alchemiesofscent.org/ns/"
  },
  "@type": "aos:IngredientProduct",
  "@id": "urn:aos:ingredient-product:myrrh-resin",
  "name": "Myrrh resin",
  "aos:materialSources": [
    {"@id": "urn:aos:material-source:commiphora-myrrha"}
  ],
  "aos:partUsed": "resin",
  "aos:scentProfile": {
    "aos:scentFamily": "Resinous > Balsamic",
    "aos:primaryNotes": [
      {"aos:note": "balsamic", "aos:intensity": "dominant"},
      {"aos:note": "warm", "aos:intensity": "moderate"},
      {"aos:note": "slightly bitter", "aos:intensity": "subtle"}
    ],
    "aos:evolution": "Opens sharp and medicinal, softens to warm amber"
  },
  "aos:availability": "available",
  "dateModified": "2026-01-08"
}
```

### 5.5 Person

```json
{
  "@context": {
    "@vocab": "https://schema.org/",
    "aos": "https://alchemiesofscent.org/ns/"
  },
  "@type": "Person",
  "@id": "urn:aos:person:dioscorides",
  "name": "Dioscorides",
  "aos:floruit": "1st century CE",
  "aos:isHistorical": true,
  "sameAs": [
    "https://viaf.org/viaf/78822798",
    "https://en.wikipedia.org/wiki/Pedanius_Dioscorides"
  ],
  "dateModified": "2026-01-08"
}
```

---

## 6. CSV Import Schemas

### 6.1 Recipe Import

| Column | Maps To | Required | Notes |
|--------|---------|----------|-------|
| `title` | title | yes | |
| `source_work_slug` | source_work | yes | Slug of existing Work |
| `citation` | citation | yes | |
| `page_line` | page_line | no | |
| `attributed_to_slug` | attributed_to | no | Slug of existing Person |
| `attributed_work_slug` | attributed_work | no | Slug of existing Work |
| `attribution_note` | attribution_note | no | |
| `original_text` | original_text | yes | |
| `original_language` | original_language | yes | Taxonomy term slug |
| `translation` | translation | yes | |
| `translator` | translator | no | |
| `transmission_notes` | transmission_notes | no | |
| `period` | period | no | Taxonomy term slug |
| `place` | place | no | Taxonomy term slug |
| `notes` | notes | no | |

**Note:** Ingredients, processes, tools, and annotations are added manually after import.

### 6.2 Work Import

| Column | Maps To | Required | Notes |
|--------|---------|----------|-------|
| `title` | title | yes | |
| `author_slug` | author | no | Slug of existing Person |
| `work_type` | work_type | yes | |
| `parent_work_slug` | parent_work | no | Slug of existing Work |
| `date` | date | no | |
| `date_sort` | date_sort | no | |
| `language` | language | yes | Taxonomy term slug |
| `place` | place | no | Taxonomy term slug |
| `description` | description | no | |
| `reference_system` | reference_system | no | |
| `includes_commentary` | includes_commentary | no | 1 or 0 |
| `includes_translation` | includes_translation | no | 1 or 0 |
| `citation` | citation | no | |
| `short_ref` | short_ref | no | |
| `doi_url` | doi_url | no | |
| `zotero_key` | zotero_key | no | |

### 6.3 Person Import

| Column | Maps To | Required | Notes |
|--------|---------|----------|-------|
| `name` | title | yes | |
| `sort_name` | sort_name | no | |
| `floruit` | floruit | no | |
| `birth_death` | birth_death | no | |
| `place` | place | no | Taxonomy term slug |
| `is_team_member` | is_team_member | no | 1 or 0 |
| `is_historical` | is_historical | no | 1 or 0 |
| `role` | role | no | |
| `bio` | bio | no | |
| `email` | email | no | |
| `website` | website | no | |
| `orcid` | orcid | no | |

### 6.4 Ancient Ingredient Import

| Column | Maps To | Required | Notes |
|--------|---------|----------|-------|
| `name` | title | yes | The term |
| `language` | language | yes | Taxonomy term slug |
| `transliteration` | transliteration | no | |
| `description` | description | no | |
| `grammatical_notes` | grammatical_notes | no | |
| `parent_term_slug` | parent_term | no | Slug of existing Ancient Ingredient |
| `part_of_slug` | part_of | no | Slug of existing Ancient Ingredient |
| `derived_from_slug` | derived_from | no | Slug of existing Ancient Ingredient |

### 6.5 Identification Import

| Column | Maps To | Required | Notes |
|--------|---------|----------|-------|
| `ancient_ingredient_slug` | ancient_ingredient | yes | |
| `ingredient_product_slug` | ingredient_product | no | At least one required |
| `material_source_slug` | material_source | no | At least one required |
| `source_work_slug` | source_work | yes | |
| `locator` | locator | no | |
| `confidence` | confidence | yes | established / probable / speculative |
| `notes` | notes | no | |

### 6.6 Ingredient Product Import

| Column | Maps To | Required | Notes |
|--------|---------|----------|-------|
| `name` | title | yes | |
| `description` | description | no | |
| `parent_product_slug` | parent_product | no | |
| `derived_from_product_slug` | derived_from_product | no | |
| `material_sources` | linked_material_sources | yes | Comma-separated slugs |
| `part_used` | part_used | no | |
| `processing` | processing | no | |
| `availability` | availability | no | |
| `sourcing_notes` | sourcing_notes | no | |

**Note:** Scent profiles are added manually.

### 6.7 Material Source Import

| Column | Maps To | Required | Notes |
|--------|---------|----------|-------|
| `name` | title | yes | Common name |
| `binomial` | binomial | no | |
| `material_type` | material_type | yes | plant / mineral / animal / other |
| `family` | family | no | |
| `description` | description | no | |
| `native_range` | native_range | no | |
| `place` | place | no | Taxonomy term slug |

---

## 7. Import Handler Logic

### 7.1 General Import Flow

```php
function aos_import_csv($file_path, $cpt, $field_map) {
    $handle = fopen($file_path, 'r');
    $headers = fgetcsv($handle);
    
    $results = ['created' => 0, 'updated' => 0, 'errors' => []];
    
    while (($row = fgetcsv($handle)) !== false) {
        $data = array_combine($headers, $row);
        
        try {
            $post_id = aos_import_row($data, $cpt, $field_map);
            $results['created']++;
        } catch (Exception $e) {
            $results['errors'][] = $e->getMessage();
        }
    }
    
    fclose($handle);
    return $results;
}
```

### 7.2 Relationship Resolution

For fields that reference other posts by slug:

```php
function aos_resolve_relationship($slug, $post_type) {
    if (empty($slug)) return null;
    
    $post = get_page_by_path($slug, OBJECT, $post_type);
    if (!$post) {
        throw new Exception("Could not find {$post_type} with slug: {$slug}");
    }
    
    return $post->ID;
}
```

### 7.3 Multi-Value Relationships

For comma-separated slugs:

```php
function aos_resolve_multi_relationship($slugs_string, $post_type) {
    if (empty($slugs_string)) return [];
    
    $slugs = array_map('trim', explode(',', $slugs_string));
    $ids = [];
    
    foreach ($slugs as $slug) {
        $id = aos_resolve_relationship($slug, $post_type);
        if ($id) $ids[] = $id;
    }
    
    return $ids;
}
```

### 7.4 Import Order

Due to relationships, import in this order:

1. **Taxonomies** (Period, Place, Language, Scent Family)
2. **Person** (no dependencies)
3. **Work** (depends on Person, self-referential via parent_work)
4. **Material Source** (depends on Place taxonomy)
5. **Ingredient Product** (depends on Material Source, self-referential)
6. **Ancient Ingredient** (depends on Language taxonomy, self-referential)
7. **Identification** (depends on Ancient Ingredient, Ingredient Product, Material Source, Work)
8. **Process** (depends on Work for bibliography)
9. **Tool** (depends on Work for bibliography)
10. **Recipe** (depends on Work, Person, Ancient Ingredient, Process, Tool)
11. **Replication Story** (depends on Recipe, Person)

---

## 8. Template Responsibilities

### 8.1 Single Templates

| Template | Key Queries | Key Displays |
|----------|-------------|--------------|
| `single-recipe.php` | Get linked Ancient Ingredients, Processes, Tools, Related Recipes | Text with annotations, ingredient list, process flow |
| `single-work.php` | Get author, parent work, child works (editions/translations), recipes from this work | Work hierarchy, recipe list |
| `single-person.php` | Get works by author, recipes attributed to, replication stories (if team member) | Bio, works list, recipes, experiments |
| `single-ancient_ingredient.php` | Get Identifications for this ingredient, recipes using this ingredient | Ancient references, identification cards, recipe list |
| `single-identification.php` | Get linked Ancient Ingredient, Product, Source, Work | The scholarly claim with full provenance |
| `single-ingredient_product.php` | Get Material Sources, reverse-lookup Identifications, child/parent products | Scent profile, source info, "ancient terms for this" |
| `single-material_source.php` | Get Ingredient Products derived from this source | Scientific info, external links, derived products |
| `single-process.php` | Get recipes using this process | Description, variations, recipe list |
| `single-tool.php` | Get recipes using this tool | Description, interpretation, recipe list |
| `single-replication_story.php` | Get linked recipes, team members | Narrative, gallery, recipe links |

### 8.2 Archive Templates

| Template | Filters | Sort Options |
|----------|---------|--------------|
| `archive-recipe.php` | Period, Place, Ingredient (via Identification), Process, Source Work | Date, Title, Source |
| `archive-work.php` | Work Type, Language, Period | Date, Title, Author |
| `archive-person.php` | Is Historical, Is Team Member, Place | Name, Floruit |
| `archive-ancient_ingredient.php` | Language | Name, Transliteration |
| `archive-ingredient_product.php` | Scent Family, Availability, Part Used | Name |
| `archive-material_source.php` | Material Type, Place | Name, Binomial |
| `archive-process.php` | — | Name |
| `archive-tool.php` | — | Name |
| `archive-replication_story.php` | Status | Date, Title |

### 8.3 Reverse Lookups

Key queries that run on single templates:

**Ancient Ingredient → Identifications:**
```php
$identifications = get_posts([
    'post_type' => 'identification',
    'meta_query' => [
        [
            'key' => 'ancient_ingredient',
            'value' => $post->ID,
            'compare' => '='
        ]
    ]
]);
```

**Ingredient Product → Identifications (reverse):**
```php
$identifications = get_posts([
    'post_type' => 'identification',
    'meta_query' => [
        [
            'key' => 'ingredient_product',
            'value' => $post->ID,
            'compare' => '='
        ]
    ]
]);
```

**Person → Works authored:**
```php
$works = get_posts([
    'post_type' => 'work',
    'meta_query' => [
        [
            'key' => 'author',
            'value' => $post->ID,
            'compare' => '='
        ]
    ]
]);
```

**Work → Recipes using this source:**
```php
$recipes = get_posts([
    'post_type' => 'recipe',
    'meta_query' => [
        [
            'key' => 'source_work',
            'value' => $post->ID,
            'compare' => '='
        ]
    ]
]);
```

---

## 9. ACF Field Group Organization

### 9.1 Recommended Field Groups

| Group Name | CPT | Fields |
|------------|-----|--------|
| Recipe: Core | recipe | source_work, citation, page_line, original_text, original_language, translation, translator |
| Recipe: Attribution | recipe | attributed_to, attributed_work, attribution_note |
| Recipe: Relationships | recipe | ingredients (repeater), processes, tools, related_recipes |
| Recipe: Editorial | recipe | text_segments (repeater), annotations (repeater), tei_anchors (repeater), transmission_notes |
| Recipe: Meta | recipe | urn, period, place, notes |
| Work: Core | work | author, work_type, parent_work, date, date_sort, language, place |
| Work: Content | work | description, reference_system |
| Work: Flags | work | includes_commentary, includes_translation |
| Work: Citation | work | citation, short_ref, doi_url, zotero_key |
| Work: Meta | work | urn, notes |
| Person: Core | person | sort_name, floruit, birth_death, place |
| Person: Flags | person | is_team_member, is_historical |
| Person: Team | person | role, email, website, orcid (conditional: is_team_member = true) |
| Person: Content | person | bio, image, external_links (repeater) |
| Person: Meta | person | urn, notes |
| Ancient Ingredient: Core | ancient_ingredient | language, transliteration, description, grammatical_notes |
| Ancient Ingredient: Relationships | ancient_ingredient | parent_term, part_of, derived_from |
| Ancient Ingredient: References | ancient_ingredient | ancient_references (repeater) |
| Ancient Ingredient: Meta | ancient_ingredient | urn, notes |
| Identification: Core | identification | ancient_ingredient, ingredient_product, material_source |
| Identification: Provenance | identification | source_work, locator, confidence |
| Identification: Meta | identification | urn, notes |
| Ingredient Product: Core | ingredient_product | description, parent_product, derived_from_product, linked_material_sources, part_used, processing |
| Ingredient Product: Scent | ingredient_product | scent_profile (group) |
| Ingredient Product: Availability | ingredient_product | availability, sourcing_notes |
| Ingredient Product: Media | ingredient_product | image, image_credit |
| Ingredient Product: Meta | ingredient_product | urn, notes |
| Material Source: Core | material_source | binomial, material_type, family, description, native_range, place |
| Material Source: Media | material_source | image, image_credit |
| Material Source: Links | material_source | external_links (repeater) |
| Material Source: Meta | material_source | urn, notes |

---

## 10. Theme File Structure

```
theme/
├── functions.php
├── style.css
├── theme.json
│
├── inc/
│   ├── cpt-registration.php          # All CPT definitions
│   ├── taxonomies.php                 # All taxonomy definitions
│   ├── acf-field-groups/
│   │   ├── recipe.php
│   │   ├── work.php
│   │   ├── person.php
│   │   ├── ancient-ingredient.php
│   │   ├── identification.php
│   │   ├── ingredient-product.php
│   │   ├── material-source.php
│   │   ├── process.php
│   │   ├── tool.php
│   │   ├── replication-story.php
│   │   └── supporting.php            # Event, News
│   ├── urn-resolver.php
│   ├── jsonld-output.php
│   ├── import-handler.php
│   ├── export-handler.php
│   ├── admin-columns.php             # Admin Columns Pro config
│   └── query-modifications.php       # Custom archive queries
│
├── templates/
│   ├── front-page.html
│   ├── archive.html
│   ├── single.html
│   ├── single-recipe.html
│   ├── single-work.html
│   ├── single-person.html
│   ├── single-ancient_ingredient.html
│   ├── single-identification.html
│   ├── single-ingredient_product.html
│   ├── single-material_source.html
│   ├── single-process.html
│   ├── single-tool.html
│   ├── single-replication_story.html
│   ├── archive-recipe.html
│   ├── archive-work.html
│   ├── archive-person.html
│   ├── archive-ancient_ingredient.html
│   ├── archive-ingredient_product.html
│   ├── archive-material_source.html
│   ├── archive-process.html
│   ├── archive-tool.html
│   ├── archive-replication_story.html
│   ├── page-team.html                # Staff listing (is_team_member)
│   ├── page-people.html              # Prosopography (is_historical)
│   └── search.html
│
├── parts/
│   ├── header.html
│   ├── footer.html
│   ├── navigation.html
│   ├── recipe-card.html
│   ├── ingredient-card.html
│   ├── identification-card.html
│   ├── work-card.html
│   ├── person-card.html
│   ├── scent-profile.html
│   ├── annotation-panel.html
│   └── urn-citation.html
│
├── assets/
│   ├── css/
│   │   ├── base.css
│   │   ├── typography.css
│   │   ├── recipe.css
│   │   ├── ingredients.css
│   │   ├── annotations.css
│   │   └── scent-profile.css
│   └── js/
│       ├── annotations.js
│       ├── filters.js
│       └── copy-citation.js
│
└── languages/
    └── aos.pot
```

---

## 11. Performance Considerations

### 11.1 Relationship Query Optimization

ACF relationship fields store post IDs in serialized arrays. For reverse lookups, consider:

1. **Index meta values** — Use a plugin or custom code to maintain a lookup table
2. **Cache expensive queries** — Use transients for "recipes using this ingredient" type queries
3. **Limit relationship fields** — Use `post__in` to limit selectable posts in admin

### 11.2 Repeater Performance

Deeply nested repeaters (annotations with multiple sub-relationships) can slow page loads. Strategies:

1. **Lazy load annotations** — Load on click, not on page load
2. **Limit repeater rows** — Set reasonable maximums
3. **Consider Custom Tables** — For very high-volume data (post-MVP)

### 11.3 Archive Query Optimization

For filtered archives:

1. **Use taxonomy queries** where possible (faster than meta queries)
2. **Pre-calculate filter counts** — Cache the number of recipes per ingredient
3. **Paginate aggressively** — 20-30 items per page maximum

---

## 12. Validation Rules

### 12.1 Identification

- At least one of `ingredient_product` or `material_source` must be set
- `confidence` must be one of: established, probable, speculative
- `ancient_ingredient` and `source_work` are required

### 12.2 Recipe

- `source_work` must be set
- `original_text` and `translation` must not be empty
- At least one ingredient in the `ingredients` repeater

### 12.3 Work

- If `work_type` is edition, translation, or commentary, `parent_work` should be set
- `language` is required

### 12.4 Person

- If `is_team_member` is true, `role` should be set
- At least one of `is_team_member` or `is_historical` should be true

---

**Document version:** 1.0  
**Last updated:** 8 January 2026
