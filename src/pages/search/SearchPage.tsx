import React, { useMemo } from "react";
import type { DatabaseState } from "../../types";
import seed from "@seed.json";
import "./search.css";

type SearchPageProps = {
  navigate: (route: string) => void;
  db: DatabaseState;
  query: string;
  setQuery: (query: string) => void;
};

type SearchDoc = {
  title: string;
  kind: string;
  subtitle?: string;
  route: string;
  keywords?: string[];
};

const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const docMatches = (doc: SearchDoc, query: string): boolean => {
  const q = normalize(query);
  if (!q) return true;
  const haystack = normalize([doc.title, doc.subtitle, doc.kind, ...(doc.keywords ?? [])].filter(Boolean).join(" "));
  return haystack.includes(q);
};

export default function SearchPage({ navigate, db, query, setQuery }: SearchPageProps) {
  const docs = useMemo<SearchDoc[]>(() => {
    const recipe = db.recipes.find((r) => r.slug === "rose-perfume-dioscorides") ?? db.recipes[0];
    const recipeTitle = recipe?.metadata?.title ?? "Recipe";

    return [
      { title: "Home", kind: "Page", route: "home", keywords: ["laboratory", "alchemies of scent"] },
      { title: "The Library", kind: "Page", route: "library", keywords: ["recipes", "works", "people"] },
      { title: "The Workshop", kind: "Page", route: "workshop", keywords: ["materials", "processes", "tools"] },
      { title: "The Studio (Preview)", kind: "Page", route: "studio", keywords: ["builder", "composer", "phase 2"] },
      { title: "About", kind: "Page", route: "about", keywords: ["project", "team", "news"] },

      { title: "Recipes", kind: "Index", route: "archive", subtitle: `${db.recipes.length} recipe${db.recipes.length === 1 ? "" : "s"}` },
      { title: "Works", kind: "Index", route: "works", subtitle: `${db.masterWorks.length} work${db.masterWorks.length === 1 ? "" : "s"}` },
      { title: "People", kind: "Index", route: "people", subtitle: `${db.masterPeople.length} person${db.masterPeople.length === 1 ? "" : "s"}` },
      { title: "Ingredients", kind: "Index", route: "ingredients", subtitle: `${db.masterIngredients.length} ingredient${db.masterIngredients.length === 1 ? "" : "s"}` },
      { title: "Terms", kind: "Index", route: "terms", keywords: ["greek", "latin", "glossary"] },
      { title: "Sources", kind: "Index", route: "sources" },
      { title: "Processes", kind: "Index", route: "processes" },
      { title: "Tools", kind: "Index", route: "tools" },
      { title: "Experiments", kind: "Index", route: "experiments" },
      { title: "News & Events", kind: "Index", route: "news", keywords: ["updates"] },

      {
        title: recipeTitle,
        kind: "Recipe",
        subtitle: recipe?.urn,
        route: "recipe_rose",
        keywords: [recipe?.metadata?.author ?? "", recipe?.metadata?.attribution ?? ""],
      },

      {
        title: `${seed.ingredientData.term} (${seed.ingredientData.transliteration})`,
        kind: "Ancient term",
        subtitle: seed.ingredientData.urn,
        route: "ingredient_smyrna",
        keywords: ["myrrh", "resin"],
      },
      {
        title: seed.productData.name,
        kind: "Product",
        subtitle: seed.productData.urn,
        route: "product_myrrh",
        keywords: ["myrrh"],
      },
      {
        title: seed.commiphoraData.name,
        kind: "Material source",
        subtitle: seed.commiphoraData.urn,
        route: "source_commiphora",
        keywords: [seed.commiphoraData.commonName, "myrrh"],
      },
      {
        title: seed.processData.name,
        kind: "Process",
        subtitle: seed.processData.urn,
        route: "process_enfleurage",
        keywords: [seed.processData.ancientTerm],
      },
      {
        title: seed.toolData.name,
        kind: "Tool",
        subtitle: seed.toolData.urn,
        route: "tool_alembic",
        keywords: seed.toolData.ancientNames ?? [],
      },
      {
        title: seed.identificationData.urn,
        kind: "Identification",
        subtitle: `${seed.identificationData.ancientTerm.name} → ${seed.identificationData.identifiedAs.name}`,
        route: "identification_smyrna",
      },
      {
        title: seed.dioscoridesDetail.name,
        kind: "Person",
        subtitle: seed.dioscoridesDetail.urn,
        route: "person_dioscorides",
        keywords: ["Dioscorides", "materia medica"],
      },
      {
        title: seed.seanDetail.name,
        kind: "Team",
        subtitle: seed.seanDetail.role,
        route: "team_sean",
      },
      {
        title: seed.materiaMedicaDetail.title,
        kind: "Work",
        subtitle: seed.materiaMedicaDetail.urn,
        route: "work_materia_medica",
        keywords: ["Dioscorides"],
      },
    ];
  }, [db]);

  const filtered = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return docs;
    return docs.filter((d) => docMatches(d, trimmed));
  }, [docs, query]);

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate("home")}>
        ← Back to Home
      </div>

      <div className="searchPageHeader">
        <h1>Search</h1>
        <p>Search across recipes, ingredients, works, people, and curated workshop pages.</p>
      </div>

      <form
        className="searchPageForm"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <div className="searchPageField">
          <input
            className="searchPageInput"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipes, ingredients, works, people…"
          />
          <button type="submit" className="searchPageBtn" aria-label="Search">
            ⌕
          </button>
        </div>
      </form>

      <div className="searchResultsCard">
        {!filtered.length ? (
          <div className="searchEmpty">No matches for “{query.trim()}”.</div>
        ) : (
          <ul className="searchResultsList">
            {filtered.map((doc) => (
              <li key={`${doc.route}:${doc.title}`} className="searchResultRow">
                <div style={{ minWidth: 0 }}>
                  <p className="searchResultTitle">
                    <span className="searchResultBadge">{doc.kind}</span>
                    {doc.title}
                  </p>
                  {doc.subtitle ? <p className="searchResultMeta">{doc.subtitle}</p> : null}
                </div>
                <button type="button" className="searchResultOpen" onClick={() => navigate(doc.route)}>
                  Open
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
