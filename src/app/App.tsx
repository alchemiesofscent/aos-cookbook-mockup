import React, { useMemo, useState, useEffect } from "react";
import { AdminConsole } from "../AdminConsole";
import type {
  AncientIngredient,
  DatabaseState,
  Identification,
  IngredientProduct,
  MasterEntity,
  MaterialSource,
  Recipe,
  RecipeItem,
} from "../types";
import { DemoBadge } from "../components/DemoBadge";
import { Icons } from "../components/Icons";
import { MaterialsSubNav } from "../components/MaterialsSubNav";
import { RecipeLinkCards } from "../components/RecipeLinkCards";
import { AboutPage } from "../pages/about/AboutPage";
import { NewsPage } from "../pages/about/NewsPage";
import { ProjectPage } from "../pages/about/ProjectPage";
import { TeamPage } from "../pages/about/TeamPage";
import { ArchivePage } from "../pages/library/ArchivePage";
import { LibraryPage } from "../pages/library/LibraryPage";
import { PeoplePage } from "../pages/library/PeoplePage";
import { PersonDetailPageDb } from "../pages/library/PersonDetailPageDb";
import { RecipePage } from "../pages/library/RecipePage";
import { WorkDetailPageDb } from "../pages/library/WorkDetailPageDb";
import { WorksPage } from "../pages/library/WorksPage";
import { IngredientsPage } from "../pages/workshop/IngredientsPage";
import { AncientTermDetailPage } from "../pages/workshop/AncientTermDetailPage";
import { IdentificationDetailPage } from "../pages/workshop/IdentificationDetailPage";
import { IngredientProductDetailPage } from "../pages/workshop/IngredientProductDetailPage";
import { MaterialsDashboardPage } from "../pages/workshop/MaterialsDashboardPage";
import { SourcesPage } from "../pages/workshop/SourcesPage";
import { TermsPage } from "../pages/workshop/TermsPage";
import {
  COMMIPHORA_DATA,
  DIOSCORIDES_DETAIL,
  IDENTIFICATION_DATA,
  INGREDIENT_DATA,
  MATERIA_MEDICA_DETAIL,
  PRODUCT_DATA,
  SEAN_DETAIL,
} from "../legacy/legacyFixtures";
import {
  parseInterpretationRoute,
  parsePersonRoute,
  parseRecipeRoute,
  parseWorkRoute,
  parseWorkshopEntityRoute,
  type WorkshopEntityKind,
} from "./router";
import HomePage from "../pages/home/HomePage";
import SearchPage from "../pages/search/SearchPage";
import StudioPage from "../pages/studio/StudioPage";
import { createOrResumeStudioSession, setActiveStudioSessionId } from "../studio/storage";
import { resolveAncientTermIdForRecipeAnnotation, resolveAncientTermIdForRecipeItem } from "../workshop/resolveAncientTermId";

type ThemeMode = "light" | "dark";
const THEME_STORAGE_KEY = "AOS_THEME";

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

// --- Page Views ---

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

export default App;
