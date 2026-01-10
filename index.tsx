import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

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
      links: []
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
      linkRoute: "product_myrrh"
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

const PRODUCT_DATA = {
  name: "Myrrh Resin",
  urn: "urn:aos:ingredient-product:myrrh-resin",
  description: "Aromatic resin harvested from trees of the genus Commiphora, native to the Horn of Africa and Arabian Peninsula.",
  family: "Resinous > Balsamic",
  profile: {
    primary: ["Balsamic (dominant)", "Warm (moderate)", "Slightly bitter (subtle)"],
    evolution: "Opens sharp and medicinal, almost bitter. Within minutes, softens to a warm, honeyed amber that persists for hours.",
    comparable: "Drier than labdanum, less sweet than benzoin. Shares balsamic notes with frankincense but darker, more complex, more medicinal."
  }
};

const WORKS_DATA = [
  {
    id: "dioscorides-materia-medica",
    title: "De materia medica",
    author: "Pedanius Dioscorides",
    date: "c. 50–70 CE",
    description: "The primary source for pharmacology and medical botany for over 1,500 years. Books 1 and 2 cover aromatics and oils.",
    urn: "urn:cts:greekLit:tlg0656.tlg001"
  },
  {
    id: "theophrastus-on-odors",
    title: "De odoribus (On Odors)",
    author: "Theophrastus",
    date: "c. 300 BCE",
    description: "A short treatise dealing specifically with perfumes, their ingredients, and manufacturing processes.",
    urn: "urn:cts:greekLit:tlg0093.tlg002"
  },
  {
    id: "pliny-natural-history",
    title: "Naturalis Historia",
    author: "Pliny the Elder",
    date: "c. 77 CE",
    description: "An encyclopedic work. Book 13 discusses trees and perfumes.",
    urn: "urn:cts:latinLit:phi0978.phi001"
  }
];

const PEOPLE_DATA = [
  {
    id: "dioscorides",
    name: "Pedanius Dioscorides",
    role: "Physician & Botanist",
    period: "1st Century CE",
    bio: "A Greek physician, pharmacologist, and botanist, employed in the Roman army. Author of De materia medica."
  },
  {
    id: "theophrastus",
    name: "Theophrastus",
    role: "Philosopher & Botanist",
    period: "c. 371 – c. 287 BCE",
    bio: "Successor to Aristotle in the Peripatetic school. Often called the 'father of botany'."
  },
  {
    id: "tapputi",
    name: "Tapputi-Belat-Ekallim",
    role: "Perfumer",
    period: "c. 1200 BCE",
    bio: "Considered the world's first recorded chemist, mentioned in a cuneiform tablet from Babylonia."
  }
];

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
            <div onClick={() => navigate('workshop')}>Ancient Terms</div>
            <div onClick={() => navigate('workshop')}>Ingredients</div>
            <div onClick={() => navigate('workshop')}>Material Sources</div>
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
        <a style={{cursor: 'pointer'}} onClick={() => navigate('workshop')}>Ancient Terms</a>
        <a style={{cursor: 'pointer'}} onClick={() => navigate('workshop')}>Ingredients</a>
        <a style={{cursor: 'pointer'}} onClick={() => navigate('workshop')}>Material Sources</a>
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
            <button className="btn-primary">View text</button>
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
            <button className="btn-secondary">View profile</button>
          </div>
        ))}
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
        <h2>ANCIENT TERMS</h2>
        <div className="workshop-grid">
          <div className="workshop-card" onClick={() => navigate('ingredient_smyrna')}>
            <div className="card-top">
              <h3>σμύρνα</h3>
              <span className="lang-tag">Greek</span>
            </div>
            <div className="translit">smyrna</div>
            <div className="def">Myrrh; a resinous gum.</div>
          </div>
          <div className="workshop-card">
            <div className="card-top">
              <h3>ἔλαιον</h3>
              <span className="lang-tag">Greek</span>
            </div>
            <div className="translit">elaion</div>
            <div className="def">Olive oil; liquid fat base.</div>
          </div>
          <div className="workshop-card">
            <div className="card-top">
              <h3>ῥόδα</h3>
              <span className="lang-tag">Greek</span>
            </div>
            <div className="translit">rhoda</div>
            <div className="def">Roses; floral aromatic.</div>
          </div>
          <div className="workshop-card">
            <div className="card-top">
              <h3>σχοῖνος</h3>
              <span className="lang-tag">Greek</span>
            </div>
            <div className="translit">skhoinos</div>
            <div className="def">Rush/Reed; possibly lemongrass.</div>
          </div>
        </div>
      </div>

      <div className="workshop-section">
        <h2>INGREDIENTS</h2>
        <div className="workshop-grid">
          <div className="workshop-card" onClick={() => navigate('product_myrrh')}>
            <div className="card-top">
              <h3>Myrrh Resin</h3>
              <span className="type-tag">Resin</span>
            </div>
            <div className="def">Source: Commiphora myrrha</div>
          </div>
          <div className="workshop-card">
            <div className="card-top">
              <h3>Omphacium Oil</h3>
              <span className="type-tag">Base</span>
            </div>
            <div className="def">Source: Olea europaea (unripe)</div>
          </div>
          <div className="workshop-card">
             <div className="card-top">
              <h3>Rose Petals</h3>
              <span className="type-tag">Floral</span>
            </div>
            <div className="def">Source: Rosa gallica</div>
          </div>
           <div className="workshop-card">
             <div className="card-top">
              <h3>Honey</h3>
              <span className="type-tag">Additive</span>
            </div>
            <div className="def">Source: Apis mellifera</div>
          </div>
        </div>
      </div>

      <div className="workshop-section">
        <h2>MATERIAL SOURCES</h2>
        <div className="workshop-grid">
           <div className="workshop-card">
            <h3>Commiphora myrrha</h3>
            <div className="def">Family: Burseraceae</div>
          </div>
          <div className="workshop-card">
            <h3>Olea europaea</h3>
            <div className="def">Family: Oleaceae</div>
          </div>
          <div className="workshop-card">
            <h3>Cymbopogon schoenanthus</h3>
            <div className="def">Family: Poaceae</div>
          </div>
          <div className="workshop-card">
            <h3>Rosa gallica</h3>
            <div className="def">Family: Rosaceae</div>
          </div>
           <div className="workshop-card">
            <h3>Apis mellifera</h3>
            <div className="def">Family: Apidae</div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
            <p>Chopping → Softening → Boiling → Straining → Enfleurage → Storage</p>
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
              <button className="btn-secondary">View source</button>
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
      <div className="back-link" onClick={() => navigate('workshop')}>
        <Icons.ArrowLeft /> Back to Workshop
      </div>

      <div className="product-hero">
        <div className="product-info">
          <h1>{PRODUCT_DATA.name}</h1>
          <div className="urn">{PRODUCT_DATA.urn}</div>
          <p className="description">{PRODUCT_DATA.description}</p>
        </div>
        <div className="product-image-placeholder">
          [Image: amber resin tears]
        </div>
      </div>

      <div className="section-block">
        <h2>SCENT PROFILE</h2>
        <div className="profile-grid">
          <div className="profile-col">
            <h3>PRIMARY NOTES</h3>
            <ul>
              {PRODUCT_DATA.profile.primary.map((note, i) => <li key={i}>{note}</li>)}
            </ul>
          </div>
          <div className="profile-col">
            <h3>EVOLUTION</h3>
            <p>{PRODUCT_DATA.profile.evolution}</p>
            <h3>COMPARABLE TO</h3>
            <p>{PRODUCT_DATA.profile.comparable}</p>
          </div>
        </div>
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
        <div className="recipe-card">
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
      --font-serif: 'Source Serif Pro', 'Georgia', serif;
      --font-sans: 'Inter', 'Helvetica Neue', sans-serif;
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
      min-width: 160px;
      z-index: 100;
      padding: 0.5rem 0;
      border-radius: 4px;
    }
    .nav-item:hover .dropdown { display: block; }
    .dropdown div { padding: 0.5rem 1rem; color: var(--color-earth); transition: background 0.1s; }
    .dropdown div:hover { background: var(--color-cream); color: var(--color-amber); }

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

    @media (max-width: 768px) {
      .recipe-split-view { grid-template-columns: 1fr; }
      .notes-column { display: none; /* In full implementation would be bottom sheet */ }
      .recipe-split-view .has-content.notes-column { display: block; position: fixed; bottom: 0; left: 0; right: 0; z-index: 1000; border-top: 2px solid var(--color-amber); }
      .site-header { flex-direction: column; gap: 1rem; align-items: flex-start; }
      .main-nav { flex-wrap: wrap; gap: 1rem; }
      .footer-columns { flex-direction: column; gap: 2rem; }
      .filters-bar { flex-direction: column; align-items: flex-start; }
      .filter-meta { width: 100%; justify-content: space-between; margin-left: 0; padding-top: 1rem; border-top: 1px solid rgba(92, 74, 61, 0.1); }
    }
  `}</style>
);

const App = () => {
  const [route, setRoute] = useState('home'); // Routes: home, library, archive, works, people, recipe_rose, ingredient_smyrna, product_myrrh, project, team, news, workshop, about

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
      default: return <HomePage navigate={setRoute} />;
    }
  };

  return (
    <>
      <GlobalStyles />
      <Header navigate={setRoute} />
      <main>
        {renderPage()}
      </main>
      <Footer navigate={setRoute} />
    </>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);