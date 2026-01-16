/*
 * TEMPORARY legacy support.
 *
 * These fixtures exist only to keep legacy hardcoded routes/pages working after removing the bundled seed.json.
 * Canonical runtime data is loaded from `public/data/seed.json` via `src/storage.ts`.
 *
 * Remove this file once legacy routes redirect to canonical DB-driven pages.
 */

export const INGREDIENT_DATA = {
  "term": "σμύρνα",
  "transliteration": "smyrna",
  "language": "Greek",
  "urn": "urn:aos:ancient-ingredient:smyrna",
  "quotes": [
    {
      "author": "Dioscorides, Mat. Med. 1.77",
      "text": "The best is that from Troglodytice, pale, somewhat greenish, with a certain oiliness, smooth, and pure."
    }
  ],
  "identifications": [
    {
      "id": "id1",
      "name": "Myrrh resin",
      "source": "Commiphora myrrha",
      "citation": "Manniche (1999), pp. 45-47",
      "confidence": "established",
      "linkRoute": "product_myrrh",
      "claimRoute": "identification_smyrna"
    },
    {
      "id": "id2",
      "name": "Opopanax resin",
      "source": "Commiphora guidottii",
      "citation": "Tucker (1986), p. 234",
      "confidence": "probable",
      "note": "Note: 'Sweet myrrh' or 'bisabol myrrh' may refer to this species.",
      "linkRoute": "product_myrrh"
    }
  ]
} as const;

export const IDENTIFICATION_DATA = {
  "urn": "urn:aos:identification:smyrna-myrrh-resin-manniche-1999",
  "ancientTerm": {
    "name": "σμύρνα (smyrna)",
    "route": "ingredient_smyrna"
  },
  "identifiedAs": {
    "name": "Myrrh resin",
    "route": "product_myrrh"
  },
  "materialSource": {
    "name": "Commiphora myrrha",
    "route": "source_commiphora"
  },
  "confidence": "established",
  "source": {
    "citation": "Manniche, L. (1999). Sacred Luxuries: Fragrance, Aromatherapy, and Cosmetics in Ancient Egypt. Cornell University Press.",
    "pages": "45-47",
    "urn": "urn:isbn:9780801437205"
  },
  "notes": "This identification is widely accepted in the scholarly literature. Manniche provides extensive botanical and historical evidence for the equation of Greek σμύρνα with the resin of Commiphora myrrha."
} as const;

export const PRODUCT_DATA = {
  "name": "Myrrh Resin",
  "urn": "urn:aos:ingredient-product:myrrh-resin",
  "description": "Aromatic resin harvested from trees of the genus Commiphora, native to the Horn of Africa and Arabian Peninsula.",
  "family": "Resinous > Balsamic",
  "image": "Image: amber resin tears",
  "imageCaption": "Photo: S. Coughlin",
  "profile": {
    "primary": [
      "Balsamic (dominant)",
      "Warm (moderate)",
      "Slightly bitter (subtle)"
    ],
    "secondary": [
      "Medicinal",
      "Earthy",
      "Faint licorice undertone"
    ],
    "evolution": "Opens sharp and medicinal, almost bitter. Within minutes, softens to a warm, honeyed amber that persists for hours.",
    "comparable": "Drier than labdanum, less sweet than benzoin. Shares balsamic notes with frankincense but darker, more complex, more medicinal."
  },
  "source": {
    "name": "Commiphora myrrha",
    "family": "Burseraceae",
    "part": "Resin",
    "native": "Ethiopia, Somalia, Yemen"
  },
  "ancientTerms": [
    {
      "term": "σμύρνα",
      "language": "Greek",
      "confidence": "established",
      "citation": "Manniche (1999)"
    },
    {
      "term": "ʿntyw",
      "language": "Egyptian",
      "confidence": "probable",
      "citation": "Manniche (1999)"
    },
    {
      "term": "murra",
      "language": "Latin",
      "confidence": "established",
      "citation": "André (1985)"
    }
  ],
  "availability": {
    "status": "Available",
    "details": "Can be sourced from essential oil suppliers and specialty incense vendors. Look for \"Commiphora myrrha\" specifically; other species (C. guidottii, C. erythraea) have different scent profiles."
  }
} as const;

export const COMMIPHORA_DATA = {
  "name": "Commiphora myrrha",
  "commonName": "Myrrh tree",
  "family": "Burseraceae",
  "type": "Plant",
  "urn": "urn:aos:material-source:commiphora-myrrha",
  "image": "Image: thorny tree in arid landscape",
  "imageCaption": "Photo: Wikimedia",
  "description": "Small, thorny tree native to the Horn of Africa and the Arabian Peninsula. Produces aromatic resin when the bark is wounded. The resin exudes as a pale yellow liquid that hardens into reddish-brown tears. Trees are typically tapped after five years of growth.",
  "nativeRange": "Ethiopia, Eritrea, Somalia, Djibouti, Yemen, Oman",
  "products": [
    {
      "name": "Myrrh resin",
      "route": "product_myrrh"
    },
    {
      "name": "Myrrh essential oil",
      "route": null
    },
    {
      "name": "Myrrh tincture",
      "route": null
    }
  ],
  "externalResources": [
    {
      "name": "Kew Plants of the World Online",
      "url": "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:127741-1"
    },
    {
      "name": "Wikipedia",
      "url": "https://en.wikipedia.org/wiki/Commiphora_myrrha"
    },
    {
      "name": "GBIF",
      "url": "https://www.gbif.org/species/3994082"
    }
  ]
} as const;

export const DIOSCORIDES_DETAIL = {
  "name": "Pedanius Dioscorides",
  "shortName": "Dioscorides",
  "floruit": "1st century CE",
  "activeIn": "Roman Anatolia",
  "urn": "urn:aos:person:dioscorides",
  "image": "Image: medieval manuscript portrait",
  "bio": "Greek physician and pharmacologist, author of De materia medica, the most influential pharmacological text of antiquity. Served as a military physician, possibly under Nero. His work on aromatics and perfumes in Book 1 remains our most important ancient source for perfume recipes.",
  "works": [
    {
      "name": "De materia medica",
      "route": "work_materia_medica",
      "detail": "Editions: Wellmann (1907), Sprengel (1829)"
    },
    {
      "name": "Translations: Beck (2005)",
      "route": null
    }
  ],
  "recipes": [
    {
      "name": "Rose Perfume (1.43)",
      "route": "recipe_rose"
    },
    {
      "name": "Lily Perfume (1.62)",
      "route": null
    },
    {
      "name": "Cinnamon Perfume (1.61)",
      "route": null
    },
    {
      "name": "Megalleion (1.59)",
      "route": null
    }
  ],
  "external": [
    {
      "name": "Wikipedia",
      "url": "https://en.wikipedia.org/wiki/Dioscorides"
    },
    {
      "name": "VIAF",
      "url": "https://viaf.org/viaf/78822798/"
    }
  ]
} as const;

export const SEAN_DETAIL = {
  "name": "Sean Coughlin",
  "role": "Principal Investigator",
  "affiliation": "Institute of Philosophy, Czech Academy of Sciences",
  "orcid": "0000-0000-0000-0000",
  "website": "seancoughlin.net",
  "image": "Photo",
  "bio": "Sean Coughlin is a historian of science and philosophy specializing in ancient Greek and Roman science. He leads the Alchemies of Scent project, which combines philological analysis with chemical replication to understand ancient perfumery.",
  "publications": [
    {
      "title": "Coughlin, S. (2024). \"Ancient Perfume Reconstruction: Methodologies and Challenges.\"",
      "url": "#"
    },
    {
      "title": "Coughlin, S. & Graff, D. (2023). \"The Scent of the Past: Recreating the Mendesian.\"",
      "url": "#"
    }
  ],
  "experiments": [
    {
      "title": "Replicating Dioscorides' Rose Perfume",
      "route": "experiments"
    },
    {
      "title": "Reconstructing Megalleion",
      "route": "experiments"
    }
  ]
} as const;

export const MATERIA_MEDICA_DETAIL = {
  "title": "De materia medica",
  "author": {
    "name": "Dioscorides",
    "route": "person_dioscorides"
  },
  "date": "1st century CE",
  "language": "Greek",
  "type": "Ancient text",
  "urn": "urn:aos:work:de-materia-medica",
  "description": "Encyclopedic pharmacological treatise covering approximately 600 plants, 35 animal products, and 90 minerals. Book 1 contains extensive material on aromatics and perfumes, making it our primary source for ancient Greek perfume recipes.",
  "editions": [
    {
      "name": "Wellmann (1907)",
      "desc": "Standard critical edition. Reference system: book.chapter"
    },
    {
      "name": "Sprengel (1829)",
      "desc": "Earlier edition. Reference system: book.chapter (numbering differs)"
    }
  ],
  "translations": [
    {
      "name": "Beck (2005) — English",
      "route": null
    },
    {
      "name": "Berendes (1902) — German",
      "route": null
    }
  ],
  "recipes": [
    {
      "name": "Rose Perfume (1.43)",
      "route": "recipe_rose"
    },
    {
      "name": "Lily Perfume (1.62)",
      "route": null
    },
    {
      "name": "Cinnamon Perfume (1.61)",
      "route": null
    }
  ]
} as const;
