import React, { useMemo, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { AdminConsole } from "./AdminConsole";
import { assertRecipeAnnotationInvariants } from "./invariants";
import { loadState, StorageAdapter } from "./storage";
import type {
  AncientIngredient,
  DatabaseState,
  Identification,
  IngredientProduct,
  MasterEntity,
  MaterialSource,
  Recipe,
  RecipeItem,
} from "./types";
import {
  COMMIPHORA_DATA,
  DIOSCORIDES_DETAIL,
  IDENTIFICATION_DATA,
  INGREDIENT_DATA,
  MATERIA_MEDICA_DETAIL,
  PRODUCT_DATA,
  SEAN_DETAIL,
} from "./content/legacyFixtures";
import HomePage from "./pages/home/HomePage";
import SearchPage from "./pages/search/SearchPage";
import StudioPage from "./pages/studio/StudioPage";
import { createOrResumeStudioSession, setActiveStudioSessionId } from "./studio/storage";
import { resolveAncientTermIdForRecipeAnnotation, resolveAncientTermIdForRecipeItem } from "./workshop/resolveAncientTermId";

type ThemeMode = "light" | "dark";
const THEME_STORAGE_KEY = "AOS_THEME";

type WorkshopEntityKind = "ingredient" | "tool" | "process";

type WorkshopEntityRoute =
  | { kind: WorkshopEntityKind; mode: "master"; id: string }
  | { kind: WorkshopEntityKind; mode: "unlinked"; recipeId: string; itemId: string };

const parseWorkshopEntityRoute = (route: string): WorkshopEntityRoute | null => {
  if (route.startsWith("workshop-unlinked:")) {
    const [, kindRaw, recipeId, itemId] = route.split(":");
    if (!kindRaw || !recipeId || !itemId) return null;
    if (kindRaw !== "ingredient" && kindRaw !== "tool" && kindRaw !== "process") return null;
    return { kind: kindRaw, mode: "unlinked", recipeId, itemId };
  }

  if (route.startsWith("workshop-ingredient:")) {
    const [, id] = route.split(":");
    if (!id) return null;
    return { kind: "ingredient", mode: "master", id };
  }
  if (route.startsWith("workshop-tool:")) {
    const [, id] = route.split(":");
    if (!id) return null;
    return { kind: "tool", mode: "master", id };
  }
  if (route.startsWith("workshop-process:")) {
    const [, id] = route.split(":");
    if (!id) return null;
    return { kind: "process", mode: "master", id };
  }

  return null;
};

const formatAncientName = (entity: Pick<MasterEntity, "originalName" | "transliteratedName">): string => {
  if (!entity.originalName) return "";
  if (entity.transliteratedName) return `${entity.originalName} (${entity.transliteratedName})`;
  return entity.originalName;
};

type WorkshopCardModel = {
  key: string;
  title: string;
  tag: string;
  ancientLabel: string | null;
  description: string | null;
  usageLabel: string;
  route: string;
};

const buildWorkshopCardsFromRecipes = (
  db: DatabaseState,
): { ingredients: WorkshopCardModel[]; tools: WorkshopCardModel[]; processes: WorkshopCardModel[] } => {
  const usageByMasterId = {
    ingredient: new Map<string, Set<string>>(),
    tool: new Map<string, Set<string>>(),
    process: new Map<string, Set<string>>(),
  } as const;

  const unlinked = {
    ingredient: new Map<string, { recipeId: string; itemId: string; item: RecipeItem; recipeTitle: string }>(),
    tool: new Map<string, { recipeId: string; itemId: string; item: RecipeItem; recipeTitle: string }>(),
    process: new Map<string, { recipeId: string; itemId: string; item: RecipeItem; recipeTitle: string }>(),
  } as const;

  for (const recipe of db.recipes) {
    const recipeTitle = recipe.metadata?.title ?? recipe.id;
    for (const item of recipe.items ?? []) {
      if (item.type !== "ingredient" && item.type !== "tool" && item.type !== "process") continue;

      if (item.masterId) {
        const existing = usageByMasterId[item.type].get(item.masterId) ?? new Set<string>();
        existing.add(recipe.id);
        usageByMasterId[item.type].set(item.masterId, existing);
        continue;
      }

      const key = `${recipe.id}:${item.id}`;
      unlinked[item.type].set(key, { recipeId: recipe.id, itemId: item.id, item, recipeTitle });
    }
  }

  const mastersById = {
    ingredient: new Map<string, MasterEntity>(db.masterIngredients.map((m) => [m.id, m])),
    tool: new Map<string, MasterEntity>(db.masterTools.map((m) => [m.id, m])),
    process: new Map<string, MasterEntity>(db.masterProcesses.map((m) => [m.id, m])),
  } as const;

  const toCards = (kind: WorkshopEntityKind): WorkshopCardModel[] => {
    const cards: WorkshopCardModel[] = [];

    for (const [masterId, recipeIds] of usageByMasterId[kind].entries()) {
      const entity = mastersById[kind].get(masterId);
      if (!entity) continue;
      const ancientLabel = formatAncientName(entity) || null;
      const recipeCount = recipeIds.size;
      cards.push({
        key: `${kind}:${masterId}`,
        title: entity.name,
        tag: kind === "ingredient" ? "Ingredient" : kind === "tool" ? "Tool" : "Process",
        ancientLabel,
        description: entity.description || null,
        usageLabel: `Used in ${recipeCount} recipe${recipeCount === 1 ? "" : "s"}`,
        route: `workshop-${kind}:${masterId}`,
      });
    }

    for (const { recipeId, itemId, item, recipeTitle } of unlinked[kind].values()) {
      const title = (item.displayTerm || "").trim() || item.originalTerm || item.id;
      const ancientLabel =
        item.transliteration && item.originalTerm ? `${item.originalTerm} (${item.transliteration})` : item.originalTerm;
      cards.push({
        key: `${kind}:unlinked:${recipeId}:${itemId}`,
        title,
        tag: kind === "ingredient" ? "Ingredient" : kind === "tool" ? "Tool" : "Process",
        ancientLabel: ancientLabel || null,
        description: `Unlinked term from ${recipeTitle} (placeholder).`,
        usageLabel: "Used in 1 recipe",
        route: `workshop-unlinked:${kind}:${recipeId}:${itemId}`,
      });
    }

    cards.sort((a, b) => a.title.localeCompare(b.title));
    return cards;
  };

  return {
    ingredients: toCards("ingredient"),
    tools: toCards("tool"),
    processes: toCards("process"),
  };
};

type InterpretationRoute =
  | { kind: "ancient-term"; id: string }
  | { kind: "identification"; id: string }
  | { kind: "ingredient-product"; id: string }
  | { kind: "material-source"; id: string };

type RecipeRoute = { id: string };

const parseInterpretationRoute = (route: string): InterpretationRoute | null => {
  if (route.startsWith("ancient-term:")) {
    const [, id] = route.split(":");
    if (!id) return null;
    return { kind: "ancient-term", id };
  }
  if (route.startsWith("identification:")) {
    const [, id] = route.split(":");
    if (!id) return null;
    return { kind: "identification", id };
  }
  if (route.startsWith("ingredient-product:")) {
    const [, id] = route.split(":");
    if (!id) return null;
    return { kind: "ingredient-product", id };
  }
  if (route.startsWith("material-source:")) {
    const [, id] = route.split(":");
    if (!id) return null;
    return { kind: "material-source", id };
  }
  return null;
};

const parseRecipeRoute = (route: string): RecipeRoute | null => {
  if (!route.startsWith("recipe:")) return null;
  const [, id] = route.split(":");
  if (!id) return null;
  return { id };
};

type PersonRoute = { id: string };
type WorkRoute = { id: string };

const parsePersonRoute = (route: string): PersonRoute | null => {
  if (!route.startsWith("person:")) return null;
  const [, id] = route.split(":");
  if (!id) return null;
  return { id };
};

const parseWorkRoute = (route: string): WorkRoute | null => {
  if (!route.startsWith("work:")) return null;
  const [, id] = route.split(":");
  if (!id) return null;
  return { id };
};

const DemoBadge = ({ placeholder }: { placeholder?: boolean }) => {
  if (!placeholder) return null;
  return <span className="type-tag">Demo data</span>;
};

const formatRecipeLabel = (recipe: Pick<Recipe, "id" | "metadata">): string => {
  const title = recipe.metadata?.title ?? recipe.id;
  const parenthetical = [recipe.metadata?.author, recipe.metadata?.attribution].filter(Boolean).join(" / ");
  return parenthetical ? `${title} (${parenthetical})` : title;
};

const RecipeLinkCards = ({
  recipes,
  db,
  navigate,
}: {
  recipes: Recipe[];
  db: DatabaseState;
  navigate: (route: string) => void;
}) => {
  return (
    <div className="workshop-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
      {recipes.map((recipe) => {
        return (
          <div key={recipe.id} className="workshop-card" onClick={() => navigate(`recipe:${recipe.id}`)}>
            <div className="card-top">
              <h3>{formatRecipeLabel(recipe)} →</h3>
              <span className="type-tag">Recipe</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

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
  ),
  Moon: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  ),
  Sun: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.2" y1="4.2" x2="6.3" y2="6.3" />
      <line x1="17.7" y1="17.7" x2="19.8" y2="19.8" />
      <line x1="4.2" y1="19.8" x2="6.3" y2="17.7" />
      <line x1="17.7" y1="6.3" x2="19.8" y2="4.2" />
    </svg>
  ),
};

const Header = ({
  navigate,
  theme,
  toggleTheme,
}: {
  navigate: (route: string) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
}) => {
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
        <div className="nav-item" onClick={() => navigate('studio')} style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <span>Studio</span>
          <span className="type-tag" style={{fontSize: '0.65rem'}}>Preview</span>
        </div>
        <div className="nav-item">
          <span onClick={() => navigate('about')}>About</span> <Icons.ChevronDown />
          <div className="dropdown">
            <div onClick={() => navigate('project')}>Project</div>
            <div onClick={() => navigate('team')}>Team</div>
            <div onClick={() => navigate('news')}>News</div>
          </div>
        </div>
        <div className="nav-item search-icon" onClick={() => navigate('search')} title="Search">
          <Icons.Search />
        </div>
        <button
          type="button"
          className="icon-btn theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to day mode" : "Switch to night mode"}
          title={theme === "dark" ? "Day mode" : "Night mode"}
        >
          {theme === "dark" ? <Icons.Sun /> : <Icons.Moon />}
        </button>
        <div className="nav-item" onClick={() => navigate('admin')} style={{borderLeft: '1px solid var(--color-border-strong)', paddingLeft: '1.5rem', marginLeft: '0.5rem', color: 'var(--color-amber-dark)', fontWeight: 600}}>
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
        <h4 style={{cursor: 'pointer'}} onClick={() => navigate('studio')}>
          The Studio <span className="type-tag" style={{fontSize: '0.65rem', marginLeft: '0.4rem'}}>Preview</span>
        </h4>
        <a style={{cursor: 'pointer'}} onClick={() => navigate('studio')}>Studio (Preview)</a>
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

const WorksPage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const works = [...(db.masterWorks ?? [])].sort((a, b) => a.name.localeCompare(b.name));
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
        {works.map((work) => (
          <div className="recipe-card" key={work.id}>
            <h3>{work.name}</h3>
            <div className="card-sub">
              {[work.author, work.date].filter(Boolean).join(" • ")}
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--color-earth)", marginBottom: "1.5rem" }}>
              {work.description}
            </p>
            <div className="card-meta">
              <span className="urn">{work.urn}</span>
            </div>
            <button className="btn-primary" onClick={() => navigate(`work:${work.id}`)}>
              View work
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const PeoplePage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const people = [...(db.masterPeople ?? [])]
    .filter((p) => !(p.categories ?? []).includes("team"))
    .sort((a, b) => a.name.localeCompare(b.name));

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
        {people.map((person) => (
          <div className="recipe-card" key={person.id}>
            <h3>{person.name}</h3>
            <div className="card-sub">{[person.role, person.date].filter(Boolean).join(" • ")}</div>
            <p style={{ fontSize: "0.9rem", color: "var(--color-earth)", marginBottom: "1.5rem" }}>
              {person.description}
            </p>
            <button className="btn-secondary" onClick={() => navigate(`person:${person.id}`)}>
              View profile
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const PersonDetailPageDb = ({
  navigate,
  db,
  personId,
}: {
  navigate: (route: string) => void;
  db: DatabaseState;
  personId: string;
}) => {
  const person = (db.masterPeople ?? []).find((p) => p.id === personId) ?? null;
  const isTeam = (person?.categories ?? []).includes("team");

  const authoredWorks = (db.masterWorks ?? []).filter((w) => w.authorId === personId);
  const authoredWorkIds = new Set(authoredWorks.map((w) => w.id));
  const recipesByPerson = (db.recipes ?? []).filter((r) => authoredWorkIds.has(r.metadata?.sourceWorkId));

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate(isTeam ? "team" : "people")}>
        <Icons.ArrowLeft /> Back to {isTeam ? "Team" : "People"}
      </div>

      <div
        className="product-section"
        style={{ paddingBottom: "3rem", borderBottom: "1px solid var(--color-border-strong)" }}
      >
        <div style={{ display: "flex", gap: "3rem" }}>
          <div style={{ flex: 2 }}>
            <h1 style={{ fontSize: "2.5rem", marginBottom: "0.25rem", marginTop: 0 }}>
              {person?.name ?? "Person"}
            </h1>
            <div style={{ fontSize: "1.25rem", color: "var(--color-charcoal)", marginBottom: "0.5rem" }}>
              {person?.role ?? (isTeam ? "Team member" : "")}
            </div>
            <div style={{ fontSize: "1rem", color: "var(--color-stone)", marginBottom: "1.5rem" }}>
              {person?.date ? <div>{isTeam ? "Period" : "Floruit"}: {person.date}</div> : null}
              {person?.place ? <div>{isTeam ? "Affiliation" : "Associated place"}: {person.place}</div> : null}
              {person?.categories?.length ? <div>Categories: {person.categories.join(", ")}</div> : null}
            </div>
            {person?.urn ? <div className="urn" style={{ display: "inline-block", marginBottom: "1rem" }}>{person.urn}</div> : null}
          </div>
          <div style={{ flex: 1 }}>
            <div
              className="product-image-placeholder"
              style={{
                background: "#F0F0F0",
                border: "1px solid #ccc",
                height: "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-sans)",
                color: "#666",
              }}
            >
              [Portrait placeholder]
            </div>
          </div>
        </div>
      </div>

      <div className="product-section">
        <p style={{ fontSize: "1.1rem", lineHeight: "1.7", maxWidth: "800px" }}>
          {person?.description ?? "No description yet."}
        </p>
      </div>

      {!isTeam && (
        <div className="product-section">
          <h2>WORKS</h2>
          {!authoredWorks.length ? (
            <p style={{ color: "var(--color-stone)" }}>No works linked yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {authoredWorks.map((work) => (
                <li key={work.id} style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
                  <span className="text-btn" style={{ fontSize: "1.1rem", cursor: "pointer" }} onClick={() => navigate(`work:${work.id}`)}>
                    {work.name} →
                  </span>
                  {work.description ? (
                    <div style={{ fontSize: "0.9rem", color: "var(--color-stone)", marginTop: "0.2rem", paddingLeft: "1rem" }}>
                      {work.description}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="product-section" style={{ borderBottom: "none" }}>
        <h2>RECIPES</h2>
        {!recipesByPerson.length ? (
          <p style={{ color: "var(--color-stone)" }}>No recipes linked yet.</p>
        ) : (
          <RecipeLinkCards recipes={recipesByPerson} db={db} navigate={navigate} />
        )}
      </div>
    </div>
  );
};

const WorkDetailPageDb = ({
  navigate,
  db,
  workId,
}: {
  navigate: (route: string) => void;
  db: DatabaseState;
  workId: string;
}) => {
  const work = (db.masterWorks ?? []).find((w) => w.id === workId) ?? null;
  const author = work?.authorId ? (db.masterPeople ?? []).find((p) => p.id === work.authorId) : null;
  const recipesInWork = (db.recipes ?? []).filter((r) => r.metadata?.sourceWorkId === workId);

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate("works")}>
        <Icons.ArrowLeft /> Back to Works
      </div>

      <div className="product-section" style={{ paddingBottom: "2rem", borderBottom: "1px solid var(--color-border-strong)" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.25rem", marginTop: 0 }}>{work?.name ?? "Work"}</h1>
        <div style={{ fontSize: "1.25rem", color: "var(--color-charcoal)", marginBottom: "0.5rem" }}>
          {author ? (
            <span className="text-btn" style={{ fontSize: "1.25rem", cursor: "pointer" }} onClick={() => navigate(`person:${author.id}`)}>
              {author.name} →
            </span>
          ) : (
            <span>{work?.author ?? ""}</span>
          )}
        </div>
        <div style={{ fontSize: "1rem", color: "var(--color-stone)", marginBottom: "1.25rem" }}>
          {[work?.date, work?.language, work?.place].filter(Boolean).join(" • ")}
        </div>
        {work?.urn ? <div className="urn">URN: {work.urn}</div> : null}
      </div>

      <div className="product-section">
        <h2>DESCRIPTION</h2>
        <p style={{ fontSize: "1.1rem", lineHeight: "1.7", maxWidth: "800px" }}>{work?.description ?? "No description yet."}</p>
      </div>

      <div className="product-section" style={{ borderBottom: "none" }}>
        <h2>RECIPES IN THIS WORK</h2>
        {!recipesInWork.length ? (
          <p style={{ color: "var(--color-stone)" }}>No recipes linked yet.</p>
        ) : (
          <RecipeLinkCards recipes={recipesInWork} db={db} navigate={navigate} />
        )}
      </div>
    </div>
  );
};

const TermsPage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = db.ancientIngredients ?? [];
    if (!q) return [...items].sort((a, b) => a.term.localeCompare(b.term));
    return items
      .filter((item) => {
        return (
          item.term.toLowerCase().includes(q) ||
          (item.transliteration ?? "").toLowerCase().includes(q) ||
          (item.description ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [db.ancientIngredients, query]);

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate("workshop")}>
        <Icons.ArrowLeft /> Back to Workshop
      </div>

      <div className="archive-intro">
        <h1>ANCIENT TERMS</h1>
        <MaterialsSubNav navigate={navigate} active="terms" />
        <p>Recipes link to ancient terms only. These pages are a demo scaffold for the interpretation chain.</p>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search terms…"
            style={{ padding: "0.6rem 0.75rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}
          />
        </div>
        <div className="filter-meta">
          <button className="text-btn" onClick={() => setQuery("")}>
            Clear
          </button>
          <span>Showing {filtered.length} terms</span>
        </div>
      </div>

      <div className="workshop-grid">
        {filtered.map((item) => (
          <div className="workshop-card" key={item.id} onClick={() => navigate(`ancient-term:${item.id}`)}>
            <div className="card-top">
              <h3>{item.term}</h3>
              <DemoBadge placeholder={item.placeholder} />
            </div>
            {item.transliteration && <div className="translit">{item.transliteration}</div>}
            <div className="def">{item.description ?? "Demo term record."}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const IngredientsPage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = db.ingredientProducts ?? [];
    const next = !q
      ? [...items]
      : items.filter((item) => {
          return (
            item.label.toLowerCase().includes(q) || (item.description ?? "").toLowerCase().includes(q)
          );
        });
    next.sort((a, b) => a.label.localeCompare(b.label));
    return next;
  }, [db.ingredientProducts, query]);

  const azList = useMemo(() => {
    const grouped: Record<string, IngredientProduct[]> = {};
    for (const item of filtered) {
      const letter = (item.label[0] ?? "#").toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(item);
    }
    return grouped;
  }, [filtered]);

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate("workshop")}>
        <Icons.ArrowLeft /> Back to Workshop
      </div>

      <div className="archive-intro">
        <h1>INGREDIENTS</h1>
        <MaterialsSubNav navigate={navigate} active="ingredients" />
        <p>Ingredient Products are the modern interpretive targets linked from Ancient Terms via Identifications (demo scaffold).</p>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ingredient products…"
            style={{ padding: "0.6rem 0.75rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}
          />
        </div>

        <div className="filter-meta" style={{ gap: "1rem" }}>
          <div className="view-toggles" style={{ margin: 0 }}>
            <button
              className={`icon-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="A-Z List View"
            >
              A-Z
            </button>
            <button
              className={`icon-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              <Icons.Grid />
            </button>
          </div>
          <button className="text-btn" onClick={() => setQuery("")}>
            Clear
          </button>
          <span>{filtered.length} items</span>
        </div>
      </div>

      {viewMode === "list" && (
        <div className="az-container">
          <div className="az-nav">
            {["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"].map((char) => (
              <a key={char} href={`#az-${char}`} className={!azList[char] ? "disabled" : ""}>
                {char}
              </a>
            ))}
          </div>
          <div className="az-content">
            {Object.keys(azList)
              .sort()
              .map((char) => (
                <div key={char} id={`az-${char}`} className="az-group">
                  <h2>{char}</h2>
                  <div className="az-list">
                    {azList[char].map((item) => (
                      <div key={item.id} className="az-card">
                        <div className="az-card-header" style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                          <h3>{item.label}</h3>
                          <DemoBadge placeholder={item.placeholder} />
                        </div>
                        <p>{item.description ?? "Demo product record."}</p>
                        <div className="az-actions">
                          <button className="text-btn" onClick={() => navigate(`ingredient-product:${item.id}`)}>
                            [View product →]
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {viewMode === "grid" && (
        <div className="workshop-grid">
          {filtered.map((item) => (
            <div className="workshop-card" key={item.id} onClick={() => navigate(`ingredient-product:${item.id}`)}>
              <div className="card-top">
                <h3>{item.label}</h3>
                <DemoBadge placeholder={item.placeholder} />
              </div>
              <div className="def">{item.description ?? "Demo product record."}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SourcesPage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = db.materialSources ?? [];
    const next = !q
      ? [...items]
      : items.filter((item) => {
          return item.label.toLowerCase().includes(q) || (item.description ?? "").toLowerCase().includes(q);
        });
    next.sort((a, b) => a.label.localeCompare(b.label));
    return next;
  }, [db.materialSources, query]);

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate("workshop")}>
        <Icons.ArrowLeft /> Back to Workshop
      </div>

      <div className="archive-intro">
        <h1>MATERIAL SOURCES</h1>
        <MaterialsSubNav navigate={navigate} active="sources" />
        <p>Material Sources are the (placeholder) foundations for Ingredient Products in the interpretation chain.</p>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sources…"
            style={{ padding: "0.6rem 0.75rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}
          />
        </div>
        <div className="filter-meta">
          <button className="text-btn" onClick={() => setQuery("")}>
            Clear
          </button>
          <span>Showing {filtered.length} sources</span>
        </div>
      </div>

      <div className="workshop-grid">
        {filtered.map((item) => (
          <div className="workshop-card" key={item.id} onClick={() => navigate(`material-source:${item.id}`)}>
            <div className="card-top">
              <h3>{item.label}</h3>
              <DemoBadge placeholder={item.placeholder} />
            </div>
            <div className="def">{item.description ?? "Demo source record."}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AncientTermDetailPage = ({
  navigate,
  db,
  termId,
}: {
  navigate: (route: string) => void;
  db: DatabaseState;
  termId: string;
}) => {
  const term = (db.ancientIngredients ?? []).find((t) => t.id === termId) ?? null;
  const identifications = (db.identifications ?? []).filter((i) => i.ancientIngredientId === termId);

  const productsById = new Map<string, IngredientProduct>((db.ingredientProducts ?? []).map((p) => [p.id, p]));
  const sourcesById = new Map<string, MaterialSource>((db.materialSources ?? []).map((s) => [s.id, s]));

  const recipesUsing = (db.recipes ?? []).filter((r) =>
    (r.items ?? []).some((item) => item.type === "ingredient" && item.ancientTermId === termId),
  );

  const displayTerm = term?.term ?? termId;
  const displayTranslit = term?.transliteration ?? "";
  const urn = `urn:aos:ancient-ingredient:${termId}`;

  const demoQuotes = [
    {
      author: "Dioscorides",
      work: "De materia medica",
      locator: "Demo citation",
      text: `In this wireframe, ${displayTerm} is presented as an ancient ingredient term that may admit multiple modern identifications.`,
    },
    {
      author: "Project demo",
      work: "Demo Workshop Notes",
      locator: "Demo §0",
      text: `The quotation panel is placeholder content designed to preview layout and navigation, not scholarship.`,
    },
  ];

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate("terms")}>
        <Icons.ArrowLeft /> Back to Ancient Terms
      </div>

      <div className="product-section" style={{ paddingBottom: "2rem", borderBottom: "1px solid var(--color-border-strong)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <h1 style={{ marginTop: 0, marginBottom: "0.25rem" }}>{displayTerm}</h1>
            {displayTranslit && (
              <div style={{ fontSize: "1.25rem", color: "var(--color-stone)", fontStyle: "italic", fontFamily: "var(--font-serif)" }}>
                {displayTranslit}
              </div>
            )}
          </div>
          <DemoBadge placeholder={term?.placeholder ?? true} />
        </div>
        <div className="urn" style={{ display: "inline-block", marginTop: "1rem" }}>
          URN: {urn}
        </div>
      </div>

      <div className="product-section">
        <h2>DESCRIPTION</h2>
        <p style={{ maxWidth: "900px" }}>{term?.description ?? "Demo term record."}</p>
      </div>

      <div className="product-section">
        <h2>WHAT THE ANCIENTS SAID</h2>
        {demoQuotes.map((q, idx) => (
          <div className="quote-block" key={idx}>
            <strong>
              {q.author} — {q.work} ({q.locator})
            </strong>
            <p>"{q.text}"</p>
          </div>
        ))}
      </div>

      <div className="product-section">
        <h2>IDENTIFICATIONS</h2>
        {identifications.length === 0 ? (
          <p style={{ color: "var(--color-stone)" }}>No identifications found.</p>
        ) : (
          <div className="workshop-grid">
            {identifications.map((ident) => {
              const product = productsById.get(ident.ingredientProductId) ?? null;
              const source = ident.materialSourceId ? sourcesById.get(ident.materialSourceId) ?? null : null;
              return (
                <div className="workshop-card" key={ident.id} onClick={() => navigate(`identification:${ident.id}`)}>
                  <div className="card-top">
                    <h3>{product?.label ?? ident.ingredientProductId}</h3>
                    <DemoBadge placeholder={ident.placeholder} />
                  </div>
                  <div className="def" style={{ marginBottom: "0.5rem" }}>
                    Confidence: <span className="type-tag">{ident.confidence ?? "—"}</span>
                  </div>
                  {source && <div className="def">Source: {source.label}</div>}
                  {!source && <div className="def" style={{ color: "var(--color-stone)" }}>Source: —</div>}
                  <div className="def" style={{ marginTop: "0.75rem" }}>
                    <span className="text-btn" onClick={(e) => { e.stopPropagation(); navigate(`ingredient-product:${ident.ingredientProductId}`); }}>
                      → View product
                    </span>
                    {ident.materialSourceId && (
                      <span style={{ marginLeft: "1rem" }}>
                        <span
                          className="text-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`material-source:${ident.materialSourceId}`);
                          }}
                        >
                          → View source
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="product-section" style={{ borderBottom: "none" }}>
        <h2>RECIPES USING THIS TERM</h2>
        {recipesUsing.length === 0 ? (
          <p style={{ color: "var(--color-stone)" }}>No recipes found.</p>
        ) : (
          <RecipeLinkCards recipes={recipesUsing} db={db} navigate={navigate} />
        )}
      </div>
    </div>
  );
};

const IdentificationDetailPage = ({
  navigate,
  db,
  identificationId,
}: {
  navigate: (route: string) => void;
  db: DatabaseState;
  identificationId: string;
}) => {
  const ident = (db.identifications ?? []).find((i) => i.id === identificationId) ?? null;
  const term = ident ? (db.ancientIngredients ?? []).find((t) => t.id === ident.ancientIngredientId) ?? null : null;
  const product = ident ? (db.ingredientProducts ?? []).find((p) => p.id === ident.ingredientProductId) ?? null : null;
  const source = ident?.materialSourceId ? (db.materialSources ?? []).find((s) => s.id === ident.materialSourceId) ?? null : null;
  const work = ident?.workId ? (db.masterWorks ?? []).find((w) => w.id === ident.workId) ?? null : null;

  if (!ident) {
    return (
      <div className="page-container">
        <div className="back-link" onClick={() => navigate("terms")}>
          <Icons.ArrowLeft /> Back to Ancient Terms
        </div>
        <h1>Identification not found</h1>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate(`ancient-term:${ident.ancientIngredientId}`)}>
        <Icons.ArrowLeft /> Back to Term
      </div>

      <div className="product-section" style={{ paddingBottom: "2rem", borderBottom: "1px solid var(--color-border-strong)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <h1 style={{ marginTop: 0, marginBottom: "0.25rem" }}>IDENTIFICATION</h1>
            <div style={{ fontSize: "1.25rem" }}>
              {(term?.term ?? ident.ancientIngredientId) + " "} <span style={{ color: "var(--color-stone)" }}>→</span>{" "}
              {product?.label ?? ident.ingredientProductId}
            </div>
          </div>
          <DemoBadge placeholder={ident.placeholder} />
        </div>
        <div className="urn" style={{ display: "inline-block", marginTop: "1rem" }}>
          URN: urn:aos:identification:{identificationId}
        </div>
      </div>

      <div className="product-section">
        <h2>THE CLAIM</h2>
        <div className="term-row" style={{ gridTemplateColumns: "1fr 2fr" }}>
          <div style={{ fontWeight: 600 }}>Ancient term</div>
          <div>
            <span className="text-btn" onClick={() => navigate(`ancient-term:${ident.ancientIngredientId}`)}>
              {term?.term ?? ident.ancientIngredientId} →
            </span>
          </div>
        </div>
        <div className="term-row" style={{ gridTemplateColumns: "1fr 2fr" }}>
          <div style={{ fontWeight: 600 }}>Ingredient product</div>
          <div>
            <span className="text-btn" onClick={() => navigate(`ingredient-product:${ident.ingredientProductId}`)}>
              {product?.label ?? ident.ingredientProductId} →
            </span>
          </div>
        </div>
        <div className="term-row" style={{ gridTemplateColumns: "1fr 2fr" }}>
          <div style={{ fontWeight: 600 }}>Material source</div>
          <div>
            {ident.materialSourceId ? (
              <span className="text-btn" onClick={() => navigate(`material-source:${ident.materialSourceId}`)}>
                {source?.label ?? ident.materialSourceId} →
              </span>
            ) : (
              <span style={{ color: "var(--color-stone)" }}>—</span>
            )}
          </div>
        </div>
        <div className="term-row" style={{ gridTemplateColumns: "1fr 2fr" }}>
          <div style={{ fontWeight: 600 }}>Confidence</div>
          <div>
            <span className="type-tag">{ident.confidence ?? "—"}</span>
          </div>
        </div>
      </div>

      <div className="product-section" style={{ borderBottom: "none" }}>
        <h2>SOURCE</h2>
        <p style={{ marginBottom: "0.5rem" }}>
          <strong>{work?.name ?? "Demo source"}</strong>
        </p>
        <p style={{ marginTop: 0, color: "var(--color-stone)" }}>{ident.locator ?? "Demo locator"}</p>
        <p style={{ maxWidth: "900px" }}>{ident.notes ?? "Demo note."}</p>
      </div>
    </div>
  );
};

const IngredientProductDetailPage = ({
  navigate,
  db,
  productId,
}: {
  navigate: (route: string) => void;
  db: DatabaseState;
  productId: string;
}) => {
  const product = (db.ingredientProducts ?? []).find((p) => p.id === productId) ?? null;
  const identifications = (db.identifications ?? []).filter((i) => i.ingredientProductId === productId);
  const termsById = new Map<string, AncientIngredient>((db.ancientIngredients ?? []).map((t) => [t.id, t]));
  const sourcesById = new Map<string, MaterialSource>((db.materialSources ?? []).map((s) => [s.id, s]));

  const linkedTerms = identifications
    .map((i) => termsById.get(i.ancientIngredientId))
    .filter(Boolean) as AncientIngredient[];

  const linkedSources = identifications
    .map((i) => (i.materialSourceId ? sourcesById.get(i.materialSourceId) : undefined))
    .filter(Boolean) as MaterialSource[];

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate("ingredients")}>
        <Icons.ArrowLeft /> Back to Ingredients
      </div>

      <div className="product-section" style={{ paddingBottom: "2rem", borderBottom: "1px solid var(--color-border-strong)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <h1 style={{ marginTop: 0, marginBottom: "0.25rem" }}>{product?.label ?? productId}</h1>
          </div>
          <DemoBadge placeholder={product?.placeholder ?? true} />
        </div>
        <div className="urn" style={{ display: "inline-block", marginTop: "1rem" }}>
          URN: urn:aos:ingredient-product:{productId}
        </div>
      </div>

      <div className="product-section">
        <h2>DESCRIPTION</h2>
        <p style={{ maxWidth: "900px" }}>
          {product?.description ??
            "This is a demo product page used to preview how scent profiles and interpretation notes might be displayed."}
        </p>
      </div>

      <div className="product-section">
        <h2>ANCIENT TERMS (REVERSE LINK)</h2>
        {linkedTerms.length === 0 ? (
          <p style={{ color: "var(--color-stone)" }}>No linked ancient terms.</p>
        ) : (
          <div className="workshop-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
            {linkedTerms.map((t) => (
              <div className="workshop-card" key={t.id} onClick={() => navigate(`ancient-term:${t.id}`)}>
                <div className="card-top">
                  <h3>{t.term}</h3>
                  <DemoBadge placeholder={t.placeholder} />
                </div>
                {t.transliteration && <div className="translit">{t.transliteration}</div>}
                <div className="def">{t.description ?? "Demo term record."}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="product-section" style={{ borderBottom: "none" }}>
        <h2>MATERIAL SOURCES</h2>
        {linkedSources.length === 0 ? (
          <p style={{ color: "var(--color-stone)" }}>No linked material sources.</p>
        ) : (
          <div className="workshop-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
            {linkedSources.map((s) => (
              <div className="workshop-card" key={s.id} onClick={() => navigate(`material-source:${s.id}`)}>
                <div className="card-top">
                  <h3>{s.label}</h3>
                  <DemoBadge placeholder={s.placeholder} />
                </div>
                <div className="def">{s.description ?? "Demo source record."}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MaterialSourceDetailPage = ({
  navigate,
  db,
  sourceId,
}: {
  navigate: (route: string) => void;
  db: DatabaseState;
  sourceId: string;
}) => {
  const source = (db.materialSources ?? []).find((s) => s.id === sourceId) ?? null;
  const identifications = (db.identifications ?? []).filter((i) => i.materialSourceId === sourceId);
  const productsById = new Map<string, IngredientProduct>((db.ingredientProducts ?? []).map((p) => [p.id, p]));

  const linkedProducts = identifications
    .map((i) => productsById.get(i.ingredientProductId))
    .filter(Boolean) as IngredientProduct[];

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate("sources")}>
        <Icons.ArrowLeft /> Back to Material Sources
      </div>

      <div className="product-section" style={{ paddingBottom: "2rem", borderBottom: "1px solid var(--color-border-strong)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <h1 style={{ marginTop: 0, marginBottom: "0.25rem" }}>{source?.label ?? sourceId}</h1>
          </div>
          <DemoBadge placeholder={source?.placeholder ?? true} />
        </div>
        <div className="urn" style={{ display: "inline-block", marginTop: "1rem" }}>
          URN: urn:aos:material-source:{sourceId}
        </div>
      </div>

      <div className="product-section">
        <h2>DESCRIPTION</h2>
        <p style={{ maxWidth: "900px" }}>
          {source?.description ??
            "This is a demo source page used to preview how a biological/mineral source might be presented in the Workshop."}
        </p>
      </div>

      <div className="product-section" style={{ borderBottom: "none" }}>
        <h2>DERIVED PRODUCTS</h2>
        {linkedProducts.length === 0 ? (
          <p style={{ color: "var(--color-stone)" }}>No linked products.</p>
        ) : (
          <div className="workshop-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
            {linkedProducts.map((p) => (
              <div className="workshop-card" key={p.id} onClick={() => navigate(`ingredient-product:${p.id}`)}>
                <div className="card-top">
                  <h3>{p.label}</h3>
                  <DemoBadge placeholder={p.placeholder} />
                </div>
                <div className="def">{p.description ?? "Demo product record."}</div>
              </div>
            ))}
          </div>
        )}
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

const WorkshopEntityDetailPage = ({
  navigate,
  db,
  routeInfo,
}: {
  navigate: (route: string) => void;
  db: DatabaseState;
  routeInfo: WorkshopEntityRoute;
}) => {
  const entity =
    routeInfo.mode === "master"
      ? routeInfo.kind === "ingredient"
        ? db.masterIngredients.find((m) => m.id === routeInfo.id)
        : routeInfo.kind === "tool"
          ? db.masterTools.find((m) => m.id === routeInfo.id)
          : db.masterProcesses.find((m) => m.id === routeInfo.id)
      : null;

  const recipesUsingEntity =
    routeInfo.mode === "master"
      ? db.recipes.filter((r) => (r.items ?? []).some((i) => i.type === routeInfo.kind && i.masterId === routeInfo.id))
      : [];

  const unlinkedRecipe = routeInfo.mode === "unlinked" ? db.recipes.find((r) => r.id === routeInfo.recipeId) : null;
  const unlinkedItem =
    routeInfo.mode === "unlinked"
      ? (unlinkedRecipe?.items ?? []).find((i) => i.id === routeInfo.itemId && i.type === routeInfo.kind)
      : null;

  const backTarget = "workshop";
  const title =
    routeInfo.mode === "master"
      ? entity?.name ?? "Workshop card"
      : (unlinkedItem?.displayTerm || "").trim() || unlinkedItem?.originalTerm || "Workshop card";

  const ancientLabel =
    routeInfo.mode === "master" && entity
      ? formatAncientName(entity) || null
      : unlinkedItem?.originalTerm && unlinkedItem?.transliteration
        ? `${unlinkedItem.originalTerm} (${unlinkedItem.transliteration})`
        : unlinkedItem?.originalTerm ?? null;

  const urn =
    routeInfo.mode === "master"
      ? entity?.urn ?? null
      : unlinkedRecipe
        ? `urn:aos:unlinked:${routeInfo.kind}:${unlinkedRecipe.id}:${routeInfo.itemId}`
        : null;

  const description =
    routeInfo.mode === "master"
      ? entity?.description ?? null
      : "Auto-generated placeholder card for an unlinked term referenced in a recipe item.";

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate(backTarget)}>
        <Icons.ArrowLeft /> Back to Workshop
      </div>

      <div className="product-section" style={{ paddingBottom: "2rem", borderBottom: "1px solid var(--color-border-strong)" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.25rem", marginTop: 0 }}>{title}</h1>
        {ancientLabel && (
          <div
            style={{
              fontSize: "1.5rem",
              color: "var(--color-stone)",
              fontStyle: "italic",
              marginBottom: "1.25rem",
              fontFamily: "var(--font-serif)",
            }}
          >
            {ancientLabel}
          </div>
        )}
        {urn && <div className="urn" style={{ display: "inline-block" }}>URN: {urn}</div>}
      </div>

      <div className="product-section">
        <h2>DESCRIPTION</h2>
        <p style={{ fontSize: "1.1rem", lineHeight: "1.7", maxWidth: "900px" }}>
          {description ?? "Auto-generated placeholder description."}
        </p>
      </div>

      {routeInfo.mode === "unlinked" && unlinkedRecipe && unlinkedItem && (
        <div className="product-section">
          <h2>RECIPE ITEM</h2>
          <div className="term-row" style={{ gridTemplateColumns: "1fr 2fr", borderBottom: "none" }}>
            <div style={{ fontWeight: 600 }}>Recipe</div>
            <div>
              <span
                className="text-btn"
                style={{ fontSize: "0.95rem" }}
                onClick={() => navigate(`recipe:${unlinkedRecipe.id}`)}
              >
                {formatRecipeLabel(unlinkedRecipe)} →
              </span>
            </div>
          </div>
          <div className="term-row" style={{ gridTemplateColumns: "1fr 2fr", borderBottom: "none" }}>
            <div style={{ fontWeight: 600 }}>Original term</div>
            <div>{unlinkedItem.originalTerm}</div>
          </div>
          <div className="term-row" style={{ gridTemplateColumns: "1fr 2fr", borderBottom: "none" }}>
            <div style={{ fontWeight: 600 }}>Transliteration</div>
            <div>{unlinkedItem.transliteration ?? "—"}</div>
          </div>
          <div className="term-row" style={{ gridTemplateColumns: "1fr 2fr", borderBottom: "none" }}>
            <div style={{ fontWeight: 600 }}>Amount</div>
            <div>{unlinkedItem.amount || "—"}</div>
          </div>
          <div className="term-row" style={{ gridTemplateColumns: "1fr 2fr", borderBottom: "none" }}>
            <div style={{ fontWeight: 600 }}>Role</div>
            <div>{unlinkedItem.role || "—"}</div>
          </div>
        </div>
      )}

      <div className="product-section" style={{ borderBottom: "none" }}>
        <h2>RECIPES</h2>
        {routeInfo.mode === "master" ? (
          recipesUsingEntity.length === 0 ? (
            <p style={{ color: "var(--color-stone)" }}>No recipes found.</p>
          ) : (
            <RecipeLinkCards recipes={recipesUsingEntity} db={db} navigate={navigate} />
          )
        ) : (
          <>
            {unlinkedRecipe ? (
              <RecipeLinkCards recipes={[unlinkedRecipe]} db={db} navigate={navigate} />
            ) : (
              <p style={{ color: "var(--color-stone)" }}>No recipe found.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const WorkshopPage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const { ingredients, tools, processes } = useMemo(() => buildWorkshopCardsFromRecipes(db), [db]);

  const featuredTerm = useMemo(() => {
    return (db.ancientIngredients ?? []).find((t) => t.id === "ai-smyrna") ?? (db.ancientIngredients ?? [])[0] ?? null;
  }, [db.ancientIngredients]);

  const featuredIdentification = useMemo(() => {
    if (!featuredTerm) return null;
    return (db.identifications ?? []).find((i) => i.ancientIngredientId === featuredTerm.id) ?? null;
  }, [db.identifications, featuredTerm]);

  const featuredProduct = useMemo(() => {
    if (!featuredIdentification) return null;
    return (db.ingredientProducts ?? []).find((p) => p.id === featuredIdentification.ingredientProductId) ?? null;
  }, [db.ingredientProducts, featuredIdentification]);

  const featuredSource = useMemo(() => {
    if (!featuredIdentification?.materialSourceId) return null;
    return (db.materialSources ?? []).find((s) => s.id === featuredIdentification.materialSourceId) ?? null;
  }, [db.materialSources, featuredIdentification]);

  const renderWorkshopCard = (card: WorkshopCardModel) => (
    <div className="workshop-card" key={card.key} onClick={() => navigate(card.route)}>
      <div className="card-top">
        <h3>{card.title}</h3>
        <span className="type-tag">{card.tag}</span>
      </div>
      {card.ancientLabel && <div className="def">{card.ancientLabel}</div>}
      {card.description && (
        <div className="def" style={{ fontStyle: "italic", color: "var(--color-stone)" }}>
          {card.description}
        </div>
      )}
      <div className="def" style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--color-stone)" }}>
        {card.usageLabel}
      </div>
    </div>
  );

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
          <div className="workshop-card" onClick={() => featuredTerm && navigate(`ancient-term:${featuredTerm.id}`)}>
            <div className="card-top">
              <h3>{featuredTerm?.term ?? "Ancient term"}</h3>
              <DemoBadge placeholder={featuredTerm?.placeholder} />
            </div>
            {featuredTerm?.transliteration && <div className="translit">{featuredTerm.transliteration}</div>}
            <div className="def">{featuredTerm?.description ?? "Demo term preview card."}</div>
          </div>

          <div className="workshop-card" onClick={() => featuredProduct && navigate(`ingredient-product:${featuredProduct.id}`)}>
            <div className="card-top">
              <h3>{featuredProduct?.label ?? "Ingredient product"}</h3>
              <DemoBadge placeholder={featuredProduct?.placeholder} />
            </div>
            <div className="def">{featuredProduct?.description ?? "Demo product preview card."}</div>
          </div>

          <div className="workshop-card" onClick={() => featuredSource && navigate(`material-source:${featuredSource.id}`)}>
            <div className="card-top">
              <h3>{featuredSource?.label ?? "Material source"}</h3>
              <DemoBadge placeholder={featuredSource?.placeholder} />
            </div>
            <div className="def">{featuredSource?.description ?? "Demo source preview card."}</div>
          </div>
        </div>
      </div>

      <div className="workshop-section">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '1.5rem'}}>
            <h2 style={{margin:0, border: 'none'}}>METHODS</h2>
            <button className="text-btn" onClick={() => navigate('processes')}>See all processes &rarr;</button>
        </div>
        <div className="workshop-grid">
          {db.masterProcesses[0] ? (
            <div className="workshop-card" onClick={() => navigate(`workshop-process:${db.masterProcesses[0].id}`)}>
              <div className="card-top">
                <h3>{db.masterProcesses[0].name}</h3>
                <span className="type-tag">Process</span>
              </div>
              <div className="def">{db.masterProcesses[0].description || "No description yet."}</div>
            </div>
          ) : null}
          {db.masterTools[0] ? (
            <div className="workshop-card" onClick={() => navigate(`workshop-tool:${db.masterTools[0].id}`)}>
              <div className="card-top">
                <h3>{db.masterTools[0].name}</h3>
                <span className="type-tag">Tool</span>
              </div>
              <div className="def">{db.masterTools[0].description || "No description yet."}</div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="workshop-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, border: "none" }}>INGREDIENTS IN RECIPES</h2>
          <button className="text-btn" onClick={() => navigate("ingredients")}>
            See ingredient profiles &rarr;
          </button>
        </div>
        <div className="workshop-grid">{ingredients.map(renderWorkshopCard)}</div>
      </div>

      <div className="workshop-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, border: "none" }}>TOOLS IN RECIPES</h2>
          <button className="text-btn" onClick={() => navigate("tools")}>
            See all tools &rarr;
          </button>
        </div>
        <div className="workshop-grid">{tools.map(renderWorkshopCard)}</div>
      </div>

      <div className="workshop-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, border: "none" }}>PROCESSES IN RECIPES</h2>
          <button className="text-btn" onClick={() => navigate("processes")}>
            See all processes &rarr;
          </button>
        </div>
        <div className="workshop-grid">{processes.map(renderWorkshopCard)}</div>
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

      <div className="product-section" style={{paddingBottom: '2rem', borderBottom: '1px solid var(--color-border-strong)'}}>
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

      <div className="product-section" style={{paddingBottom: '3rem', borderBottom: '1px solid var(--color-border-strong)'}}>
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

const ProcessesPage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const processes = [...(db.masterProcesses ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate("workshop")}>
        <Icons.ArrowLeft /> Back to Workshop
      </div>
      <div className="archive-intro">
        <h1>PROCESSES</h1>
        <p>Techniques for extracting and compounding aromatics.</p>
      </div>
      <div className="workshop-grid">
        {processes.map((process) => (
          <div key={process.id} className="workshop-card" onClick={() => navigate(`workshop-process:${process.id}`)}>
            <div className="card-top">
              <h3>{process.name}</h3>
              <span className="type-tag">{process.type || "Process"}</span>
            </div>
            <div className="def">{process.description || "No description yet."}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ToolsPage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const tools = [...(db.masterTools ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate("workshop")}>
        <Icons.ArrowLeft /> Back to Workshop
      </div>
      <div className="archive-intro">
        <h1>TOOLS</h1>
        <p>The equipment of the ancient laboratory.</p>
      </div>
      <div className="workshop-grid">
        {tools.map((tool) => (
          <div key={tool.id} className="workshop-card" onClick={() => navigate(`workshop-tool:${tool.id}`)}>
            <div className="card-top">
              <h3>{tool.name}</h3>
              <span className="type-tag">{tool.type || "Tool"}</span>
            </div>
            <div className="def">{tool.description || "No description yet."}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

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

type RecipeTextViewMode = "annotated" | "translation" | "greek";

const RecipePage = ({
  navigate,
  db,
  recipeId,
}: {
  navigate: (route: string) => void;
  db: DatabaseState;
  recipeId: string;
}) => {
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [textMode, setTextMode] = useState<RecipeTextViewMode>("annotated");

  const recipe = (db.recipes.find((r) => r.id === recipeId) ?? db.recipes[0]) as Recipe | undefined;
  const sourceWork = recipe?.metadata?.sourceWorkId
    ? db.masterWorks.find((w) => w.id === recipe.metadata.sourceWorkId)
    : undefined;

  const segments = recipe?.text?.combinedSegments ?? [];
  const annotations = recipe?.annotations ?? {};
  const activeAnnotation = activeAnnotationId ? (annotations as any)[activeAnnotationId] : null;
  const activeAnnotationAncientTermId =
    recipe && activeAnnotationId ? resolveAncientTermIdForRecipeAnnotation(recipe.id, activeAnnotationId) : null;
  const processItems = (recipe?.items ?? []).filter((item) => item.type === "process") as RecipeItem[];
  
  const openInStudio = () => {
    if (!recipe) return;
    const saved = createOrResumeStudioSession(recipe.id);
    setActiveStudioSessionId(saved.id);
    navigate("studio");
  };

  const renderPlainText = (text: string) => {
    const trimmed = (text || "").trim();
    if (!trimmed) return <div className="empty-state">No text available.</div>;
    const paragraphs = trimmed.split(/\n{2,}/g);
    return (
      <div className="recipe-text">
        {paragraphs.map((p, idx) => (
          <p key={idx} style={{ marginTop: idx === 0 ? 0 : "1rem" }}>
            {p}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="page-container recipe-page">
      <div className="back-link" onClick={() => navigate('archive')}>
        <Icons.ArrowLeft /> Back to Recipes
      </div>
      
      <div className="recipe-header">
        <h1>{recipe?.metadata?.title ?? "Recipe"}</h1>
        <div className="subtitle">
          {[recipe?.metadata?.author, sourceWork?.name].filter(Boolean).join(", ")}
        </div>
        
        <div className="metadata-box source-box">
          <div className="meta-row">
            <span>{sourceWork?.description ?? ""}</span>
          </div>
          <div className="meta-row">
            <span className="urn">{recipe?.urn ?? ""}</span>
            <div className="actions">
              <button className="text-btn">[Copy]</button>
              <button className="text-btn">[JSON-LD]</button>
              <button type="button" className="text-btn" onClick={openInStudio}>[Open in Studio]</button>
            </div>
          </div>
        </div>

        <div className="view-toggles">
          <label>
            <input
              type="radio"
              name="view"
              checked={textMode === "annotated"}
              onChange={() => {
                setActiveAnnotationId(null);
                setTextMode("annotated");
              }}
            />{" "}
            Annotated
          </label>
          <label>
            <input
              type="radio"
              name="view"
              checked={textMode === "translation"}
              onChange={() => {
                setActiveAnnotationId(null);
                setTextMode("translation");
              }}
            />{" "}
            Translation
          </label>
          <label>
            <input
              type="radio"
              name="view"
              checked={textMode === "greek"}
              onChange={() => {
                setActiveAnnotationId(null);
                setTextMode("greek");
              }}
            />{" "}
            Greek
          </label>
        </div>
      </div>

      <div className={`recipe-split-view ${activeAnnotation ? 'has-annotation' : ''}`}>
        <div className="text-column">
          <h2>THE TEXT</h2>
          {textMode === "greek" && renderPlainText(recipe?.text?.original ?? "")}
          {textMode === "translation" && renderPlainText(recipe?.text?.translation ?? "")}
          {textMode === "annotated" && (
            <>
              {segments.length === 0 ? (
                <>
                  <div className="metadata-box" style={{ marginBottom: "1rem" }}>
                    Annotated view not available for this recipe yet (demo fallback).
                  </div>
                  {renderPlainText(recipe?.text?.translation ?? "")}
                </>
              ) : (
                <div className="recipe-text">
                  {segments.map((seg, i) => {
                    if (seg.type === "annotation") {
                      return (
                        <span
                          key={i}
                          className={`annotated-term ${activeAnnotationId === seg.id ? "active" : ""}`}
                          onClick={() => setActiveAnnotationId((prev) => (prev === seg.id ? null : seg.id))}
                        >
                          {seg.text}
                        </span>
                      );
                    }
                    return <span key={i}>{seg.text}</span>;
                  })}
                </div>
              )}
            </>
          )}

          <div className="ingredients-section">
            <h2>INGREDIENTS</h2>
            <div className="ingredients-table">
              {(recipe?.items ?? [])
                .filter((item) => item.type === "ingredient")
                .map((ing, i) => (
                <div className="ing-row" key={i}>
                  <span className="ing-name">
                    {ing.originalTerm}
                    {ing.transliteration ? ` (${ing.transliteration})` : ""}
                  </span>
                  <span className="ing-amt">{ing.amount}</span>
                  <span className="ing-role">{ing.role}</span>
                  <span
                    className="ing-link"
                    onClick={() => {
                      if (!recipe) return;
                      const aiId = resolveAncientTermIdForRecipeItem(recipe.id, ing);
                      if (aiId) {
                        navigate(`ancient-term:${aiId}`);
                        return;
                      }
                      navigate(`workshop-unlinked:ingredient:${recipe.id}:${ing.id}`);
                    }}
                  >
                    → ancient term
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="processes-section">
            <h2>PROCESSES</h2>
            {processItems.length === 0 ? (
              <p style={{ color: "var(--color-stone)" }}>No processes listed for this recipe.</p>
            ) : (
              <p>
                {processItems.map((process, idx) => {
                  const label = (process.displayTerm || "").trim() || process.originalTerm || process.id;
                  const route = process.masterId
                    ? `workshop-process:${process.masterId}`
                    : recipe
                      ? `workshop-unlinked:process:${recipe.id}:${process.id}`
                      : null;
                  return (
                    <React.Fragment key={process.id}>
                      {idx > 0 ? " → " : null}
                      {route ? (
                        <span className="text-btn" style={{ cursor: "pointer" }} onClick={() => navigate(route)}>
                          {label}
                        </span>
                      ) : (
                        <span>{label}</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </p>
            )}
          </div>
        </div>

        <div className={`notes-column ${textMode === "annotated" && activeAnnotation ? "has-content" : ""}`}>
          <h2>NOTES</h2>
          {textMode === "annotated" && activeAnnotation ? (
            <div className="annotation-card fade-in">
              <div className="anno-header">
                <div className="anno-title">
                  <h3>{activeAnnotation.term}</h3>
                  <span className="transliteration">{activeAnnotation.transliteration}</span>
                </div>
                <button
                  type="button"
                  className="anno-close"
                  onClick={() => setActiveAnnotationId(null)}
                  aria-label="Close annotation"
                  title="Close"
                >
                  ×
                </button>
              </div>
              {activeAnnotation.definition && <p>{activeAnnotation.definition}</p>}
              <div className="anno-links">
                {(activeAnnotation.links ?? []).map((link, i) => (
                  <button key={i} className="text-btn" onClick={() => navigate(link.route)}>
                    → {link.label}
                  </button>
                ))}
                {activeAnnotationAncientTermId ? (
                  <button className="text-btn" onClick={() => navigate(`ancient-term:${activeAnnotationAncientTermId}`)}>
                    → View ancient term
                  </button>
                ) : (activeAnnotation.links ?? []).length === 0 ? (
                  <div style={{ color: "var(--color-stone)", fontFamily: "var(--font-sans)", fontSize: "0.875rem" }}>
                    No linked material for this note yet.
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              {textMode === "annotated"
                ? "Click any highlighted term to see commentary."
                : "Switch to Annotated view to see commentary."}
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

      <div className="product-section" style={{paddingBottom: '3rem', borderBottom: '1px solid var(--color-border-strong)'}}>
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

      <div className="product-section" style={{paddingBottom: '3rem', borderBottom: '1px solid var(--color-border-strong)'}}>
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

const ArchivePage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const recipes = [...(db.recipes ?? [])].sort((a, b) => {
    const aTitle = a.metadata?.title ?? a.id;
    const bTitle = b.metadata?.title ?? b.id;
    return aTitle.localeCompare(bTitle);
  });

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate("library")}>
        <Icons.ArrowLeft /> Back to Library
      </div>

      <div className="archive-intro">
        <h1>RECIPES</h1>
        <p>Explore the ancient perfume recipes in our collection.</p>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <select>
            <option>Source: All works</option>
          </select>
          <select>
            <option>Period: All periods</option>
          </select>
          <select>
            <option>Ingredient: All ingredients</option>
          </select>
          <select>
            <option>Process: All processes</option>
          </select>
        </div>
        <div className="filter-meta">
          <button className="text-btn">Clear filters</button>
          <span>
            Showing {recipes.length} recipe{recipes.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="recipe-grid">
        {recipes.map((recipe) => {
          const title = recipe.metadata?.title ?? recipe.id;
          const sourceWork = recipe.metadata?.sourceWorkId
            ? db.masterWorks.find((w) => w.id === recipe.metadata.sourceWorkId)
            : null;
          const cardSub = [recipe.metadata?.author, recipe.metadata?.attribution || sourceWork?.name]
            .filter(Boolean)
            .join(", ");
          const ingredientCount = (recipe.items ?? []).filter((i) => i.type === "ingredient").length;

          return (
            <div className="recipe-card" key={recipe.id}>
              <h3>{title.toUpperCase()}</h3>
              <div className="card-sub">{cardSub}</div>
              <div className="card-meta">
                <div>Language: {recipe.metadata?.language ?? "—"}</div>
                <div>Ingredients: {ingredientCount}</div>
              </div>
              <button className="btn-primary" onClick={() => navigate(`recipe:${recipe.id}`)}>
                View recipe
              </button>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          marginTop: "2rem",
          fontFamily: "var(--font-sans)",
          fontSize: "0.875rem",
        }}
      >
        <span>[← Previous]</span>
        <span>Page 1 of 1</span>
        <span style={{ cursor: "pointer", color: "var(--color-amber)" }}>[Next →]</span>
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

const TeamPage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const team = [...(db.masterPeople ?? [])]
    .filter((p) => (p.categories ?? []).includes("team"))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate("about")}>
        <Icons.ArrowLeft /> Back to About
      </div>
      <h1>The Team</h1>
      <div className="section-block">
        <div className="recipe-grid" style={{ marginTop: "2rem" }}>
          {team.map((person) => (
            <div
              key={person.id}
              className="recipe-card"
              onClick={() => navigate(`person:${person.id}`)}
              style={{ cursor: "pointer" }}
            >
              <h3>{person.role || "Team member"}</h3>
              <div className="card-sub">{person.name}</div>
              <p>{person.description}</p>
            </div>
          ))}
          {!team.length ? (
            <div className="metadata-box" style={{ width: "100%" }}>
              No team members in the database yet.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

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

      <div className="product-section" style={{paddingBottom: '3rem', borderBottom: '1px solid var(--color-border-strong)'}}>
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

      <div className="product-section" style={{paddingBottom: '3rem', borderBottom: '1px solid var(--color-border-strong)'}}>
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

      <div className="product-section" style={{paddingBottom: '2rem', borderBottom: '1px solid var(--color-border-strong)'}}>
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
      --color-border: rgba(92, 74, 61, 0.1);
      --color-border-strong: rgba(92, 74, 61, 0.2);
      --color-chip-bg: rgba(92, 74, 61, 0.05);
      --color-muted-bg: rgba(0,0,0,0.03);
      --shadow-soft: 0 4px 12px rgba(0,0,0,0.05);
      --shadow-hover: 0 8px 16px rgba(0,0,0,0.05);
      --shadow-raised: 0 12px 24px rgba(92, 74, 61, 0.08);
      --shadow-raised-strong: 0 12px 30px rgba(92, 74, 61, 0.1);
      --font-serif: 'Gentium Plus', 'Gentium', serif;
      --font-sans: 'Noto Sans', 'Arial', sans-serif;
      color-scheme: light;
    }

    :root[data-theme="dark"] {
      --color-cream: #0f0e0c;
      --color-warm-white: #191512;
      --color-amber: #e2c35c;
      --color-amber-dark: #cda33b;
      --color-sage: #8ea089;
      --color-earth: #e7dfd1;
      --color-charcoal: #f3eee5;
      --color-stone: #b7ad9d;
      --color-border: rgba(255,255,255,0.10);
      --color-border-strong: rgba(255,255,255,0.16);
      --color-chip-bg: rgba(255,255,255,0.07);
      --color-muted-bg: rgba(255,255,255,0.06);
      --shadow-soft: 0 8px 22px rgba(0,0,0,0.55);
      --shadow-hover: 0 10px 26px rgba(0,0,0,0.6);
      --shadow-raised: 0 14px 36px rgba(0,0,0,0.55);
      --shadow-raised-strong: 0 16px 46px rgba(0,0,0,0.6);
      color-scheme: dark;
    }

    * { box-sizing: border-box; }

    body {
      background-color: var(--color-cream);
      color: var(--color-earth);
      font-family: var(--font-serif);
      margin: 0;
      padding: 0;
      line-height: 1.6;
      transition: background-color 180ms ease, color 180ms ease;
    }

    h1, h2, h3, h4 {
      font-family: var(--font-sans);
      color: var(--color-charcoal);
      margin-top: 0;
    }
    
    h1 { font-size: 2.5rem; font-weight: 600; line-height: 1.2; margin-bottom: 0.5rem; }
    h2 { font-size: 1.125rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--color-border-strong); padding-bottom: 0.5rem; margin-bottom: 1.5rem; margin-top: 2rem; }
    h3 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }

    button { font-family: var(--font-sans); cursor: pointer; }
    
    .text-btn { background: none; border: none; color: var(--color-amber); padding: 0; font-size: 0.875rem; text-decoration: underline; }
    .text-btn:hover { color: var(--color-amber-dark); }
    .icon-btn { background: none; border: 1px solid transparent; color: var(--color-stone); padding: 0.2rem; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 600; }
    .icon-btn.active { background: rgba(201, 162, 39, 0.1); color: var(--color-amber); border-color: rgba(201, 162, 39, 0.3); }
    .theme-toggle:hover { background: var(--color-chip-bg); color: var(--color-amber); border-color: var(--color-border); }

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
      border-bottom: 1px solid var(--color-border);
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
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-soft);
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
      border-top: 1px solid var(--color-border);
      padding: 3rem 2rem;
      margin-top: 4rem;
    }
    .footer-columns { display: flex; gap: 4rem; margin-bottom: 3rem; }
    .footer-columns .col { display: flex; flex-direction: column; gap: 0.5rem; }
    .col h4 { font-size: 0.875rem; color: var(--color-stone); text-transform: uppercase; margin-bottom: 0.5rem; }
    .col a { text-decoration: none; color: var(--color-earth); font-family: var(--font-sans); font-size: 0.9375rem; }
    .col a:hover { color: var(--color-amber); }
    .footer-bottom { border-top: 1px solid var(--color-border); padding-top: 1.5rem; font-size: 0.75rem; color: var(--color-stone); font-family: var(--font-sans); }

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
    .urn { font-family: monospace; font-size: 0.75rem; color: var(--color-stone); background: var(--color-muted-bg); padding: 0.2rem 0.4rem; border-radius: 3px; }
    
    /* Workshop Styles */
    .workshop-header { margin-bottom: 3rem; }
    .intro-text { font-size: 1.25rem; max-width: 800px; color: var(--color-earth); }
    .workshop-section { margin-bottom: 4rem; }
    .workshop-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .workshop-card {
      background: var(--color-warm-white);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 1.5rem;
      transition: all 0.2s;
      cursor: pointer;
    }
    .workshop-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-hover); border-color: rgba(201, 162, 39, 0.3); }
    .card-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.25rem; }
    .workshop-card h3 { font-size: 1.125rem; margin: 0; color: var(--color-charcoal); }
    .lang-tag, .type-tag { font-family: var(--font-sans); font-size: 0.7rem; text-transform: uppercase; background: var(--color-chip-bg); padding: 0.1rem 0.4rem; border-radius: 4px; color: var(--color-stone); letter-spacing: 0.05em; }
    .translit { font-style: italic; font-family: var(--font-serif); color: var(--color-amber-dark); margin-bottom: 0.75rem; font-size: 0.9375rem; }
    .def { font-family: var(--font-sans); font-size: 0.875rem; color: var(--color-earth); }

    /* Materials Nav */
    .materials-nav {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--color-border-strong);
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
    .az-nav { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-bottom: 3rem; font-family: var(--font-sans); border-bottom: 1px solid var(--color-border); padding-bottom: 1.5rem; }
    .az-nav a { text-decoration: none; color: var(--color-amber); font-weight: 600; padding: 0.25rem 0.5rem; border-radius: 4px; transition: background 0.1s; }
    .az-nav a:hover { background: rgba(201, 162, 39, 0.1); }
    .az-nav a.disabled { color: var(--color-stone); opacity: 0.5; pointer-events: none; }
    .az-group { margin-bottom: 3rem; }
    .az-group h2 { color: var(--color-stone); border-bottom: 2px solid rgba(201, 162, 39, 0.3); display: inline-block; padding-bottom: 0.25rem; margin-bottom: 1.5rem; }
    .az-list { display: flex; flex-direction: column; gap: 1rem; }
    .az-card { background: var(--color-warm-white); border: 1px solid var(--color-border); padding: 1.5rem; border-radius: 4px; }
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
      border: 1px solid var(--color-border);
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
       box-shadow: var(--shadow-raised);
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
      border-bottom: 1px solid var(--color-border);
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
        background: var(--color-warm-white);
        padding: 3rem 2rem;
        border: 1px solid var(--color-border);
        text-align: center;
        transition: all 0.3s ease;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .home-card:hover {
        transform: translateY(-8px);
        box-shadow: var(--shadow-raised-strong);
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
    .metadata-box { background: var(--color-warm-white); border: 1px solid var(--color-border); padding: 1rem; border-radius: 4px; margin-bottom: 2rem; display: inline-block; min-width: 50%; }
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
    .ing-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr; border-bottom: 1px solid var(--color-border); padding: 0.75rem 0; }
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
    .anno-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem; margin-bottom: 1rem; }
    .anno-title { display: flex; flex-direction: column; min-width: 0; }
    .anno-header h3 { margin: 0; color: var(--color-amber-dark); font-family: var(--font-serif); }
    .transliteration { font-style: italic; color: var(--color-stone); }
    .anno-close {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 999px;
      border: 1px solid var(--color-border);
      background: transparent;
      color: var(--color-stone);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      line-height: 1;
      cursor: pointer;
    }
    .anno-close:hover { background: var(--color-chip-bg); color: var(--color-amber-dark); }
    .anno-links { margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start; }
    .fade-in { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

    /* Archive & Cards */
    .filters-bar { 
      background: var(--color-warm-white); 
      border: 1px solid var(--color-border-strong); 
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
      border: 1px solid var(--color-border-strong); 
      border-radius: 4px; 
      font-family: var(--font-sans); 
      color: var(--color-charcoal); 
      background-color: var(--color-warm-white);
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
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 1.5rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .recipe-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-hover); }
    .card-sub { font-style: italic; color: var(--color-stone); margin-bottom: 1rem; font-family: var(--font-serif); }
    .card-meta { font-family: var(--font-sans); font-size: 0.875rem; color: var(--color-earth); margin-bottom: 1.5rem; }

    /* Ingredient & Product Pages */
    .quote-block { border-left: 3px solid var(--color-amber); padding-left: 1rem; margin-bottom: 1.5rem; font-style: italic; }
    .quote-block strong { display: block; font-style: normal; font-size: 0.875rem; color: var(--color-stone); margin-bottom: 0.25rem; font-family: var(--font-sans); }
    
    .id-card {
      background: var(--color-warm-white);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .id-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .confidence-badge { font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 12px; font-weight: 600; text-transform: uppercase; }
    .confidence-badge.established { background: rgba(122, 139, 110, 0.2); color: var(--color-sage); }
    .confidence-badge.probable { background: rgba(201, 162, 39, 0.2); color: var(--color-amber-dark); }
    .confidence-badge.possible { background: rgba(92, 74, 61, 0.12); color: var(--color-earth); }
    .confidence-badge.speculative { background: rgba(92, 74, 61, 0.10); color: var(--color-stone); }
    .confidence-badge.high { background: rgba(122, 139, 110, 0.2); color: var(--color-sage); }
    .confidence-badge.medium { background: rgba(201, 162, 39, 0.2); color: var(--color-amber-dark); }
    .confidence-badge.low { background: rgba(92, 74, 61, 0.10); color: var(--color-stone); }
    
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
      border-bottom: 1px solid var(--color-border-strong);
      padding: 3rem 0;
    }
    .product-section:last-child { border-bottom: none; }
    .product-section h2 { margin-top: 0; }
    .term-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--color-border);
      font-family: var(--font-sans);
      font-size: 0.9375rem;
      align-items: center;
    }
    .term-row:last-child { border-bottom: none; }

    @media (max-width: 768px) {
      .recipe-split-view { grid-template-columns: 1fr; }
      .recipe-split-view.has-annotation { padding-bottom: 14rem; }
      .notes-column { display: none; }
      .recipe-split-view .has-content.notes-column {
        display: block;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        border-top: 2px solid var(--color-amber);
        border-top-left-radius: 16px;
        border-top-right-radius: 16px;
        background: var(--color-warm-white);
        box-shadow: var(--shadow-raised-strong);
        padding: 1rem 1.25rem calc(1rem + env(safe-area-inset-bottom));
        max-height: 45vh;
        overflow-y: auto;
      }
      .recipe-split-view .has-content.notes-column h2 { margin-top: 0; }
      .site-header { flex-direction: column; gap: 1rem; align-items: flex-start; }
      .main-nav { flex-wrap: wrap; gap: 1rem; }
      .footer-columns { flex-direction: column; gap: 2rem; }
      .filters-bar { flex-direction: column; align-items: flex-start; }
      .filter-meta { width: 100%; justify-content: space-between; margin-left: 0; padding-top: 1rem; border-top: 1px solid var(--color-border); }
      
      .product-section > div[style*="flex"] { flex-direction: column; }
    }
  `}</style>
);

const App = ({
  db,
  theme,
  setTheme,
}: {
  db: DatabaseState;
  theme: ThemeMode;
  setTheme: React.Dispatch<React.SetStateAction<ThemeMode>>;
}) => {
  const [route, setRoute] = useState('home'); 
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    document.title = "Alchemies of Scent — The Laboratory";
  }, []);

  const renderPage = () => {
    const workshopEntityRoute = parseWorkshopEntityRoute(route);
    if (workshopEntityRoute) {
      return <WorkshopEntityDetailPage navigate={setRoute} db={db} routeInfo={workshopEntityRoute} />;
    }

    const interpretationRoute = parseInterpretationRoute(route);
    if (interpretationRoute) {
      if (interpretationRoute.kind === "ancient-term") {
        return <AncientTermDetailPage navigate={setRoute} db={db} termId={interpretationRoute.id} />;
      }
      if (interpretationRoute.kind === "identification") {
        return <IdentificationDetailPage navigate={setRoute} db={db} identificationId={interpretationRoute.id} />;
      }
      if (interpretationRoute.kind === "ingredient-product") {
        return <IngredientProductDetailPage navigate={setRoute} db={db} productId={interpretationRoute.id} />;
      }
      if (interpretationRoute.kind === "material-source") {
        return <MaterialSourceDetailPage navigate={setRoute} db={db} sourceId={interpretationRoute.id} />;
      }
    }

    const recipeRoute = parseRecipeRoute(route);
    if (recipeRoute) {
      return <RecipePage navigate={setRoute} db={db} recipeId={recipeRoute.id} />;
    }

    const personRoute = parsePersonRoute(route);
    if (personRoute) {
      return <PersonDetailPageDb navigate={setRoute} db={db} personId={personRoute.id} />;
    }

    const workRoute = parseWorkRoute(route);
    if (workRoute) {
      return <WorkDetailPageDb navigate={setRoute} db={db} workId={workRoute.id} />;
    }

    switch(route) {
      case 'home': return <HomePage navigate={setRoute} db={db} setSearchQuery={setSearchQuery} />;
      case 'library': return <LibraryPage navigate={setRoute} />;
      case 'archive': return <ArchivePage navigate={setRoute} db={db} />;
      case 'works': return <WorksPage navigate={setRoute} db={db} />;
      case 'people': return <PeoplePage navigate={setRoute} db={db} />;
      case 'recipe_rose': return <RecipePage navigate={setRoute} db={db} recipeId="r-rose-perfume" />;
      case 'ingredient_smyrna': return <AncientIngredientPage navigate={setRoute} />;
      case 'product_myrrh': return <ProductPage navigate={setRoute} />;
      case 'about': return <AboutPage navigate={setRoute} />;
      case 'project': return <ProjectPage navigate={setRoute} />;
      case 'team': return <TeamPage navigate={setRoute} db={db} />;
      case 'news': return <NewsPage navigate={setRoute} />;
      case 'workshop': return <WorkshopPage navigate={setRoute} db={db} />;
      case 'materials': return <MaterialsDashboardPage navigate={setRoute} />;
      case 'terms': return <TermsPage navigate={setRoute} db={db} />;
      case 'ingredients': return <IngredientsPage navigate={setRoute} db={db} />;
      case 'sources': return <SourcesPage navigate={setRoute} db={db} />;
      case 'source_commiphora': return <SourceDetailPage navigate={setRoute} />;
      case 'processes': return <ProcessesPage navigate={setRoute} db={db} />;
      case 'process_enfleurage': return <ProcessesPage navigate={setRoute} db={db} />;
      case 'tools': return <ToolsPage navigate={setRoute} db={db} />;
      case 'tool_alembic': return <ToolsPage navigate={setRoute} db={db} />;
      case 'identification_smyrna': return <IdentificationPage navigate={setRoute} />;
      case 'experiments': return <ExperimentsPage navigate={setRoute} />;
      case 'search': return <SearchPage navigate={setRoute} db={db} query={searchQuery} setQuery={setSearchQuery} />;
      case 'studio': return <StudioPage navigate={setRoute} db={db} />;
      
      // New Routes
      case 'person_dioscorides': return <PersonDetailPageDb navigate={setRoute} db={db} personId="p-dioscorides" />;
      case 'team_sean': return <PersonDetailPageDb navigate={setRoute} db={db} personId="p-sean-coughlin" />;
      case 'work_materia_medica': return <WorkDetailPageDb navigate={setRoute} db={db} workId="w-materia-medica" />;
      case 'admin': return <AdminConsole navigate={setRoute} />;

      default: return <HomePage navigate={setRoute} db={db} setSearchQuery={setSearchQuery} />;
    }
  };

  return (
    <>
      <GlobalStyles />
      {route !== 'admin' && (
        <Header
          navigate={setRoute}
          theme={theme}
          toggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        />
      )}
      <main>
        {renderPage()}
      </main>
      {route !== 'admin' && <Footer navigate={setRoute} />}
    </>
  );
};

const Bootstrap = () => {
  const [db, setDb] = useState<DatabaseState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark") return stored;
    } catch {}
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    let isMounted = true;
    loadState()
      .then((loaded) => {
        if (!isMounted) return;
        if (import.meta.env.DEV) {
          for (const recipe of loaded.recipes ?? []) {
            const segments = recipe.text?.combinedSegments ?? [];
            assertRecipeAnnotationInvariants({
              recipeId: recipe.id,
              segments,
              annotations: recipe.annotations,
            });
          }
        }
        setDb(loaded);
      })
      .catch((e) => {
        console.error("Failed to initialize database state:", e);
        setError("Failed to initialize application state.");
        setDb(StorageAdapter.load());
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!db) {
    return (
      <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
        <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Loading…</div>
        <div style={{ color: "#666" }}>Initializing local data.</div>
        {error && <div style={{ marginTop: "1rem", color: "#b00020" }}>{error}</div>}
      </div>
    );
  }

  return <App db={db} theme={theme} setTheme={setTheme} />;
};

const root = createRoot(document.getElementById("root"));
root.render(<Bootstrap />);
