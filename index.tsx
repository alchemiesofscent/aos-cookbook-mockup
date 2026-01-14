import React, { useState, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { AdminConsole } from "./AdminConsole";

// --- Debugging / Error Handling ---
window.onerror = function(message, source, lineno, colno, error) {
  console.error("Global Error Caught:", message, error);
  const root = document.getElementById("root");
  if (root) {
    const errorDiv = document.createElement("div");
    errorDiv.innerHTML = `<div style="color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; margin: 20px; font-family: sans-serif; border-radius: 4px; position: fixed; top: 0; left: 0; width: 100%; z-index: 9999;">
      <h3 style="margin-top:0;">Application Error</h3>
      <p><strong>Message:</strong> ${message}</p>
      <p><strong>Source:</strong> ${source}:${lineno}</p>
    </div>`;
    document.body.appendChild(errorDiv);
  }
};

// --- Data Models & Content ---

const RECIPE_DATA = {
  id: "rose-perfume",
  title: "Rose Perfume",
  source: "Dioscorides, De materia medica 1.43",
  sourceDetail: "Edition: Wellmann (1907), pp. 42-43",
  urn: "urn:aos:recipe:rose-perfume-dioscorides",
  textSegments: [
    { text: "Preparation of rose oil: Take five litras of " },
    { text: "σχοῖνος", type: "annotation", id: "skhoinos" },
    { text: ", twenty litras of " },
    { text: "ἔλαιον", type: "annotation", id: "elaion" },
    { text: ". Chop and soften in water, then " },
    { text: "ἕψειν", type: "annotation", id: "hepsein" },
    { text: " while stirring.\n\nAfterward, strain and place the petals of one thousand " },
    { text: "ῥόδα", type: "annotation", id: "rhoda" },
    { text: " into the oil. Rub your hands with fragrant " },
    { text: "μέλι", type: "annotation", id: "meli" },
    { text: " and stir repeatedly.\n\nLet stand overnight, then strain through a cloth. Store in a vessel smeared with honey." },
  ],
  annotations: {
    skhoinos: {
      term: "σχοῖνος",
      transliteration: "skhoinos",
      definition: "A rush or reed. Most scholars identify this as lemongrass (Cymbopogon schoenanthus).",
      links: [{ label: "View ancient term", route: "ingredient_smyrna" }] // Linking to smyrna as demo
    },
    elaion: {
      term: "ἔλαιον",
      transliteration: "elaion",
      definition: "Olive oil, typically specifically 'omphacium' or unripe olive oil in perfume contexts for its stability.",
      links: []
    },
    rhoda: {
      term: "ῥόδα",
      transliteration: "rhoda",
      definition: "Roses. The specific species is debated, but Rosa gallica or Rosa damascena are primary candidates.",
      links: []
    },
    meli: {
      term: "μέλι",
      transliteration: "meli",
      definition: "Honey. Used here likely to prevent adhesion or as a fixative agent.",
      links: []
    },
    hepsein: {
      term: "ἕψειν",
      transliteration: "hepsein",
      definition: "To boil or seethe. Indicates hot maceration process.",
      links: [{ label: "View process", route: "process_enfleurage" }]
    }
  },
  ingredientsList: [
    { name: "σχοῖνος (skhoinos)", amount: "5 lbs 8 oz", role: "aromatic" },
    { name: "ἔλαιον (elaion)", amount: "20 lbs 5 oz", role: "base" },
    { name: "ῥόδα (rhoda)", amount: "1000 petals", role: "aromatic" },
    { name: "μέλι (meli)", amount: "—", role: "other" }
  ]
};

const INGREDIENT_DATA = {
  term: "σμύρνα",
  transliteration: "smyrna",
  language: "Greek",
  urn: "urn:aos:ancient-ingredient:smyrna",
  quotes: [
    { author: "Dioscorides, Mat. Med. 1.77", text: "The best is that from Troglodytice, pale, somewhat greenish, with a certain oiliness, smooth, and pure." }
  ],
  identifications: [
    {
      id: "id1",
      name: "Myrrh resin",
      source: "Commiphora myrrha",
      citation: "Manniche (1999), pp. 45-47",
      confidence: "established", // established, probable, speculative
      linkRoute: "product_myrrh",
      claimRoute: "identification_smyrna"
    },
    {
      id: "id2",
      name: "Opopanax resin",
      source: "Commiphora guidottii",
      citation: "Tucker (1986), p. 234",
      confidence: "probable",
      note: "Note: 'Sweet myrrh' or 'bisabol myrrh' may refer to this species.",
      linkRoute: "product_myrrh" 
    }
  ]
};

const IDENTIFICATION_DATA = {
  urn: "urn:aos:identification:smyrna-myrrh-resin-manniche-1999",
  ancientTerm: { name: "σμύρνα (smyrna)", route: "ingredient_smyrna" },
  identifiedAs: { name: "Myrrh resin", route: "product_myrrh" },
  materialSource: { name: "Commiphora myrrha", route: "source_commiphora" },
  confidence: "established",
  source: {
    citation: "Manniche, L. (1999). Sacred Luxuries: Fragrance, Aromatherapy, and Cosmetics in Ancient Egypt. Cornell University Press.",
    pages: "45-47",
    urn: "urn:isbn:9780801437205"
  },
  notes: "This identification is widely accepted in the scholarly literature. Manniche provides extensive botanical and historical evidence for the equation of Greek σμύρνα with the resin of Commiphora myrrha."
};

const PRODUCT_DATA = {
  name: "Myrrh Resin",
  urn: "urn:aos:ingredient-product:myrrh-resin",
  description: "Aromatic resin harvested from trees of the genus Commiphora, native to the Horn of Africa and Arabian Peninsula.",
  family: "Resinous > Balsamic",
  image: "Image: amber resin tears",
  imageCaption: "Photo: S. Coughlin",
  profile: {
    primary: ["Balsamic (dominant)", "Warm (moderate)", "Slightly bitter (subtle)"],
    secondary: ["Medicinal", "Earthy", "Faint licorice undertone"],
    evolution: "Opens sharp and medicinal, almost bitter. Within minutes, softens to a warm, honeyed amber that persists for hours.",
    comparable: "Drier than labdanum, less sweet than benzoin. Shares balsamic notes with frankincense but darker, more complex, more medicinal."
  },
  source: {
    name: "Commiphora myrrha",
    family: "Burseraceae",
    part: "Resin",
    native: "Ethiopia, Somalia, Yemen"
  },
  ancientTerms: [
    { term: "σμύρνα", language: "Greek", confidence: "established", citation: "Manniche (1999)" },
    { term: "ʿntyw", language: "Egyptian", confidence: "probable", citation: "Manniche (1999)" },
    { term: "murra", language: "Latin", confidence: "established", citation: "André (1985)" }
  ],
  availability: {
    status: "Available",
    details: "Can be sourced from essential oil suppliers and specialty incense vendors. Look for \"Commiphora myrrha\" specifically; other species (C. guidottii, C. erythraea) have different scent profiles."
  }
};

const COMMIPHORA_DATA = {
  name: "Commiphora myrrha",
  commonName: "Myrrh tree",
  family: "Burseraceae",
  type: "Plant",
  urn: "urn:aos:material-source:commiphora-myrrha",
  image: "Image: thorny tree in arid landscape",
  imageCaption: "Photo: Wikimedia",
  description: "Small, thorny tree native to the Horn of Africa and the Arabian Peninsula. Produces aromatic resin when the bark is wounded. The resin exudes as a pale yellow liquid that hardens into reddish-brown tears. Trees are typically tapped after five years of growth.",
  nativeRange: "Ethiopia, Eritrea, Somalia, Djibouti, Yemen, Oman",
  products: [
    { name: "Myrrh resin", route: "product_myrrh" },
    { name: "Myrrh essential oil", route: null },
    { name: "Myrrh tincture", route: null }
  ],
  externalResources: [
    { name: "Kew Plants of the World Online", url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:127741-1" },
    { name: "Wikipedia", url: "https://en.wikipedia.org/wiki/Commiphora_myrrha" },
    { name: "GBIF", url: "https://www.gbif.org/species/3994082" }
  ]
};

const PROCESS_DATA = {
  name: "Enfleurage",
  ancientTerm: "ἐξιποῦν (exipoun)",
  urn: "urn:aos:process:enfleurage",
  description: "A technique for extracting fragrance from delicate flowers by pressing them into fat or oil. The aromatic compounds transfer slowly over hours or days. The Greek term ἐξιποῦν literally means \"to press out.\"",
  variations: [
    { name: "Cold enfleurage", description: "Flowers pressed into solid fat (traditionally lard or tallow) at room temperature. Fat is replaced repeatedly until saturated." },
    { name: "Hot enfleurage (maceration)", description: "Flowers steeped in warm oil. The heat accelerates extraction but may alter delicate notes." },
    { name: "Multiple infusions", description: "Fresh flowers added repeatedly to the same fat/oil, building intensity. Dioscorides describes up to seven infusions for rose oil." }
  ],
  notes: "The ancient terminology is not always consistent. Dioscorides uses ἐξιποῦν and ἐκθλίβειν somewhat interchangeably. Context usually clarifies whether cold or hot infusion is meant.",
  recipes: [
    { name: "Rose Perfume (Dioscorides)", route: "recipe_rose" },
    { name: "Lily Perfume (Dioscorides)", route: null },
    { name: "Susinum (Dioscorides)", route: null }
  ],
  reading: [
    { name: "Brun (2000), Les parfums dans l'antiquité", route: null }
  ]
};

const TOOL_DATA = {
  name: "Mortar and Pestle",
  ancientNames: ["θυεία (thyeia)", "ἴγδις (igdis)"],
  urn: "urn:aos:tool:mortar",
  image: "Image: stone mortar",
  imageCaption: "Photo: Museum of Antiquities",
  description: "A vessel and tool used for crushing, grinding, and mixing ingredients. Essential for breaking down resins, barks, and tough plant materials before extraction.",
  processes: [
    { name: "Grinding", route: null },
    { name: "Trituration", route: null }
  ],
  recipes: [
    { name: "Rose Perfume", route: "recipe_rose" }
  ]
};

const TERMS_LIST = [
  { id: 'smyrna', term: 'σμύρνα', transliteration: 'smyrna', language: 'Greek', category: 'Resin', def: 'Myrrh; a resinous gum used in perfumes and incense.' },
  { id: 'elaion', term: 'ἔλαιον', transliteration: 'elaion', language: 'Greek', category: 'Base', def: 'Olive oil; the standard liquid fat base for perfumes.' },
  { id: 'rhoda', term: 'ῥόδα', transliteration: 'rhoda', language: 'Greek', category: 'Floral', def: 'Roses; the flowers, usually macerated in oil.' },
  { id: 'skhoinos', term: 'σχοῖνος', transliteration: 'skhoinos', language: 'Greek', category: 'Herb', def: 'Rush or reed; likely Camel Grass or Lemongrass.' },
  { id: 'meli', term: 'μέλι', transliteration: 'meli', language: 'Greek', category: 'Additive', def: 'Honey; used to treat vessels or thicken mixtures.' },
  { id: 'aspalathos', term: 'ἀσπάλαθος', transliteration: 'aspalathos', language: 'Greek', category: 'Wood', def: 'A thorny shrub with fragrant wood, possibly Camel’s Thorn.' },
  { id: 'myrrha', term: 'myrrha', transliteration: '-', language: 'Latin', category: 'Resin', def: 'Myrrh; transliterated from Greek.' },
  { id: 'rosae', term: 'rosae', transliteration: '-', language: 'Latin', category: 'Floral', def: 'Roses; equivalent to rhoda.' },
  { id: 'omphacium', term: 'omphacium', transliteration: '-', language: 'Latin', category: 'Base', def: 'Oil from unripe olives.' },
  { id: 'krokos', term: 'κρόκος', transliteration: 'krokos', language: 'Greek', category: 'Floral', def: 'Saffron; the crocus flower stamens.' },
];

const INGREDIENTS_LIST = [
  { id: 'cardamom', name: 'Cardamom', family: 'Spice', form: 'Seeds', source: 'Elettaria cardamomum', def: 'Aromatic seeds with warm, spicy-sweet scent.', ancient: [{term: 'ἄμωμον', route: null}, {term: 'κάρδαμον', route: null}] },
  { id: 'cassia', name: 'Cassia', family: 'Spice', form: 'Bark', source: 'Cinnamomum cassia', def: 'Bark with cinnamon-like aroma, more pungent than true cinnamon.', ancient: [{term: 'κασία', route: null}, {term: 'κάσια', route: null}] },
  { id: 'cinnamon', name: 'Cinnamon', family: 'Spice', form: 'Bark', source: 'Cinnamomum verum', def: 'Aromatic bark with warm, sweet, woody scent.', ancient: [{term: 'κιννάμωμον', route: null}] },
  { id: 'myrrh', name: 'Myrrh Resin', family: 'Resinous', form: 'Solid Resin', source: 'Commiphora myrrha', def: 'Aromatic resin with warm, balsamic, slightly medicinal scent.', ancient: [{term: 'σμύρνα', route: 'ingredient_smyrna'}, {term: 'ʿntyw', route: null}] },
  { id: 'omphacium', name: 'Omphacium Olive Oil', family: 'Fats/Oils', form: 'Liquid Oil', source: 'Olea europaea', def: 'Oil from unripe olives, preferred for its low scent profile.', ancient: [] },
  { id: 'rose', name: 'Rose Petals', family: 'Floral', form: 'Fresh/Dry Petals', source: 'Rosa gallica', def: 'Fresh or dried petals used for enfleurage.', ancient: [] },
  { id: 'lemongrass', name: 'Lemongrass', family: 'Green', form: 'Dried Grass', source: 'Cymbopogon schoenanthus', def: 'Citrus-scented grass used as an aromatic.', ancient: [] },
  { id: 'honey', name: 'Honey', family: 'Sweet', form: 'Viscous Liquid', source: 'Apis mellifera', def: 'Sweet viscous fluid produced by bees.', ancient: [] },
  { id: 'galbanum', name: 'Galbanum', family: 'Resinous', form: 'Gum Resin', source: 'Ferula gummosa', def: 'Bitter, green, aromatic gum resin.', ancient: [] },
  { id: 'labdanum', name: 'Labdanum', family: 'Resinous', form: 'Oleoresin', source: 'Cistus ladanifer', def: 'Sticky brown resin with a deep, amber scent.', ancient: [] },
  { id: 'saffron', name: 'Saffron', family: 'Spice', form: 'Dried Stigmas', source: 'Crocus sativus', def: 'Dried stigmas of the crocus flower.', ancient: [] },
];

const SOURCES_LIST = [
  { id: 'commiphora', name: 'Commiphora myrrha', type: 'Tree', family: 'Burseraceae', region: 'Horn of Africa' },
  { id: 'olea', name: 'Olea europaea', type: 'Tree', family: 'Oleaceae', region: 'Mediterranean' },
  { id: 'rosa', name: 'Rosa gallica', type: 'Shrub', family: 'Rosaceae', region: 'Europe/West Asia' },
  { id: 'cymbopogon', name: 'Cymbopogon schoenanthus', type: 'Grass', family: 'Poaceae', region: 'North Africa/Asia' },
  { id: 'apis', name: 'Apis mellifera', type: 'Insect', family: 'Apidae', region: 'Global' },
  { id: 'ferula', name: 'Ferula gummosa', type: 'Herbaceous', family: 'Apiaceae', region: 'Iran' },
  { id: 'cistus', name: 'Cistus ladanifer', type: 'Shrub', family: 'Cistaceae', region: 'Mediterranean' },
  { id: 'crocus', name: 'Crocus sativus', type: 'Flower', family: 'Iridaceae', region: 'Greece/SW Asia' },
];

const WORKS_DATA = [
  {
    id: "dioscorides-materia-medica",
    title: "De materia medica",
    author: "Pedanius Dioscorides",
    date: "c. 50–70 CE",
    description: "The primary source for pharmacology and medical botany for over 1,500 years. Books 1 and 2 cover aromatics and oils.",
    urn: "urn:cts:greekLit:tlg0656.tlg001",
    route: "work_materia_medica"
  },
  {
    id: "theophrastus-on-odors",
    title: "De odoribus (On Odors)",
    author: "Theophrastus",
    date: "c. 300 BCE",
    description: "A short treatise dealing specifically with perfumes, their ingredients, and manufacturing processes.",
    urn: "urn:cts:greekLit:tlg0093.tlg002",
    route: null
  },
  {
    id: "pliny-natural-history",
    title: "Naturalis Historia",
    author: "Pliny the Elder",
    date: "c. 77 CE",
    description: "An encyclopedic work. Book 13 discusses trees and perfumes.",
    urn: "urn:cts:latinLit:phi0978.phi001",
    route: null
  }
];

const PEOPLE_DATA = [
  {
    id: "dioscorides",
    name: "Pedanius Dioscorides",
    role: "Physician & Botanist",
    period: "1st Century CE",
    bio: "A Greek physician, pharmacologist, and botanist, employed in the Roman army. Author of De materia medica.",
    route: "person_dioscorides"
  },
  {
    id: "theophrastus",
    name: "Theophrastus",
    role: "Philosopher & Botanist",
    period: "c. 371 – c. 287 BCE",
    bio: "Successor to Aristotle in the Peripatetic school. Often called the 'father of botany'.",
    route: null
  },
  {
    id: "tapputi",
    name: "Tapputi-Belat-Ekallim",
    role: "Perfumer",
    period: "c. 1200 BCE",
    bio: "Considered the world's first recorded chemist, mentioned in a cuneiform tablet from Babylonia.",
    route: null
  }
];

// --- New Detail Data Constants ---

const DIOSCORIDES_DETAIL = {
  name: "Pedanius Dioscorides",
  shortName: "Dioscorides",
  floruit: "1st century CE",
  activeIn: "Roman Anatolia",
  urn: "urn:aos:person:dioscorides",
  image: "Image: medieval manuscript portrait",
  bio: "Greek physician and pharmacologist, author of De materia medica, the most influential pharmacological text of antiquity. Served as a military physician, possibly under Nero. His work on aromatics and perfumes in Book 1 remains our most important ancient source for perfume recipes.",
  works: [
    { name: "De materia medica", route: "work_materia_medica", detail: "Editions: Wellmann (1907), Sprengel (1829)" },
    { name: "Translations: Beck (2005)", route: null }
  ],
  recipes: [
    { name: "Rose Perfume (1.43)", route: "recipe_rose" },
    { name: "Lily Perfume (1.62)", route: null },
    { name: "Cinnamon Perfume (1.61)", route: null },
    { name: "Megalleion (1.59)", route: null }
  ],
  external: [
    { name: "Wikipedia", url: "https://en.wikipedia.org/wiki/Dioscorides" },
    { name: "VIAF", url: "https://viaf.org/viaf/78822798/" }
  ]
};

const SEAN_DETAIL = {
  name: "Sean Coughlin",
  role: "Principal Investigator",
  affiliation: "Institute of Philosophy, Czech Academy of Sciences",
  orcid: "0000-0000-0000-0000",
  website: "seancoughlin.net",
  image: "Photo",
  bio: "Sean Coughlin is a historian of science and philosophy specializing in ancient Greek and Roman science. He leads the Alchemies of Scent project, which combines philological analysis with chemical replication to understand ancient perfumery.",
  publications: [
    { title: "Coughlin, S. (2024). \"Ancient Perfume Reconstruction: Methodologies and Challenges.\"", url: "#" },
    { title: "Coughlin, S. & Graff, D. (2023). \"The Scent of the Past: Recreating the Mendesian.\"", url: "#" }
  ],
  experiments: [
    { title: "Replicating Dioscorides' Rose Perfume", route: "experiments" },
    { title: "Reconstructing Megalleion", route: "experiments" }
  ]
};

const MATERIA_MEDICA_DETAIL = {
  title: "De materia medica",
  author: { name: "Dioscorides", route: "person_dioscorides" },
  date: "1st century CE",
  language: "Greek",
  type: "Ancient text",
  urn: "urn:aos:work:de-materia-medica",
  description: "Encyclopedic pharmacological treatise covering approximately 600 plants, 35 animal products, and 90 minerals. Book 1 contains extensive material on aromatics and perfumes, making it our primary source for ancient Greek perfume recipes.",
  editions: [
    { name: "Wellmann (1907)", desc: "Standard critical edition. Reference system: book.chapter" },
    { name: "Sprengel (1829)", desc: "Earlier edition. Reference system: book.chapter (numbering differs)" }
  ],
  translations: [
    { name: "Beck (2005) — English", route: null },
    { name: "Berendes (1902) — German", route: null }
  ],
  recipes: [
    { name: "Rose Perfume (1.43)", route: "recipe_rose" },
    { name: "Lily Perfume (1.62)", route: null },
    { name: "Cinnamon Perfume (1.61)", route: null }
  ]
};

// --- Components ---

const Icons = {
  ChevronDown: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 5 5 12 12 19" />
    </svg>
  ),
  Grid: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  List: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
};

const Header = ({ navigate }) => {
  return (
    <header className="site-header">
      <div className="logo-section" onClick={() => navigate('home')}>
        <div className="logo-title">ALCHEMIES OF SCENT</div>
        <div className="logo-subtitle">The Laboratory</div>
      </div>
      <nav className="main-nav">
        <div className="nav-item">
          <span onClick={() => navigate('library')}>The Library</span> <Icons.ChevronDown />
          <div className="dropdown">
            <div onClick={() => navigate('archive')}>Recipes</div>
            <div onClick={() => navigate('works')}>Works</div>
            <div onClick={() => navigate('people')}>People</div>
          </div>
        </div>
        <div className="nav-item">
          <span onClick={() => navigate('workshop')}>The Workshop</span> <Icons.ChevronDown />
          <div className="dropdown">
            <div onClick={() => navigate('materials')}>Materials</div>
            <div onClick={() => navigate('processes')}>Processes</div>
            <div onClick={() => navigate('tools')}>Tools</div>
            <div onClick={() => navigate('experiments')}>Experiments</div>
          </div>
        </div>
        <div className="nav-item">
          <span onClick={() => navigate('about')}>About</span> <Icons.ChevronDown />
          <div className="dropdown">
            <div onClick={() => navigate('project')}>Project</div>
            <div onClick={() => navigate('team')}>Team</div>
            <div onClick={() => navigate('news')}>News</div>
          </div>
        </div>
        <div className="nav-item search-icon">
          <Icons.Search />
        </div>
        <div className="nav-item" onClick={() => navigate('admin')} style={{borderLeft: '1px solid rgba(92, 74, 61, 0.2)', paddingLeft: '1.5rem', marginLeft: '0.5rem', color: 'var(--color-amber-dark)', fontWeight: 600}}>
           Admin
        </div>
      </nav>
    </header>
  );
};

const Footer = ({ navigate }) => (
  <footer className="site-footer">
    <div className="footer-columns">
      <div className="col">
        <h4 style={{cursor: 'pointer'}} onClick={() => navigate('library')}>The Library</h4>
        <a style={{cursor: 'pointer'}} onClick={() => navigate('archive')}>Recipes</a>
        <a style={{cursor: 'pointer'}} onClick={() => navigate('works')}>Works</a>
        <a style={{cursor: 'pointer'}} onClick={() => navigate('people')}>People</a>
      </div>
      <div className="col">
        <h4 style={{cursor: 'pointer'}} onClick={() => navigate('workshop')}>The Workshop</h4>
        <a style={{cursor: 'pointer'}} onClick={() => navigate('materials')}>Materials</a>
        <a style={{cursor: 'pointer'}} onClick={() => navigate('processes')}>Processes</a>
        <a style={{cursor: 'pointer'}} onClick={() => navigate('tools')}>Tools</a>
         <a style={{cursor: 'pointer'}} onClick={() => navigate('experiments')}>Experiments</a>
      </div>
      <div className="col">
        <h4 style={{cursor: 'pointer'}} onClick={() => navigate('about')}>About</h4>
        <a style={{cursor: 'pointer'}} onClick={() => navigate('project')}>Project</a>
        <a style={{cursor: 'pointer'}} onClick={() => navigate('team')}>Team</a>
        <a style={{cursor: 'pointer'}} onClick={() => navigate('news')}>News</a>
      </div>
    </div>
    <div className="footer-bottom">
      <p>Content: CC-BY-4.0 • Data: CC0-1.0 • Code: GPL-3.0</p>
      <p>Institute of Philosophy, Czech Academy of Sciences</p>
    </div>
  </footer>
);

// --- Reusable Components ---

const MaterialsSubNav = ({ navigate, active }) => (
  <div className="materials-nav">
     <button className={active === 'dashboard' ? 'active' : ''} onClick={() => navigate('materials')}>Overview</button>
     <button className={active === 'terms' ? 'active' : ''} onClick={() => navigate('terms')}>Ancient Terms</button>
     <button className={active === 'ingredients' ? 'active' : ''} onClick={() => navigate('ingredients')}>Ingredients</button>
     <button className={active === 'sources' ? 'active' : ''} onClick={() => navigate('sources')}>Material Sources</button>
  </div>
);

// --- Page Views ---

const HomePage = ({ navigate }) => {
  return (
    <div className="page-container home-page">
      <div className="home-hero">
         <div className="hero-content">
            <div className="hero-super">The Laboratory</div>
            <h1>ALCHEMIES OF SCENT</h1>
            <p className="hero-text">Reconstructing the sensory past of antiquity through the interdisciplinary study of perfumery.</p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => navigate('library')}>Enter The Library</button>
              <button className="btn-secondary" onClick={() => navigate('workshop')}>Enter The Workshop</button>
            </div>
         </div>
      </div>

      <div className="home-grid">
         <div className="home-card" onClick={() => navigate('library')}>
            <h2>The Library</h2>
            <p>The textual heart of the project. Explore ancient recipes, primary source texts, and biographies of the people who created them.</p>
            <span className="link-text">Browse Collection &rarr;</span>
         </div>
         <div className="home-card" onClick={() => navigate('workshop')}>
            <h2>The Workshop</h2>
            <p>The experimental laboratory. Dive into the chemical data, botanical identifications, and material analysis of ancient ingredients.</p>
             <span className="link-text">Explore Materials &rarr;</span>
         </div>
         <div className="home-card" onClick={() => navigate('about')}>
            <h2>About the Project</h2>
            <p>Meet the interdisciplinary team of historians, linguists, and chemists working to bring the past back to life.</p>
             <span className="link-text">Read More &rarr;</span>
         </div>
      </div>
    </div>
  );
};

const LibraryPage = ({ navigate }) => {
  return (
    <div className="page-container">
      <div className="library-hero">
        <h1>The Library</h1>
        <p className="intro-text">
            The central repository for the Alchemies of Scent project, containing primary sources, translations, and prosopographical data.
        </p>
      </div>

      <div className="library-grid">
         {/* Card 1: Recipes */}
         <div className="library-section-card" onClick={() => navigate('archive')}>
            <span className="library-count">47 Items</span>
            <h2>Recipes</h2>
            <p>A curated collection of perfume recipes from Greco-Egyptian antiquity, annotated with linguistic and chemical data.</p>
            <button className="text-btn">Browse Recipes &rarr;</button>
         </div>
         {/* Card 2: Works */}
         <div className="library-section-card" onClick={() => navigate('works')}>
            <span className="library-count">12 Items</span>
            <h2>Works</h2>
            <p>Full texts and treatises on botany, medicine, and pharmacology from the classical period.</p>
            <button className="text-btn">Browse Works &rarr;</button>
         </div>
         {/* Card 3: People */}
         <div className="library-section-card" onClick={() => navigate('people')}>
             <span className="library-count">28 Items</span>
            <h2>People</h2>
            <p>Biographies of ancient authors, perfumers, and historical figures related to the trade.</p>
            <button className="text-btn">Browse People &rarr;</button>
         </div>
      </div>
    </div>
  );
};

const AboutPage = ({ navigate }) => {
  return (
    <div className="page-container">
      <div className="library-hero">
        <h1>About Alchemies of Scent</h1>
        <p className="intro-text">
            Unlocking the olfactory heritage of the ancient world through history, science, and experimental reconstruction.
        </p>
      </div>

      <div className="library-grid">
         {/* Card 1: Project */}
         <div className="library-section-card" onClick={() => navigate('project')}>
            <span className="library-count">Mission & Methods</span>
            <h2>The Project</h2>
            <p>Our methodology combines text-based historical research with chemical analysis to recreate ancient perfumes.</p>
            <button className="text-btn">Read Mission &rarr;</button>
         </div>
         {/* Card 2: Team */}
         <div className="library-section-card" onClick={() => navigate('team')}>
            <span className="library-count">Researchers</span>
            <h2>The Team</h2>
            <p>An international collaboration of historians of science, classicists, and organic chemists.</p>
            <button className="text-btn">Meet the Team &rarr;</button>
         </div>
         {/* Card 3: News */}
         <div className="library-section-card" onClick={() => navigate('news')}>
             <span className="library-count">Updates</span>
            <h2>News & Events</h2>
            <p>Recent publications, media coverage, and conference presentations from the research group.</p>
            <button className="text-btn">View Updates &rarr;</button>
         </div>
      </div>
    </div>
  );
};

const WorksPage = ({ navigate }) => {
  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate('library')}>
        <Icons.ArrowLeft /> Back to Library
      </div>

      <div className="archive-intro">
        <h1>WORKS</h1>
        <p>Key treatises on botany, pharmacology, and perfumery from the ancient world.</p>
      </div>

      <div className="recipe-grid">
        {WORKS_DATA.map((work) => (
          <div className="recipe-card" key={work.id}>
            <h3>{work.title}</h3>
            <div className="card-sub">{work.author} ({work.date})</div>
             <p style={{fontSize: '0.9rem', color: 'var(--color-earth)', marginBottom: '1.5rem'}}>
              {work.description}
            </p>
            <div className="card-meta">
               <span className="urn">{work.urn}</span>
            </div>
            <button className="btn-primary" onClick={() => work.route ? navigate(work.route) : null}>View text</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const PeoplePage = ({ navigate }) => {
  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate('library')}>
        <Icons.ArrowLeft /> Back to Library
      </div>

      <div className="archive-intro">
        <h1>PEOPLE</h1>
        <p>The authors, perfumers, and botanical explorers of antiquity.</p>
      </div>

      <div className="recipe-grid">
        {PEOPLE_DATA.map((person) => (
          <div className="recipe-card" key={person.id}>
            <h3>{person.name}</h3>
            <div className="card-sub">{person.role} • {person.period}</div>
            <p style={{fontSize: '0.9rem', color: 'var(--color-earth)', marginBottom: '1.5rem'}}>
              {person.bio}
            </p>
            <button className="btn-secondary" onClick={() => person.route ? navigate(person.route) : null}>View profile</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const TermsPage = ({ navigate }) => {
  const [langFilter, setLangFilter] = useState('All');
  const [catFilter, setCatFilter] = useState('All');

  const filtered = useMemo(() => {
    return TERMS_LIST.filter(item => {
      const matchLang = langFilter === 'All' || item.language === langFilter;
      const matchCat = catFilter === 'All' || item.category === catFilter;
      return matchLang && matchCat;
    });
  }, [langFilter, catFilter]);

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate('workshop')}>
        <Icons.ArrowLeft /> Back to Workshop
      </div>
      
      <div className="archive-intro">
        <h1>ANCIENT TERMS</h1>
        <MaterialsSubNav navigate={navigate} active="terms" />
        <p>A dictionary of botanical, chemical, and technical terminology from ancient sources.</p>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <select value={langFilter} onChange={(e) => setLangFilter(e.target.value)}>
            <option value="All">Language: All</option>
            <option value="Greek">Greek</option>
            <option value="Latin">Latin</option>
          </select>
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="All">Category: All</option>
            <option value="Resin">Resin</option>
            <option value="Base">Base</option>
            <option value="Floral">Floral</option>
            <option value="Herb">Herb</option>
            <option value="Additive">Additive</option>
            <option value="Wood">Wood</option>
          </select>
        </div>
        <div className="filter-meta">
          <button className="text-btn" onClick={() => { setLangFilter('All'); setCatFilter('All'); }}>Clear filters</button>
          <span>Showing {filtered.length} terms</span>
        </div>
      </div>

      <div className="workshop-grid">
        {filtered.map(item => (
           <div className="workshop-card" key={item.id} onClick={() => item.id === 'smyrna' ? navigate('ingredient_smyrna') : null}>
            <div className="card-top">
              <h3>{item.term}</h3>
              <span className="lang-tag">{item.language}</span>
            </div>
            <div className="translit">{item.transliteration}</div>
            <div style={{marginBottom:'0.5rem'}}><span className="type-tag">{item.category}</span></div>
            <div className="def">{item.def}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const IngredientsPage = ({ navigate }) => {
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list' (A-Z)
  const [familyFilter, setFamilyFilter] = useState('All');
  const [formFilter, setFormFilter] = useState('All');

  const filtered = useMemo(() => {
    return INGREDIENTS_LIST.filter(item => {
      const matchFam = familyFilter === 'All' || item.family === familyFilter;
      const matchForm = formFilter === 'All' || item.form.includes(formFilter);
      return matchFam && matchForm;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [familyFilter, formFilter]);

  const azList = useMemo(() => {
      const grouped = {};
      filtered.forEach(item => {
          const letter = item.name[0].toUpperCase();
          if(!grouped[letter]) grouped[letter] = [];
          grouped[letter].push(item);
      });
      return grouped;
  }, [filtered]);

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate('workshop')}>
        <Icons.ArrowLeft /> Back to Workshop
      </div>
      
      <div className="archive-intro">
        <h1>INGREDIENTS</h1>
        <MaterialsSubNav navigate={navigate} active="ingredients" />
        <p>Explore the materials used in ancient perfumery.</p>
        {viewMode === 'list' && <p style={{marginTop: '1rem', fontSize: '1rem', color: 'var(--color-earth)'}}>This index lists modern ingredient names. Click any entry to explore its modern definition and sensory profile, or to see the ancient terms that may correspond to it.</p>}
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          {viewMode === 'grid' && (
            <>
            <select value={familyFilter} onChange={(e) => setFamilyFilter(e.target.value)}>
              <option value="All">Family: All</option>
              <option value="Resinous">Resinous</option>
              <option value="Fats/Oils">Fats/Oils</option>
              <option value="Floral">Floral</option>
              <option value="Green">Green</option>
              <option value="Sweet">Sweet</option>
              <option value="Spice">Spice</option>
            </select>
            <select value={formFilter} onChange={(e) => setFormFilter(e.target.value)}>
              <option value="All">Form: All</option>
              <option value="Resin">Resin</option>
              <option value="Oil">Oil</option>
              <option value="Liquid">Liquid</option>
              <option value="Petals">Petals</option>
              <option value="Dried">Dried</option>
            </select>
            </>
          )}
          {viewMode === 'list' && <div style={{padding: '0.6rem 0', fontWeight: 'bold', color: 'var(--color-amber)'}}>A-Z Index Mode</div>}
        </div>
        
        <div className="filter-meta" style={{gap: '1rem'}}>
          <div className="view-toggles" style={{margin:0}}>
             <button className={`icon-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="A-Z List View">A-Z</button>
             <button className={`icon-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid View"><Icons.Grid /></button>
          </div>
          {viewMode === 'grid' && <button className="text-btn" onClick={() => { setFamilyFilter('All'); setFormFilter('All'); }}>Clear filters</button>}
          <span>{filtered.length} items</span>
        </div>
      </div>

      {viewMode === 'list' && (
          <div className="az-container">
             <div className="az-nav">
                 {['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'].map(char => (
                     <a key={char} href={`#az-${char}`} className={!azList[char] ? 'disabled' : ''}>{char}</a>
                 ))}
             </div>
             <div className="az-content">
                 {Object.keys(azList).sort().map(char => (
                     <div key={char} id={`az-${char}`} className="az-group">
                         <h2>{char}</h2>
                         <div className="az-list">
                             {azList[char].map(item => (
                                 <div key={item.id} className="az-card">
                                     <div className="az-card-header">
                                        <h3>{item.name}</h3>
                                     </div>
                                     <p>{item.def}</p>
                                     <div className="az-actions">
                                         <button className="text-btn" onClick={() => item.id === 'myrrh' ? navigate('product_myrrh') : null}>[Modern definition →]</button>
                                         {item.ancient && item.ancient.length > 0 && (
                                            <span style={{marginLeft: '1rem', fontSize: '0.85rem'}}>
                                                [Ancient terms: {item.ancient.map((a, i) => (
                                                    <span key={i}>
                                                        {a.route ? <span className="text-btn" onClick={() => navigate(a.route)}>{a.term}</span> : a.term}
                                                        {i < item.ancient.length - 1 ? ', ' : ''}
                                                    </span>
                                                ))} →]
                                            </span>
                                         )}
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 ))}
             </div>
          </div>
      )}

      {viewMode === 'grid' && (
        <div className="workshop-grid">
          {filtered.map(item => (
            <div className="workshop-card" key={item.id} onClick={() => item.id === 'myrrh' ? navigate('product_myrrh') : null}>
              <div className="card-top">
                <h3>{item.name}</h3>
                <span className="type-tag">{item.family}</span>
              </div>
              <div className="def" style={{marginBottom: '0.5rem'}}>Form: {item.form}</div>
              <div className="def" style={{fontStyle: 'italic', color: 'var(--color-stone)'}}>Source: {item.source}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SourcesPage = ({ navigate }) => {
  const [typeFilter, setTypeFilter] = useState('All');
  const [bioFamilyFilter, setBioFamilyFilter] = useState('All');

  const filtered = useMemo(() => {
    return SOURCES_LIST.filter(item => {
      const matchType = typeFilter === 'All' || item.type === typeFilter;
      const matchFam = bioFamilyFilter === 'All' || item.family === bioFamilyFilter;
      return matchType && matchFam;
    });
  }, [typeFilter, bioFamilyFilter]);

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate('workshop')}>
        <Icons.ArrowLeft /> Back to Workshop
      </div>
      
      <div className="archive-intro">
        <h1>MATERIAL SOURCES</h1>
        <MaterialsSubNav navigate={navigate} active="sources" />
        <p>The biological sources—plants, animals, and minerals—yielding the raw materials of perfumery.</p>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="All">Type: All</option>
            <option value="Tree">Tree</option>
            <option value="Shrub">Shrub</option>
            <option value="Grass">Grass</option>
            <option value="Flower">Flower</option>
            <option value="Insect">Insect</option>
            <option value="Herbaceous">Herbaceous</option>
          </select>
          <select value={bioFamilyFilter} onChange={(e) => setBioFamilyFilter(e.target.value)}>
            <option value="All">Family: All</option>
            <option value="Burseraceae">Burseraceae</option>
            <option value="Oleaceae">Oleaceae</option>
            <option value="Rosaceae">Rosaceae</option>
            <option value="Poaceae">Poaceae</option>
            <option value="Apidae">Apidae</option>
            <option value="Apiaceae">Apiaceae</option>
            <option value="Cistaceae">Cistaceae</option>
            <option value="Iridaceae">Iridaceae</option>
          </select>
        </div>
        <div className="filter-meta">
          <button className="text-btn" onClick={() => { setTypeFilter('All'); setBioFamilyFilter('All'); }}>Clear filters</button>
          <span>Showing {filtered.length} sources</span>
        </div>
      </div>

      <div className="workshop-grid">
        {filtered.map(item => (
           <div className="workshop-card" key={item.id} onClick={() => item.id === 'commiphora' ? navigate('source_commiphora') : null}>
            <div className="card-top">
              <h3 style={{fontStyle: 'italic', fontFamily: 'var(--font-serif)'}}>{item.name}</h3>
              <span className="type-tag">{item.type}</span>
            </div>
            <div className="def">Family: {item.family}</div>
            <div className="def" style={{color: 'var(--color-stone)'}}>Native Region: {item.region}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MaterialsDashboardPage = ({ navigate }) => {
  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate('workshop')}>
        <Icons.ArrowLeft /> Back to Workshop
      </div>
      
      <div className="workshop-header">
        <h1>MATERIALS</h1>
        <MaterialsSubNav navigate={navigate} active="dashboard" />
        <p className="intro-text">
          Ancient perfumery materials are complex. Explore our Dictionary of Ancient Terms, browse modern Ingredient Profiles, or study the biological Material Sources.
        </p>
      </div>

      <div className="workshop-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'}}>
        <div className="workshop-card" onClick={() => navigate('terms')} style={{display: 'flex', flexDirection: 'column', height: '100%', minHeight: '250px'}}>
           <div className="card-top">
            <h3>Ancient Terms</h3>
            <span className="lang-tag">Dictionary</span>
          </div>
          <p className="def" style={{fontSize: '1rem', lineHeight: '1.6', margin: '1rem 0', flex: 1}}>
            A philological dictionary of botanical, chemical, and technical terminology found in ancient Greek and Latin texts.
          </p>
          <span className="link-text">Browse Dictionary &rarr;</span>
        </div>
        
        <div className="workshop-card" onClick={() => navigate('ingredients')} style={{display: 'flex', flexDirection: 'column', height: '100%', minHeight: '250px'}}>
          <div className="card-top">
            <h3>Ingredients</h3>
            <span className="type-tag">Profiles</span>
          </div>
          <p className="def" style={{fontSize: '1rem', lineHeight: '1.6', margin: '1rem 0', flex: 1}}>
            Modern chemical and sensory profiles of the ingredients used in our reconstructions, indexed A-Z.
          </p>
          <span className="link-text">Browse Ingredients &rarr;</span>
        </div>
        
        <div className="workshop-card" onClick={() => navigate('sources')} style={{display: 'flex', flexDirection: 'column', height: '100%', minHeight: '250px'}}>
           <div className="card-top">
            <h3>Material Sources</h3>
            <span className="type-tag">Biology</span>
          </div>
          <p className="def" style={{fontSize: '1rem', lineHeight: '1.6', margin: '1rem 0', flex: 1}}>
            The biological taxonomy of the plants, animals, and minerals that yield the raw materials of perfumery.
          </p>
          <span className="link-text">Browse Sources &rarr;</span>
        </div>
      </div>
    </div>
  );
};

const WorkshopPage = ({ navigate }) => {
  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate('library')}>
        <Icons.ArrowLeft /> Back to Library
      </div>
      
      <div className="workshop-header">
        <h1>The Workshop</h1>
        <p className="intro-text">
          A compendium of the materials used in ancient perfumery, organized by their ancient terminology, the specific ingredients used in recipes, and their biological sources.
        </p>
      </div>

      <div className="workshop-section">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '1.5rem'}}>
            <h2 style={{margin:0, border: 'none'}}>MATERIALS</h2>
            <button className="text-btn" onClick={() => navigate('materials')}>See overview &rarr;</button>
        </div>
        <div className="workshop-grid">
          <div className="workshop-card" onClick={() => navigate('ingredient_smyrna')}>
             <div className="card-top">
              <h3>σμύρνα (smyrna)</h3>
              <span className="lang-tag">Term</span>
            </div>
            <div className="def">Myrrh; a resinous gum.</div>
          </div>
          <div className="workshop-card" onClick={() => navigate('product_myrrh')}>
            <div className="card-top">
              <h3>Myrrh Resin</h3>
              <span className="type-tag">Product</span>
            </div>
            <div className="def">Source: Commiphora myrrha</div>
          </div>
          <div className="workshop-card" onClick={() => navigate('source_commiphora')}>
             <div className="card-top">
              <h3 style={{fontStyle: 'italic', fontFamily: 'var(--font-serif)'}}>Commiphora myrrha</h3>
              <span className="type-tag">Source</span>
            </div>
            <div className="def">Family: Burseraceae</div>
          </div>
        </div>
      </div>

      <div className="workshop-section">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '1.5rem'}}>
            <h2 style={{margin:0, border: 'none'}}>METHODS</h2>
            <button className="text-btn" onClick={() => navigate('processes')}>See all processes &rarr;</button>
        </div>
        <div className="workshop-grid">
           <div className="workshop-card" onClick={() => navigate('process_enfleurage')}>
            <div className="card-top">
              <h3>Enfleurage</h3>
              <span className="type-tag">Process</span>
            </div>
            <div className="def">Extraction via fat/oil.</div>
          </div>
           <div className="workshop-card" onClick={() => navigate('tool_alembic')}>
            <div className="card-top">
              <h3>Mortar & Pestle</h3>
              <span className="type-tag">Tool</span>
            </div>
            <div className="def">For grinding and crushing.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProcessDetailPage = ({ navigate }) => {
  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate('processes')}>
        <Icons.ArrowLeft /> Back to Processes
      </div>

      <div className="product-section" style={{paddingBottom: '2rem', borderBottom: '1px solid rgba(92, 74, 61, 0.2)'}}>
        <h1 style={{fontSize: '2.5rem', marginBottom: '0.25rem', marginTop: 0, textTransform: 'uppercase'}}>{PROCESS_DATA.name}</h1>
        <div style={{fontSize: '1.5rem', color: 'var(--color-stone)', fontStyle: 'italic', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)'}}>{PROCESS_DATA.ancientTerm}</div>
        <div className="urn" style={{display: 'inline-block'}}>URN: {PROCESS_DATA.urn}</div>
      </div>

      <div className="product-section">
        <h2>DESCRIPTION</h2>
        <p style={{fontSize: '1.1rem', lineHeight: '1.7', maxWidth: '800px'}}>{PROCESS_DATA.description}</p>
      </div>

      <div className="product-section">
        <h2>VARIATIONS</h2>
        {PROCESS_DATA.variations.map((v, i) => (
          <div key={i} style={{marginBottom: '1.5rem'}}>
            <h3 style={{fontSize: '1rem', color: 'var(--color-charcoal)', marginBottom: '0.5rem'}}>{v.name}</h3>
            <p style={{marginTop: 0, color: 'var(--color-earth)'}}>{v.description}</p>
          </div>
        ))}
      </div>

      <div className="product-section">
        <h2>INTERPRETATION NOTES</h2>
        <p style={{maxWidth: '800px'}}>{PROCESS_DATA.notes}</p>
      </div>

      <div className="product-section">
        <h2>RECIPES USING THIS PROCESS</h2>
        <ul style={{listStyle: 'none', padding: 0}}>
          {PROCESS_DATA.recipes.map((r, i) => (
            <li key={i} style={{marginBottom: '0.5rem', fontSize: '1.1rem'}}>
               <span style={{color: 'var(--color-amber)', marginRight: '0.5rem'}}>•</span>
               {r.route ? (
                 <span style={{cursor: 'pointer', textDecoration: 'underline'}} onClick={() => navigate(r.route)}>{r.name} →</span>
               ) : (
                 <span style={{color: 'var(--color-earth)'}}>{r.name}</span>
               )}
             </li>
          ))}
        </ul>
        <button className="text-btn" style={{marginTop: '1rem'}} onClick={() => navigate('archive')}>[View all recipes →]</button>
      </div>

      <div className="product-section" style={{borderBottom: 'none'}}>
        <h2>FURTHER READING</h2>
        <ul style={{listStyle: 'none', padding: 0}}>
          {PROCESS_DATA.reading.map((r, i) => (
            <li key={i} style={{marginBottom: '0.5rem', fontSize: '1.1rem'}}>
               <span style={{color: 'var(--color-amber)', marginRight: '0.5rem'}}>•</span>
               <span style={{color: 'var(--color-earth)'}}>{r.name} →</span>
             </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const ToolDetailPage = ({ navigate }) => {
  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate('tools')}>
        <Icons.ArrowLeft /> Back to Tools
      </div>

      <div className="product-section" style={{paddingBottom: '3rem', borderBottom: '1px solid rgba(92, 74, 61, 0.2)'}}>
        <div style={{display: 'flex', gap: '3rem'}}>
          <div style={{flex: 2}}>
             <h1 style={{fontSize: '2.5rem', marginBottom: '0.5rem', marginTop: 0}}>{TOOL_DATA.name}</h1>
             <div style={{marginBottom: '1.5rem'}}>
               {TOOL_DATA.ancientNames.map((n, i) => (
                 <span key={i} style={{fontSize: '1.25rem', color: 'var(--color-stone)', fontStyle: 'italic', marginRight: '1rem', fontFamily: 'var(--font-serif)'}}>{n}</span>
               ))}
             </div>
             <p style={{fontSize: '1.1rem', lineHeight: '1.7'}}>{TOOL_DATA.description}</p>
             <div className="urn" style={{display: 'inline-block', marginTop: '1rem'}}>URN: {TOOL_DATA.urn}</div>
          </div>
          <div style={{flex: 1}}>
             <div className="product-image-placeholder" style={{background: '#F0F0F0', border: '1px solid #ccc', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', color: '#666', marginBottom: '0.5rem'}}>
                {TOOL_DATA.image}
             </div>
             <div style={{fontSize: '0.75rem', color: 'var(--color-stone)', fontFamily: 'var(--font-sans)'}}>{TOOL_DATA.imageCaption}</div>
          </div>
        </div>
      </div>

      <div className="product-section">
        <h2>RELATED PROCESSES</h2>
        <ul style={{listStyle: 'none', padding: 0}}>
           {TOOL_DATA.processes.map((p, i) => (
             <li key={i} style={{marginBottom: '0.5rem', fontSize: '1.1rem'}}>
               <span style={{color: 'var(--color-amber)', marginRight: '0.5rem'}}>•</span>
               {p.name}
             </li>
           ))}
        </ul>
      </div>

       <div className="product-section" style={{borderBottom: 'none'}}>
        <h2>RECIPES USING THIS TOOL</h2>
        <ul style={{listStyle: 'none', padding: 0}}>
           {TOOL_DATA.recipes.map((r, i) => (
             <li key={i} style={{marginBottom: '0.5rem', fontSize: '1.1rem'}}>
               <span style={{color: 'var(--color-amber)', marginRight: '0.5rem'}}>•</span>
               <span style={{cursor: 'pointer', textDecoration: 'underline'}} onClick={() => navigate(r.route)}>{r.name} →</span>
             </li>
           ))}
        </ul>
      </div>
    </div>
  );
};

const IdentificationPage = ({ navigate }) => {
  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate(IDENTIFICATION_DATA.ancientTerm.route)}>
        <Icons.ArrowLeft /> Back to {IDENTIFICATION_DATA.ancientTerm.name.split(' ')[0]}
      </div>

      <div className="product-section" style={{paddingBottom: '2rem'}}>
        <h1 style={{textTransform: 'uppercase', fontSize: '2rem'}}>IDENTIFICATION</h1>
        <div style={{fontSize: '1.25rem', marginBottom: '1.5rem'}}>
           {IDENTIFICATION_DATA.ancientTerm.name.split(' ')[0]} <span style={{color: 'var(--color-stone)'}}>→</span> {IDENTIFICATION_DATA.identifiedAs.name}
        </div>
        <div className="urn">URN: {IDENTIFICATION_DATA.urn}</div>
      </div>

      <div className="product-section">
        <h2>THE CLAIM</h2>
        <div className="term-row" style={{border: 'none', padding: '0.25rem 0'}}>
           <div style={{fontWeight: 600}}>Ancient term:</div>
           <div><span className="text-btn" onClick={() => navigate(IDENTIFICATION_DATA.ancientTerm.route)}>{IDENTIFICATION_DATA.ancientTerm.name} →</span></div>
        </div>
        <div className="term-row" style={{border: 'none', padding: '0.25rem 0'}}>
           <div style={{fontWeight: 600}}>Identified as:</div>
           <div><span className="text-btn" onClick={() => navigate(IDENTIFICATION_DATA.identifiedAs.route)}>{IDENTIFICATION_DATA.identifiedAs.name} →</span></div>
        </div>
        <div className="term-row" style={{border: 'none', padding: '0.25rem 0'}}>
           <div style={{fontWeight: 600}}>Material source:</div>
           <div><span className="text-btn" onClick={() => navigate(IDENTIFICATION_DATA.materialSource.route)}>{IDENTIFICATION_DATA.materialSource.name} →</span></div>
        </div>
         <div className="term-row" style={{border: 'none', padding: '0.25rem 0', marginTop: '1rem'}}>
           <div style={{fontWeight: 600}}>Confidence:</div>
           <div><span className={`confidence-badge ${IDENTIFICATION_DATA.confidence}`}>{IDENTIFICATION_DATA.confidence}</span></div>
        </div>
      </div>

      <div className="product-section">
        <h2>SOURCE</h2>
        <p style={{marginBottom: '0.5rem'}}><strong>{IDENTIFICATION_DATA.source.citation}</strong></p>
        <p style={{marginTop: 0}}>Pages: {IDENTIFICATION_DATA.source.pages}</p>
        <button className="text-btn">[View work →]</button>
      </div>

      <div className="product-section" style={{borderBottom: 'none'}}>
        <h2>NOTES</h2>
        <p style={{maxWidth: '800px'}}>{IDENTIFICATION_DATA.notes}</p>
      </div>
    </div>
  );
};

const ProcessesPage = ({ navigate }) => (
    <div className="page-container">
        <div className="back-link" onClick={() => navigate('workshop')}>
            <Icons.ArrowLeft /> Back to Workshop
        </div>
        <div className="archive-intro">
            <h1>PROCESSES</h1>
            <p>Techniques for extracting and compounding aromatics.</p>
        </div>
        <div className="workshop-grid">
             <div className="workshop-card" onClick={() => navigate('process_enfleurage')}>
                <div className="card-top">
                  <h3>Enfleurage</h3>
                  <span className="type-tag">Extraction</span>
                </div>
                <div className="def">Cold or hot extraction of scent into fat/oil.</div>
              </div>
              <div className="workshop-card">
                <div className="card-top">
                  <h3>Maceration</h3>
                  <span className="type-tag">Extraction</span>
                </div>
                <div className="def">Steeping ingredients in heated oil.</div>
              </div>
              <div className="workshop-card">
                <div className="card-top">
                  <h3>Distillation</h3>
                  <span className="type-tag">Separation</span>
                </div>
                <div className="def">Separating components via boiling and condensation.</div>
              </div>
        </div>
    </div>
);

const ToolsPage = ({ navigate }) => (
    <div className="page-container">
        <div className="back-link" onClick={() => navigate('workshop')}>
            <Icons.ArrowLeft /> Back to Workshop
        </div>
        <div className="archive-intro">
            <h1>TOOLS</h1>
            <p>The equipment of the ancient laboratory.</p>
        </div>
        <div className="workshop-grid">
             <div className="workshop-card" onClick={() => navigate('tool_alembic')}>
                <div className="card-top">
                  <h3>Mortar & Pestle</h3>
                  <span className="type-tag">Processing</span>
                </div>
                <div className="def">Stone vessel for crushing materials.</div>
              </div>
              <div className="workshop-card">
                <div className="card-top">
                  <h3>Alembic</h3>
                  <span className="type-tag">Distillation</span>
                </div>
                <div className="def">Apparatus for distilling liquids.</div>
              </div>
              <div className="workshop-card">
                <div className="card-top">
                  <h3>Unguentarium</h3>
                  <span className="type-tag">Storage</span>
                </div>
                <div className="def">Small ceramic or glass bottle for perfume.</div>
              </div>
        </div>
    </div>
);

const ExperimentsPage = ({ navigate }) => (
    <div className="page-container">
        <div className="back-link" onClick={() => navigate('workshop')}>
            <Icons.ArrowLeft /> Back to Workshop
        </div>
        <div className="archive-intro">
            <h1>EXPERIMENTS</h1>
            <p>Replication stories and chemical analysis.</p>
        </div>
        <div className="section-block">
            <p style={{fontStyle: 'italic', color: 'var(--color-stone)'}}>Coming soon...</p>
        </div>
    </div>
);

const RecipePage = ({ navigate }) => {
  const [activeAnnotationId, setActiveAnnotationId] = useState(null);
  
  const activeAnnotation = activeAnnotationId ? RECIPE_DATA.annotations[activeAnnotationId] : null;

  return (
    <div className="page-container recipe-page">
      <div className="back-link" onClick={() => navigate('archive')}>
        <Icons.ArrowLeft /> Back to Recipes
      </div>
      
      <div className="recipe-header">
        <h1>{RECIPE_DATA.title}</h1>
        <div className="subtitle">{RECIPE_DATA.source}</div>
        
        <div className="metadata-box source-box">
          <div className="meta-row">
            <span>{RECIPE_DATA.sourceDetail}</span>
          </div>
          <div className="meta-row">
            <span className="urn">{RECIPE_DATA.urn}</span>
            <div className="actions">
              <button className="text-btn">[Copy]</button>
              <button className="text-btn">[JSON-LD]</button>
            </div>
          </div>
        </div>

        <div className="view-toggles">
          <label><input type="radio" name="view" defaultChecked /> Translation</label>
          <label><input type="radio" name="view" /> Greek</label>
          <label><input type="radio" name="view" /> Side-by-side</label>
        </div>
      </div>

      <div className="recipe-split-view">
        <div className="text-column">
          <h2>THE TEXT</h2>
          <div className="recipe-text">
            {RECIPE_DATA.textSegments.map((seg, i) => {
              if (seg.type === 'annotation') {
                return (
                  <span 
                    key={i} 
                    className={`annotated-term ${activeAnnotationId === seg.id ? 'active' : ''}`}
                    onClick={() => setActiveAnnotationId(seg.id)}
                  >
                    {seg.text}
                  </span>
                );
              }
              return <span key={i}>{seg.text}</span>;
            })}
          </div>

          <div className="ingredients-section">
            <h2>INGREDIENTS</h2>
            <div className="ingredients-table">
              {RECIPE_DATA.ingredientsList.map((ing, i) => (
                <div className="ing-row" key={i}>
                  <span className="ing-name">{ing.name}</span>
                  <span className="ing-amt">{ing.amount}</span>
                  <span className="ing-role">{ing.role}</span>
                  <span className="ing-link" onClick={() => navigate('ingredient_smyrna')}>→ identifications</span>
                </div>
              ))}
            </div>
          </div>

          <div className="processes-section">
            <h2>PROCESSES</h2>
            <p>
                Chopping → Softening → <span className="text-btn" style={{cursor:'pointer'}} onClick={() => navigate('process_enfleurage')}>Boiling (Hot Enfleurage)</span> → Straining → <span className="text-btn" style={{cursor:'pointer'}} onClick={() => navigate('process_enfleurage')}>Enfleurage</span> → Storage
            </p>
          </div>
        </div>

        <div className={`notes-column ${activeAnnotation ? 'has-content' : ''}`}>
          <h2>NOTES</h2>
          {activeAnnotation ? (
            <div className="annotation-card fade-in">
              <div className="anno-header">
                <h3>{activeAnnotation.term}</h3>
                <span className="transliteration">{activeAnnotation.transliteration}</span>
              </div>
              <p>{activeAnnotation.definition}</p>
              <div className="anno-links">
                {activeAnnotation.links.map((link, i) => (
                  <button key={i} className="text-btn" onClick={() => navigate(link.route)}>
                    → {link.label}
                  </button>
                ))}
                {activeAnnotation.links.length === 0 && (
                   <button className="text-btn" onClick={() => navigate('ingredient_smyrna')}>
                   → View ancient term
                 </button>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              Click any highlighted term to see commentary.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AncientIngredientPage = ({ navigate }) => {
  return (
    <div className="page-container">
       <div className="back-link" onClick={() => navigate('workshop')}>
        <Icons.ArrowLeft /> Back to Workshop
      </div>

      <div className="header-block">
        <h1>{INGREDIENT_DATA.term}</h1>
        <div className="subtitle">{INGREDIENT_DATA.transliteration}</div>
        <div className="meta-row" style={{marginTop: '1rem'}}>
          <span>Language: {INGREDIENT_DATA.language}</span>
          <span className="urn" style={{marginLeft: '1rem'}}>{INGREDIENT_DATA.urn}</span>
        </div>
      </div>

      <div className="section-block">
        <h2>WHAT THE ANCIENTS SAID</h2>
        {INGREDIENT_DATA.quotes.map((q, i) => (
          <div className="quote-block" key={i}>
            <strong>{q.author}</strong>
            <p>"{q.text}"</p>
          </div>
        ))}
      </div>

      <div className="section-block">
        <h2>MODERN IDENTIFICATIONS</h2>
        {INGREDIENT_DATA.identifications.map((id, i) => (
          <div className={`id-card confidence-${id.confidence}`} key={i}>
            <div className="id-card-header">
              <h3>{id.name}</h3>
              <span className={`confidence-badge ${id.confidence}`}>{id.confidence}</span>
            </div>
            <div className="id-source">from <em>{id.source}</em></div>
            <div className="id-citation">Proposed in: {id.citation}</div>
            {id.note && <div className="id-note">{id.note}</div>}
            <div className="id-actions">
              <button className="btn-secondary" onClick={() => navigate(id.linkRoute)}>View product</button>
              {id.claimRoute && <button className="btn-secondary" onClick={() => navigate(id.claimRoute)}>View claim</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductPage = ({ navigate }) => {
  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate('ingredients')}>
        <Icons.ArrowLeft /> Back to Ingredients
      </div>

      <div className="product-section" style={{paddingBottom: '3rem', borderBottom: '1px solid rgba(92, 74, 61, 0.2)'}}>
        <div style={{display: 'flex', gap: '3rem'}}>
           <div style={{flex: 2}}>
              <h1 style={{fontSize: '2.5rem', marginBottom: '0.25rem', marginTop: 0}}>{PRODUCT_DATA.name}</h1>
              <div style={{fontSize: '1.25rem', color: 'var(--color-stone)', fontStyle: 'italic', marginBottom: '1.5rem'}}>{PRODUCT_DATA.family}</div>
              <p style={{fontSize: '1.1rem', lineHeight: '1.7'}}>{PRODUCT_DATA.description}</p>
              
               <div className="urn" style={{display: 'inline-block', marginTop: '1rem'}}>URN: {PRODUCT_DATA.urn}</div>
           </div>
           <div style={{flex: 1}}>
              <div className="product-image-placeholder" style={{background: '#F0F0F0', border: '1px solid #ccc', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', color: '#666', marginBottom: '0.5rem'}}>
                 {PRODUCT_DATA.image}
              </div>
              <div style={{fontSize: '0.75rem', color: 'var(--color-stone)', fontFamily: 'var(--font-sans)'}}>{PRODUCT_DATA.imageCaption}</div>
           </div>
        </div>
      </div>

      <div className="product-section">
         <h2>SENSORY PROFILE</h2>
         <div className="profile-grid">
            <div className="profile-col">
               <h3>PRIMARY NOTES</h3>
               <ul>
                 {PRODUCT_DATA.profile.primary.map((note, i) => <li key={i}>{note}</li>)}
               </ul>
            </div>
            <div className="profile-col">
               <h3>SECONDARY NOTES</h3>
               <ul>
                 {PRODUCT_DATA.profile.secondary.map((note, i) => <li key={i}>{note}</li>)}
               </ul>
            </div>
         </div>
         <div style={{marginTop: '2rem'}}>
            <h3 style={{fontSize: '0.875rem', color: 'var(--color-stone)', marginBottom: '0.5rem'}}>OLFACTORY EVOLUTION</h3>
            <p>{PRODUCT_DATA.profile.evolution}</p>
         </div>
         <div style={{marginTop: '1.5rem'}}>
            <h3 style={{fontSize: '0.875rem', color: 'var(--color-stone)', marginBottom: '0.5rem'}}>COMPARABLE MATERIALS</h3>
            <p>{PRODUCT_DATA.profile.comparable}</p>
         </div>
      </div>

      <div className="product-section">
         <h2>MATERIAL SOURCE</h2>
         <div className="term-row" style={{border: 'none', padding: '0.25rem 0'}}>
             <div style={{fontWeight: 600}}>Botanical Source:</div>
             <div><span className="text-btn" onClick={() => navigate('source_commiphora')}>{PRODUCT_DATA.source.name} →</span></div>
         </div>
         <div className="term-row" style={{border: 'none', padding: '0.25rem 0'}}>
             <div style={{fontWeight: 600}}>Family:</div>
             <div>{PRODUCT_DATA.source.family}</div>
         </div>
         <div className="term-row" style={{border: 'none', padding: '0.25rem 0'}}>
             <div style={{fontWeight: 600}}>Part Used:</div>
             <div>{PRODUCT_DATA.source.part}</div>
         </div>
      </div>

      <div className="product-section">
         <h2>ANCIENT TERMINOLOGY</h2>
         <div className="workshop-grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'}}>
            {PRODUCT_DATA.ancientTerms.map((term, i) => (
               <div className="workshop-card" key={i} onClick={() => term.term === 'σμύρνα' ? navigate('ingredient_smyrna') : null}>
                 <div className="card-top">
                   <h3>{term.term}</h3>
                   <span className="lang-tag">{term.language}</span>
                 </div>
                 <div className="def" style={{marginTop: '0.5rem', fontSize: '0.8rem'}}>
                    Confidence: <span className={`confidence-badge ${term.confidence}`} style={{fontSize: '0.65rem'}}>{term.confidence}</span>
                 </div>
               </div>
            ))}
         </div>
      </div>

      <div className="product-section" style={{borderBottom: 'none'}}>
         <h2>MODERN AVAILABILITY</h2>
         <p><strong>{PRODUCT_DATA.availability.status}</strong></p>
         <p>{PRODUCT_DATA.availability.details}</p>
      </div>
    </div>
  );
};

const SourceDetailPage = ({ navigate }) => {
  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate('sources')}>
        <Icons.ArrowLeft /> Back to Sources
      </div>

      <div className="product-section" style={{paddingBottom: '3rem', borderBottom: '1px solid rgba(92, 74, 61, 0.2)'}}>
        <div style={{display: 'flex', gap: '3rem'}}>
           <div style={{flex: 2}}>
              <h1 style={{fontSize: '2.5rem', marginBottom: '0.25rem', marginTop: 0, fontStyle: 'italic', fontFamily: 'var(--font-serif)'}}>{COMMIPHORA_DATA.name}</h1>
              <div style={{fontSize: '1.25rem', color: 'var(--color-stone)', marginBottom: '1.5rem'}}>{COMMIPHORA_DATA.commonName} • {COMMIPHORA_DATA.family}</div>
              <p style={{fontSize: '1.1rem', lineHeight: '1.7'}}>{COMMIPHORA_DATA.description}</p>
              
               <div className="urn" style={{display: 'inline-block', marginTop: '1rem'}}>URN: {COMMIPHORA_DATA.urn}</div>
           </div>
           <div style={{flex: 1}}>
              <div className="product-image-placeholder" style={{background: '#F0F0F0', border: '1px solid #ccc', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', color: '#666', marginBottom: '0.5rem'}}>
                 {COMMIPHORA_DATA.image}
              </div>
              <div style={{fontSize: '0.75rem', color: 'var(--color-stone)', fontFamily: 'var(--font-sans)'}}>{COMMIPHORA_DATA.imageCaption}</div>
           </div>
        </div>
      </div>

      <div className="product-section">
         <h2>NATIVE RANGE & ECOLOGY</h2>
         <p>{COMMIPHORA_DATA.nativeRange}</p>
      </div>

      <div className="product-section">
         <h2>PRODUCTS DERIVED</h2>
          <ul style={{listStyle: 'none', padding: 0}}>
           {COMMIPHORA_DATA.products.map((p, i) => (
             <li key={i} style={{marginBottom: '0.5rem', fontSize: '1.1rem'}}>
               <span style={{color: 'var(--color-amber)', marginRight: '0.5rem'}}>•</span>
               {p.route ? (
                 <span style={{cursor: 'pointer', textDecoration: 'underline'}} onClick={() => navigate(p.route)}>{p.name} →</span>
               ) : (
                 <span style={{color: 'var(--color-earth)'}}>{p.name}</span>
               )}
             </li>
           ))}
        </ul>
      </div>

      <div className="product-section" style={{borderBottom: 'none'}}>
         <h2>EXTERNAL RESOURCES</h2>
         <ul style={{listStyle: 'none', padding: 0}}>
           {COMMIPHORA_DATA.externalResources.map((r, i) => (
             <li key={i} style={{marginBottom: '0.5rem', fontSize: '1.1rem'}}>
               <span style={{color: 'var(--color-amber)', marginRight: '0.5rem'}}>•</span>
               <a href={r.url} target="_blank" rel="noopener noreferrer" style={{color: 'var(--color-earth)', textDecoration: 'underline'}}>{r.name} ↗</a>
             </li>
           ))}
        </ul>
      </div>
    </div>
  );
};

const ArchivePage = ({ navigate }) => {
  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate('library')}>
        <Icons.ArrowLeft /> Back to Library
      </div>

      <div className="archive-intro">
        <h1>RECIPES</h1>
        <p>Explore the ancient perfume recipes in our collection.</p>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <select><option>Source: All works</option></select>
          <select><option>Period: All periods</option></select>
          <select><option>Ingredient: All ingredients</option></select>
          <select><option>Process: All processes</option></select>
        </div>
        <div className="filter-meta">
          <button className="text-btn">Clear filters</button>
          <span>Showing 47 recipes</span>
        </div>
      </div>

      <div className="recipe-grid">
        <div className="recipe-card">
          <h3>ROSE PERFUME</h3>
          <div className="card-sub">Dioscorides, Mat. Med. 1.43</div>
          <div className="card-meta">
            <div>Period: Roman</div>
            <div>Ingredients: 4</div>
          </div>
          <button className="btn-primary" onClick={() => navigate('recipe_rose')}>View recipe</button>
        </div>
        
        <div className="recipe-card">
          <h3>LILY PERFUME</h3>
          <div className="card-sub">Dioscorides, Mat. Med. 1.62</div>
          <div className="card-meta">
            <div>Period: Roman</div>
            <div>Ingredients: 6</div>
          </div>
          <button className="btn-primary">View recipe</button>
        </div>

        <div className="recipe-card">
          <h3>MEGALLEION</h3>
          <div className="card-sub">Dioscorides, Mat. Med. 1.59</div>
          <div className="card-meta">
            <div>Period: Hellenistic/Roman</div>
            <div>Ingredients: 8</div>
          </div>
          <button className="btn-primary">View recipe</button>
        </div>
         <div className="recipe-card">
          <h3>CINNAMON PERFUME</h3>
          <div className="card-sub">Dioscorides, Mat. Med. 1.61</div>
          <div className="card-meta">
            <div>Period: Roman</div>
            <div>Ingredients: 5</div>
          </div>
          <button className="btn-primary">View recipe</button>
        </div>
      </div>
      
      <div style={{display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', fontFamily: 'var(--font-sans)', fontSize: '0.875rem'}}>
         <span>[← Previous]</span>
         <span>Page 1 of 12</span>
         <span style={{cursor: 'pointer', color: 'var(--color-amber)'}}>[Next →]</span>
      </div>
    </div>
  );
};

const ProjectPage = ({ navigate }) => (
  <div className="page-container">
    <div className="back-link" onClick={() => navigate('about')}>
      <Icons.ArrowLeft /> Back to About
    </div>
    <h1>About the Project</h1>
    <div className="section-block">
      <p style={{fontSize: '1.25rem', marginBottom: '2rem'}}>Alchemies of Scent reconstructs the sensory past of antiquity through the interdisciplinary study of perfumery.</p>
      <p>Combining historical analysis, linguistic studies, and experimental archaeology, we aim to understand how ancient civilizations created, used, and understood scent.</p>
    </div>
  </div>
);

const TeamPage = ({ navigate }) => (
  <div className="page-container">
    <div className="back-link" onClick={() => navigate('about')}>
      <Icons.ArrowLeft /> Back to About
    </div>
    <h1>The Team</h1>
    <div className="section-block">
      <div className="recipe-grid" style={{marginTop: '2rem'}}>
        <div className="recipe-card" onClick={() => navigate('team_sean')} style={{cursor: 'pointer'}}>
          <h3>Principal Investigator</h3>
          <div className="card-sub">History of Science</div>
          <p>Leading the historical and chemical analysis of ancient recipes.</p>
        </div>
        <div className="recipe-card">
          <h3>Research Associate</h3>
          <div className="card-sub">Classic Philology</div>
          <p>Specializing in ancient Greek and Latin botanical terminology.</p>
        </div>
        <div className="recipe-card">
          <h3>Chemist</h3>
          <div className="card-sub">Organic Chemistry</div>
          <p>Conducting gas chromatography and mass spectrometry on reproductions.</p>
        </div>
      </div>
    </div>
  </div>
);

const NewsPage = ({ navigate }) => (
  <div className="page-container">
    <div className="back-link" onClick={() => navigate('about')}>
      <Icons.ArrowLeft /> Back to About
    </div>
    <h1>News & Updates</h1>
    <div className="section-block">
      <div className="metadata-box" style={{width: '100%', marginBottom: '1.5rem'}}>
        <div className="meta-row">
          <span style={{fontWeight: 600}}>Publication Release</span>
          <span style={{color: 'var(--color-stone)'}}>October 2023</span>
        </div>
        <p>Our latest paper on the reconstruction of the Mendesian perfume has been published in the American Journal of Archaeology.</p>
      </div>
      <div className="metadata-box" style={{width: '100%', marginBottom: '1.5rem'}}>
        <div className="meta-row">
          <span style={{fontWeight: 600}}>Conference Presentation</span>
          <span style={{color: 'var(--color-stone)'}}>September 2023</span>
        </div>
        <p>The team presented findings on resin distillation at the International Conference on History of Chemistry.</p>
      </div>
    </div>
  </div>
);

// --- New Pages: Historical Person, Team Member, Work Detail ---

const HistoricalPersonPage = ({ navigate }) => {
  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate('people')}>
        <Icons.ArrowLeft /> Back to People
      </div>

      <div className="product-section" style={{paddingBottom: '3rem', borderBottom: '1px solid rgba(92, 74, 61, 0.2)'}}>
        <div style={{display: 'flex', gap: '3rem'}}>
           <div style={{flex: 2}}>
              <h1 style={{fontSize: '2.5rem', marginBottom: '0.25rem', marginTop: 0, textTransform: 'uppercase'}}>{DIOSCORIDES_DETAIL.shortName}</h1>
              <div style={{fontSize: '1.25rem', color: 'var(--color-charcoal)', marginBottom: '0.5rem'}}>{DIOSCORIDES_DETAIL.name}</div>
              <div style={{fontSize: '1rem', color: 'var(--color-stone)', marginBottom: '1.5rem'}}>
                 <div>Floruit: {DIOSCORIDES_DETAIL.floruit}</div>
                 <div>Active in: {DIOSCORIDES_DETAIL.activeIn}</div>
              </div>
              <div className="urn" style={{display: 'inline-block', marginBottom: '1rem'}}>{DIOSCORIDES_DETAIL.urn}</div>
           </div>
           <div style={{flex: 1}}>
              <div className="product-image-placeholder" style={{background: '#F0F0F0', border: '1px solid #ccc', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', color: '#666'}}>
                 [{DIOSCORIDES_DETAIL.image}]
              </div>
           </div>
        </div>
      </div>

      <div className="product-section">
         <p style={{fontSize: '1.1rem', lineHeight: '1.7', maxWidth: '800px'}}>{DIOSCORIDES_DETAIL.bio}</p>
      </div>

      <div className="product-section">
         <h2>WORKS</h2>
         <ul style={{listStyle: 'none', padding: 0}}>
           {DIOSCORIDES_DETAIL.works.map((w, i) => (
             <li key={i} style={{marginBottom: '1rem', fontSize: '1.1rem'}}>
               {w.route ? (
                 <span className="text-btn" style={{fontSize: '1.1rem', cursor: 'pointer'}} onClick={() => navigate(w.route)}>{w.name} →</span>
               ) : (
                 <span style={{color: 'var(--color-earth)'}}>{w.name}</span>
               )}
               {w.detail && <div style={{fontSize: '0.9rem', color: 'var(--color-stone)', marginTop: '0.2rem', paddingLeft: '1rem'}}>{w.detail}</div>}
             </li>
           ))}
        </ul>
      </div>

      <div className="product-section">
         <h2>RECIPES BY DIOSCORIDES</h2>
         <div style={{marginBottom: '1rem', fontStyle: 'italic', color: 'var(--color-stone)'}}>Book 1: Aromatics</div>
         <ul style={{listStyle: 'none', padding: 0}}>
           {DIOSCORIDES_DETAIL.recipes.map((r, i) => (
             <li key={i} style={{marginBottom: '0.5rem', fontSize: '1.1rem'}}>
               <span style={{color: 'var(--color-amber)', marginRight: '0.5rem'}}>•</span>
               {r.route ? (
                 <span className="text-btn" style={{fontSize: '1.1rem', cursor: 'pointer'}} onClick={() => navigate(r.route)}>{r.name} →</span>
               ) : (
                 <span style={{color: 'var(--color-earth)'}}>{r.name}</span>
               )}
             </li>
           ))}
        </ul>
        <button className="text-btn" style={{marginTop: '1rem'}} onClick={() => navigate('archive')}>[View all 47 recipes →]</button>
      </div>

      <div className="product-section" style={{borderBottom: 'none'}}>
         <h2>EXTERNAL RESOURCES</h2>
         <ul style={{listStyle: 'none', padding: 0}}>
           {DIOSCORIDES_DETAIL.external.map((e, i) => (
             <li key={i} style={{marginBottom: '0.5rem', fontSize: '1.1rem'}}>
               <span style={{color: 'var(--color-amber)', marginRight: '0.5rem'}}>•</span>
               <a href={e.url} target="_blank" rel="noopener noreferrer" style={{color: 'var(--color-earth)', textDecoration: 'underline'}}>{e.name} ↗</a>
             </li>
           ))}
        </ul>
      </div>
    </div>
  );
};

const TeamMemberPage = ({ navigate }) => {
  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate('team')}>
        <Icons.ArrowLeft /> Back to Team
      </div>

      <div className="product-section" style={{paddingBottom: '3rem', borderBottom: '1px solid rgba(92, 74, 61, 0.2)'}}>
        <div style={{display: 'flex', gap: '3rem'}}>
           <div style={{flex: 2}}>
              <h1 style={{fontSize: '2.5rem', marginBottom: '0.5rem', marginTop: 0, textTransform: 'uppercase'}}>{SEAN_DETAIL.name}</h1>
              <div style={{fontSize: '1.25rem', color: 'var(--color-amber-dark)', marginBottom: '0.5rem'}}>{SEAN_DETAIL.role}</div>
              <div style={{fontSize: '1rem', color: 'var(--color-stone)', marginBottom: '1.5rem'}}>
                 <div>{SEAN_DETAIL.affiliation}</div>
                 <div style={{marginTop: '0.5rem'}}>ORCID: {SEAN_DETAIL.orcid}</div>
                 <div>Website: <a href={`https://${SEAN_DETAIL.website}`} target="_blank" rel="noopener noreferrer" style={{color: 'var(--color-amber)'}}>{SEAN_DETAIL.website} →</a></div>
              </div>
           </div>
           <div style={{flex: 1}}>
              <div className="product-image-placeholder" style={{background: '#F0F0F0', border: '1px solid #ccc', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', color: '#666'}}>
                 [{SEAN_DETAIL.image}]
              </div>
           </div>
        </div>
      </div>

      <div className="product-section">
         <p style={{fontSize: '1.1rem', lineHeight: '1.7', maxWidth: '800px'}}>{SEAN_DETAIL.bio}</p>
      </div>

      <div className="product-section">
         <h2>PUBLICATIONS</h2>
         <ul style={{listStyle: 'none', padding: 0}}>
           {SEAN_DETAIL.publications.map((p, i) => (
             <li key={i} style={{marginBottom: '1rem', fontSize: '1.1rem'}}>
               <span style={{color: 'var(--color-amber)', marginRight: '0.5rem'}}>•</span>
               <span style={{color: 'var(--color-earth)'}}>{p.title}</span> <span className="text-btn" style={{cursor: 'pointer'}}>→</span>
             </li>
           ))}
        </ul>
      </div>

      <div className="product-section" style={{borderBottom: 'none'}}>
         <h2>EXPERIMENTS</h2>
         <ul style={{listStyle: 'none', padding: 0}}>
           {SEAN_DETAIL.experiments.map((e, i) => (
             <li key={i} style={{marginBottom: '0.5rem', fontSize: '1.1rem'}}>
               <span style={{color: 'var(--color-amber)', marginRight: '0.5rem'}}>•</span>
               {e.route ? (
                 <span className="text-btn" style={{fontSize: '1.1rem', cursor: 'pointer'}} onClick={() => navigate(e.route)}>{e.title} →</span>
               ) : (
                 <span style={{color: 'var(--color-earth)'}}>{e.title}</span>
               )}
             </li>
           ))}
        </ul>
      </div>
    </div>
  );
};

const WorkDetailPage = ({ navigate }) => {
  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate('works')}>
        <Icons.ArrowLeft /> Back to Works
      </div>

      <div className="product-section" style={{paddingBottom: '2rem', borderBottom: '1px solid rgba(92, 74, 61, 0.2)'}}>
        <h1 style={{textTransform: 'uppercase', fontSize: '2.5rem', marginBottom: '0.5rem'}}>{MATERIA_MEDICA_DETAIL.title}</h1>
        <div style={{fontSize: '1.5rem', marginBottom: '1.5rem'}}>
           <span className="text-btn" style={{fontSize: '1.5rem', cursor: 'pointer'}} onClick={() => navigate(MATERIA_MEDICA_DETAIL.author.route)}>{MATERIA_MEDICA_DETAIL.author.name} →</span>
        </div>
        <div className="metadata-box" style={{minWidth: 'auto', display: 'inline-block', paddingRight: '2rem'}}>
             <div className="meta-row">Date: {MATERIA_MEDICA_DETAIL.date}</div>
             <div className="meta-row">Language: {MATERIA_MEDICA_DETAIL.language}</div>
             <div className="meta-row">Type: {MATERIA_MEDICA_DETAIL.type}</div>
        </div>
        <div className="urn" style={{marginTop: '1rem'}}>{MATERIA_MEDICA_DETAIL.urn}</div>
      </div>

      <div className="product-section">
        <p style={{fontSize: '1.1rem', lineHeight: '1.7', maxWidth: '800px'}}>{MATERIA_MEDICA_DETAIL.description}</p>
      </div>

      <div className="product-section">
        <h2>EDITIONS</h2>
        {MATERIA_MEDICA_DETAIL.editions.map((ed, i) => (
          <div key={i} style={{marginBottom: '1.5rem'}}>
             <div style={{fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem'}}>{ed.name} <span className="text-btn">→</span></div>
             <div style={{color: 'var(--color-stone)'}}>{ed.desc}</div>
          </div>
        ))}
      </div>

      <div className="product-section">
        <h2>TRANSLATIONS</h2>
        <ul style={{listStyle: 'none', padding: 0}}>
           {MATERIA_MEDICA_DETAIL.translations.map((t, i) => (
             <li key={i} style={{marginBottom: '0.5rem', fontSize: '1.1rem'}}>
               <span style={{color: 'var(--color-earth)'}}>{t.name}</span> <span className="text-btn" style={{cursor: 'pointer'}}>→</span>
             </li>
           ))}
        </ul>
      </div>

      <div className="product-section" style={{borderBottom: 'none'}}>
        <h2>RECIPES FROM THIS WORK</h2>
        <div style={{marginBottom: '1rem', fontStyle: 'italic', color: 'var(--color-stone)'}}>Book 1: Aromatics</div>
        <ul style={{listStyle: 'none', padding: 0}}>
          {MATERIA_MEDICA_DETAIL.recipes.map((r, i) => (
            <li key={i} style={{marginBottom: '0.5rem', fontSize: '1.1rem'}}>
               <span style={{color: 'var(--color-amber)', marginRight: '0.5rem'}}>•</span>
               {r.route ? (
                 <span style={{cursor: 'pointer', textDecoration: 'underline'}} onClick={() => navigate(r.route)}>{r.name} →</span>
               ) : (
                 <span style={{color: 'var(--color-earth)'}}>{r.name}</span>
               )}
             </li>
          ))}
        </ul>
        <button className="text-btn" style={{marginTop: '1rem'}} onClick={() => navigate('archive')}>[View all 47 recipes →]</button>
      </div>
    </div>
  );
};

// --- Main App & Styles ---

const GlobalStyles = () => (
  <style>{`
    :root {
      --color-cream: #FAF7F0;
      --color-warm-white: #FEFDFB;
      --color-amber: #C9A227;
      --color-amber-dark: #8B6914;
      --color-sage: #7A8B6E;
      --color-earth: #5C4A3D;
      --color-charcoal: #2D2A26;
      --color-stone: #9A9487;
      --font-serif: 'Gentium Plus', 'Gentium', serif;
      --font-sans: 'Noto Sans', 'Arial', sans-serif;
    }

    * { box-sizing: border-box; }

    body {
      background-color: var(--color-cream);
      color: var(--color-earth);
      font-family: var(--font-serif);
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }

    h1, h2, h3, h4 {
      font-family: var(--font-sans);
      color: var(--color-charcoal);
      margin-top: 0;
    }
    
    h1 { font-size: 2.5rem; font-weight: 600; line-height: 1.2; margin-bottom: 0.5rem; }
    h2 { font-size: 1.125rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid rgba(92, 74, 61, 0.2); padding-bottom: 0.5rem; margin-bottom: 1.5rem; margin-top: 2rem; }
    h3 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }

    button { font-family: var(--font-sans); cursor: pointer; }
    
    .text-btn { background: none; border: none; color: var(--color-amber); padding: 0; font-size: 0.875rem; text-decoration: underline; }
    .text-btn:hover { color: var(--color-amber-dark); }
    .icon-btn { background: none; border: 1px solid transparent; color: var(--color-stone); padding: 0.2rem; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 600; }
    .icon-btn.active { background: rgba(201, 162, 39, 0.1); color: var(--color-amber); border-color: rgba(201, 162, 39, 0.3); }

    .btn-primary {
      background: var(--color-amber);
      color: var(--color-warm-white);
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      font-weight: 500;
      transition: background 0.2s;
    }
    .btn-primary:hover { background: var(--color-amber-dark); }

    .btn-secondary {
      background: transparent;
      color: var(--color-amber);
      border: 1px solid var(--color-amber);
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-size: 0.875rem;
      transition: all 0.2s;
    }
    .btn-secondary:hover { background: rgba(201, 162, 39, 0.1); }

    /* Header */
    .site-header {
      background: var(--color-warm-white);
      border-bottom: 1px solid rgba(92, 74, 61, 0.1);
      padding: 1.5rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo-title { font-family: var(--font-sans); font-weight: 700; letter-spacing: 0.1em; font-size: 1.125rem; color: var(--color-charcoal); }
    .logo-subtitle { font-family: var(--font-serif); font-style: italic; color: var(--color-stone); font-size: 1rem; }
    .logo-section { cursor: pointer; }

    .main-nav { display: flex; gap: 2rem; align-items: center; }
    .nav-item { 
      font-family: var(--font-sans); font-size: 0.9375rem; color: var(--color-charcoal); cursor: pointer; display: flex; align-items: center; gap: 0.25rem; position: relative;
    }
    .nav-item .dropdown {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      background: var(--color-warm-white);
      border: 1px solid rgba(92, 74, 61, 0.1);
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      min-width: 180px;
      z-index: 100;
      padding: 0.5rem 0;
      border-radius: 4px;
    }
    .nav-item:hover .dropdown { display: block; }
    .dropdown div { padding: 0.5rem 1rem; color: var(--color-earth); transition: background 0.1s; }
    .dropdown div:hover { background: var(--color-cream); color: var(--color-amber); }
    .dropdown-section-title { font-size: 0.75rem; text-transform: uppercase; color: var(--color-stone) !important; font-weight: 600; padding: 0.5rem 1rem 0.2rem 1rem !important; letter-spacing: 0.05em; margin-top: 0.5rem; pointer-events: none; }
    .dropdown-section-title:first-child { margin-top: 0; }

    /* Footer */
    .site-footer {
      background: var(--color-warm-white);
      border-top: 1px solid rgba(92, 74, 61, 0.1);
      padding: 3rem 2rem;
      margin-top: 4rem;
    }
    .footer-columns { display: flex; gap: 4rem; margin-bottom: 3rem; }
    .footer-columns .col { display: flex; flex-direction: column; gap: 0.5rem; }
    .col h4 { font-size: 0.875rem; color: var(--color-stone); text-transform: uppercase; margin-bottom: 0.5rem; }
    .col a { text-decoration: none; color: var(--color-earth); font-family: var(--font-sans); font-size: 0.9375rem; }
    .col a:hover { color: var(--color-amber); }
    .footer-bottom { border-top: 1px solid rgba(92, 74, 61, 0.1); padding-top: 1.5rem; font-size: 0.75rem; color: var(--color-stone); font-family: var(--font-sans); }

    /* Layout Utilities */
    .page-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      min-height: 80vh;
    }
    .back-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--color-stone);
      font-family: var(--font-sans);
      font-size: 0.875rem;
      margin-bottom: 2rem;
      cursor: pointer;
    }
    .back-link:hover { color: var(--color-amber); }
    .urn { font-family: monospace; font-size: 0.75rem; color: var(--color-stone); background: rgba(0,0,0,0.03); padding: 0.2rem 0.4rem; border-radius: 3px; }
    
    /* Workshop Styles */
    .workshop-header { margin-bottom: 3rem; }
    .intro-text { font-size: 1.25rem; max-width: 800px; color: var(--color-earth); }
    .workshop-section { margin-bottom: 4rem; }
    .workshop-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .workshop-card {
      background: var(--color-warm-white);
      border: 1px solid rgba(92, 74, 61, 0.1);
      border-radius: 8px;
      padding: 1.5rem;
      transition: all 0.2s;
      cursor: pointer;
    }
    .workshop-card:hover { transform: translateY(-3px); box-shadow: 0 8px 16px rgba(0,0,0,0.05); border-color: rgba(201, 162, 39, 0.3); }
    .card-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.25rem; }
    .workshop-card h3 { font-size: 1.125rem; margin: 0; color: var(--color-charcoal); }
    .lang-tag, .type-tag { font-family: var(--font-sans); font-size: 0.7rem; text-transform: uppercase; background: rgba(92, 74, 61, 0.05); padding: 0.1rem 0.4rem; border-radius: 4px; color: var(--color-stone); letter-spacing: 0.05em; }
    .translit { font-style: italic; font-family: var(--font-serif); color: var(--color-amber-dark); margin-bottom: 0.75rem; font-size: 0.9375rem; }
    .def { font-family: var(--font-sans); font-size: 0.875rem; color: var(--color-earth); }

    /* Materials Nav */
    .materials-nav {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      border-bottom: 1px solid rgba(92, 74, 61, 0.2);
      padding-bottom: 0.5rem;
    }
    .materials-nav button {
      background: none;
      border: none;
      font-family: var(--font-sans);
      font-size: 0.9375rem;
      color: var(--color-stone);
      padding: 0.5rem 1rem;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s;
    }
    .materials-nav button:hover {
      color: var(--color-amber);
      background: rgba(201, 162, 39, 0.05);
    }
    .materials-nav button.active {
      color: var(--color-amber-dark);
      background: rgba(201, 162, 39, 0.1);
      font-weight: 600;
    }

    /* AZ List */
    .az-container { margin-top: 2rem; }
    .az-nav { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-bottom: 3rem; font-family: var(--font-sans); border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 1.5rem; }
    .az-nav a { text-decoration: none; color: var(--color-amber); font-weight: 600; padding: 0.25rem 0.5rem; border-radius: 4px; transition: background 0.1s; }
    .az-nav a:hover { background: rgba(201, 162, 39, 0.1); }
    .az-nav a.disabled { color: var(--color-stone); opacity: 0.5; pointer-events: none; }
    .az-group { margin-bottom: 3rem; }
    .az-group h2 { color: var(--color-stone); border-bottom: 2px solid rgba(201, 162, 39, 0.3); display: inline-block; padding-bottom: 0.25rem; margin-bottom: 1.5rem; }
    .az-list { display: flex; flex-direction: column; gap: 1rem; }
    .az-card { background: white; border: 1px solid rgba(0,0,0,0.05); padding: 1.5rem; border-radius: 4px; }
    .az-card-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .az-card h3 { margin: 0; font-family: var(--font-serif); font-size: 1.25rem; }
    .az-card p { margin: 0 0 1rem 0; color: var(--color-stone); font-family: var(--font-sans); font-size: 0.9rem; }
    .az-actions { font-family: var(--font-sans); font-size: 0.875rem; color: var(--color-stone); }

    /* Library Page Styles */
    .library-hero { margin-bottom: 3rem; text-align: center; max-width: 800px; margin-left: auto; margin-right: auto; }
    .library-hero h1 { font-size: 3rem; margin-bottom: 1rem; }
    .library-hero .intro-text { font-size: 1.35rem; color: var(--color-earth); line-height: 1.5; }

    .library-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 3rem;
    }
    .library-section-card {
      background: var(--color-warm-white);
      border: 1px solid rgba(92, 74, 61, 0.1);
      border-radius: 8px;
      padding: 2.5rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      min-height: 300px;
      justify-content: flex-start;
      position: relative;
    }
    .library-section-card:hover {
       transform: translateY(-5px);
       box-shadow: 0 12px 24px rgba(92, 74, 61, 0.08);
       border-color: rgba(201, 162, 39, 0.4);
    }
    .library-section-card h2 {
       font-size: 2rem;
       margin: 0;
       color: var(--color-charcoal);
       font-family: var(--font-serif);
       border-bottom: none;
       padding-bottom: 0;
    }
    .library-count {
       font-family: var(--font-sans);
       color: var(--color-amber-dark);
       font-weight: 600;
       font-size: 0.75rem;
       text-transform: uppercase;
       letter-spacing: 0.1em;
       margin-bottom: -0.5rem;
    }
    .library-section-card button {
        margin-top: auto;
        align-self: flex-start;
        font-size: 1rem;
    }

    /* Home Page Styles */
    .home-hero {
      padding: 6rem 2rem;
      text-align: center;
      background: linear-gradient(to bottom, var(--color-warm-white), var(--color-cream));
      border-bottom: 1px solid rgba(92, 74, 61, 0.1);
      margin: -2rem -2rem 4rem -2rem; /* breakout of page container padding */
    }
    .hero-super {
        font-family: var(--font-sans);
        text-transform: uppercase;
        letter-spacing: 0.2em;
        color: var(--color-amber-dark);
        margin-bottom: 1rem;
        font-size: 0.875rem;
    }
    .home-hero h1 {
        font-size: 4rem;
        margin-bottom: 1.5rem;
        letter-spacing: 0.05em;
    }
    .hero-text {
        font-size: 1.5rem;
        max-width: 700px;
        margin: 0 auto 3rem auto;
        color: var(--color-earth);
    }
    .hero-actions {
        display: flex;
        gap: 1.5rem;
        justify-content: center;
    }
    .home-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2.5rem;
        margin-top: 2rem;
    }
    .home-card {
        background: white;
        padding: 3rem 2rem;
        border: 1px solid rgba(92, 74, 61, 0.1);
        text-align: center;
        transition: all 0.3s ease;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .home-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 30px rgba(92, 74, 61, 0.1);
        border-color: rgba(201, 162, 39, 0.4);
    }
    .home-card h2 {
        font-family: var(--font-serif);
        font-size: 1.75rem;
        border-bottom: none;
        margin-bottom: 1rem;
        color: var(--color-charcoal);
    }
    .home-card p {
        color: var(--color-stone);
        margin-bottom: 2rem;
        font-size: 1rem;
        line-height: 1.6;
    }
    .link-text {
        margin-top: auto;
        color: var(--color-amber);
        font-family: var(--font-sans);
        font-weight: 500;
        text-transform: uppercase;
        font-size: 0.875rem;
        letter-spacing: 0.05em;
    }
    @media (max-width: 900px) {
        .home-grid { grid-template-columns: 1fr; }
        .home-hero h1 { font-size: 2.5rem; }
    }

    /* Recipe Page Specifics */
    .recipe-header { margin-bottom: 3rem; }
    .subtitle { font-size: 1.5rem; color: var(--color-stone); font-weight: 300; margin-bottom: 1.5rem; }
    .metadata-box { background: var(--color-warm-white); border: 1px solid rgba(92, 74, 61, 0.1); padding: 1rem; border-radius: 4px; margin-bottom: 2rem; display: inline-block; min-width: 50%; }
    .meta-row { display: flex; justify-content: space-between; align-items: center; font-family: var(--font-sans); font-size: 0.875rem; margin-bottom: 0.25rem; }
    .view-toggles { display: flex; gap: 1.5rem; font-family: var(--font-sans); font-size: 0.875rem; margin-top: 1rem; }
    
    .recipe-split-view { display: grid; grid-template-columns: 1.5fr 1fr; gap: 4rem; position: relative; }
    .recipe-text { font-size: 1.25rem; line-height: 1.8; white-space: pre-wrap; }
    
    .annotated-term {
      border-bottom: 2px solid rgba(201, 162, 39, 0.3);
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s;
    }
    .annotated-term:hover { background: rgba(201, 162, 39, 0.1); border-color: var(--color-amber); }
    .annotated-term.active { background: rgba(201, 162, 39, 0.2); border-color: var(--color-amber); color: var(--color-amber-dark); font-weight: 500; }

    .ingredients-table { font-family: var(--font-sans); font-size: 0.9375rem; }
    .ing-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr; border-bottom: 1px solid rgba(0,0,0,0.05); padding: 0.75rem 0; }
    .ing-name { font-weight: 600; color: var(--color-earth); }
    .ing-link { color: var(--color-stone); font-size: 0.8125rem; cursor: pointer; text-align: right; }
    .ing-link:hover { color: var(--color-amber); }

    /* Annotation Card */
    .notes-column { position: sticky; top: 2rem; align-self: start; }
    .annotation-card {
      background: var(--color-warm-white);
      border: 1px solid var(--color-amber);
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(139, 105, 20, 0.1);
    }
    .anno-header { border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 0.5rem; margin-bottom: 1rem; }
    .anno-header h3 { margin: 0; color: var(--color-amber-dark); font-family: var(--font-serif); }
    .transliteration { font-style: italic; color: var(--color-stone); }
    .anno-links { margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start; }
    .fade-in { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

    /* Archive & Cards */
    .filters-bar { 
      background: var(--color-warm-white); 
      border: 1px solid rgba(92, 74, 61, 0.2); 
      padding: 1.25rem; 
      border-radius: 4px; 
      margin-bottom: 2rem;
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .filter-group { display: flex; gap: 1rem; flex-wrap: wrap; }
    
    select { 
      padding: 0.6rem 1rem; 
      border: 1px solid var(--color-stone); 
      border-radius: 4px; 
      font-family: var(--font-sans); 
      color: var(--color-charcoal); 
      background-color: white;
      font-size: 0.9rem;
      min-width: 140px;
    }
    select:focus {
        outline: 2px solid var(--color-amber);
        border-color: var(--color-amber);
    }

    .filter-meta {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        margin-left: auto;
        font-size: 0.875rem;
        color: var(--color-stone);
        font-family: var(--font-sans);
    }
    
    .recipe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem; }
    .recipe-card {
      background: var(--color-warm-white);
      border: 1px solid rgba(92, 74, 61, 0.1);
      border-radius: 8px;
      padding: 1.5rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .recipe-card:hover { transform: translateY(-3px); box-shadow: 0 8px 16px rgba(0,0,0,0.05); }
    .card-sub { font-style: italic; color: var(--color-stone); margin-bottom: 1rem; font-family: var(--font-serif); }
    .card-meta { font-family: var(--font-sans); font-size: 0.875rem; color: var(--color-earth); margin-bottom: 1.5rem; }

    /* Ingredient & Product Pages */
    .quote-block { border-left: 3px solid var(--color-amber); padding-left: 1rem; margin-bottom: 1.5rem; font-style: italic; }
    .quote-block strong { display: block; font-style: normal; font-size: 0.875rem; color: var(--color-stone); margin-bottom: 0.25rem; font-family: var(--font-sans); }
    
    .id-card {
      background: var(--color-warm-white);
      border: 1px solid rgba(92, 74, 61, 0.1);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .id-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .confidence-badge { font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 12px; font-weight: 600; text-transform: uppercase; }
    .confidence-badge.established { background: rgba(122, 139, 110, 0.2); color: var(--color-sage); }
    .confidence-badge.probable { background: rgba(201, 162, 39, 0.2); color: var(--color-amber-dark); }
    
    .id-source { font-size: 1.125rem; margin-bottom: 0.25rem; }
    .id-citation { font-size: 0.875rem; color: var(--color-stone); font-family: var(--font-sans); }
    .id-actions { margin-top: 1.5rem; display: flex; gap: 1rem; }

    .product-hero { display: flex; gap: 3rem; margin-bottom: 3rem; }
    .product-info { flex: 2; }
    .product-image-placeholder { 
      flex: 1; background: #eee; display: flex; align-items: center; justify-content: center; 
      color: #999; border-radius: 8px; min-height: 200px; font-family: var(--font-sans); font-size: 0.875rem;
    }
    .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; }
    .profile-col h3 { font-size: 0.875rem; color: var(--color-stone); margin-bottom: 1rem; }
    .profile-col ul { list-style: none; padding: 0; }
    .profile-col li { margin-bottom: 0.5rem; position: relative; padding-left: 1.5rem; }
    .profile-col li::before { content: "●"; color: var(--color-amber); position: absolute; left: 0; font-size: 0.75rem; top: 0.3em; }

    /* New Product Page styles */
    .product-section {
      border-bottom: 1px solid rgba(92, 74, 61, 0.2);
      padding: 3rem 0;
    }
    .product-section:last-child { border-bottom: none; }
    .product-section h2 { margin-top: 0; }
    .term-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(0,0,0,0.05);
      font-family: var(--font-sans);
      font-size: 0.9375rem;
      align-items: center;
    }
    .term-row:last-child { border-bottom: none; }

    @media (max-width: 768px) {
      .recipe-split-view { grid-template-columns: 1fr; }
      .notes-column { display: none; /* In full implementation would be bottom sheet */ }
      .recipe-split-view .has-content.notes-column { display: block; position: fixed; bottom: 0; left: 0; right: 0; z-index: 1000; border-top: 2px solid var(--color-amber); }
      .site-header { flex-direction: column; gap: 1rem; align-items: flex-start; }
      .main-nav { flex-wrap: wrap; gap: 1rem; }
      .footer-columns { flex-direction: column; gap: 2rem; }
      .filters-bar { flex-direction: column; align-items: flex-start; }
      .filter-meta { width: 100%; justify-content: space-between; margin-left: 0; padding-top: 1rem; border-top: 1px solid rgba(92, 74, 61, 0.1); }
      
      .product-section > div[style*="flex"] { flex-direction: column; }
    }
  `}</style>
);

const App = () => {
  const [route, setRoute] = useState('home'); 

  useEffect(() => {
    document.title = "Alchemies of Scent — The Laboratory";
  }, []);

  const renderPage = () => {
    switch(route) {
      case 'home': return <HomePage navigate={setRoute} />;
      case 'library': return <LibraryPage navigate={setRoute} />;
      case 'archive': return <ArchivePage navigate={setRoute} />;
      case 'works': return <WorksPage navigate={setRoute} />;
      case 'people': return <PeoplePage navigate={setRoute} />;
      case 'recipe_rose': return <RecipePage navigate={setRoute} />;
      case 'ingredient_smyrna': return <AncientIngredientPage navigate={setRoute} />;
      case 'product_myrrh': return <ProductPage navigate={setRoute} />;
      case 'about': return <AboutPage navigate={setRoute} />;
      case 'project': return <ProjectPage navigate={setRoute} />;
      case 'team': return <TeamPage navigate={setRoute} />;
      case 'news': return <NewsPage navigate={setRoute} />;
      case 'workshop': return <WorkshopPage navigate={setRoute} />;
      case 'materials': return <MaterialsDashboardPage navigate={setRoute} />;
      case 'terms': return <TermsPage navigate={setRoute} />;
      case 'ingredients': return <IngredientsPage navigate={setRoute} />;
      case 'sources': return <SourcesPage navigate={setRoute} />;
      case 'source_commiphora': return <SourceDetailPage navigate={setRoute} />;
      case 'processes': return <ProcessesPage navigate={setRoute} />;
      case 'process_enfleurage': return <ProcessDetailPage navigate={setRoute} />;
      case 'tools': return <ToolsPage navigate={setRoute} />;
      case 'tool_alembic': return <ToolDetailPage navigate={setRoute} />;
      case 'identification_smyrna': return <IdentificationPage navigate={setRoute} />;
      case 'experiments': return <ExperimentsPage navigate={setRoute} />;
      
      // New Routes
      case 'person_dioscorides': return <HistoricalPersonPage navigate={setRoute} />;
      case 'team_sean': return <TeamMemberPage navigate={setRoute} />;
      case 'work_materia_medica': return <WorkDetailPage navigate={setRoute} />;
      case 'admin': return <AdminConsole navigate={setRoute} />;

      default: return <HomePage navigate={setRoute} />;
    }
  };

  return (
    <>
      <GlobalStyles />
      {route !== 'admin' && <Header navigate={setRoute} />}
      <main>
        {renderPage()}
      </main>
      {route !== 'admin' && <Footer navigate={setRoute} />}
    </>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);