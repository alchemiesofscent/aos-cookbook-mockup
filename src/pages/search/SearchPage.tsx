import React, { useMemo } from "react";
import type { DatabaseState } from "../../types";
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
    const recipeDocs: SearchDoc[] = (db.recipes ?? []).map((recipe) => ({
      title: recipe.metadata?.title ?? recipe.id,
      kind: "Recipe",
      subtitle: recipe.urn,
      route: `recipe:${recipe.id}`,
      keywords: [recipe.metadata?.author ?? "", recipe.metadata?.attribution ?? ""].filter(Boolean),
    }));

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
      ...recipeDocs,

      ...(db.ancientIngredients ?? []).map((term) => ({
        title: term.transliteration ? `${term.term} (${term.transliteration})` : term.term,
        kind: "Ancient term",
        subtitle: term.id,
        route: `ancient-term:${term.id}`,
        keywords: ["demo data"],
      })),

      ...(db.ingredientProducts ?? []).map((product) => ({
        title: product.label,
        kind: "Ingredient product",
        subtitle: product.id,
        route: `ingredient-product:${product.id}`,
        keywords: ["demo data"],
      })),

      ...(db.materialSources ?? []).map((source) => ({
        title: source.label,
        kind: "Material source",
        subtitle: source.id,
        route: `material-source:${source.id}`,
        keywords: ["demo data"],
      })),

      ...(db.identifications ?? []).map((ident) => ({
        title: ident.id,
        kind: "Identification",
        subtitle: `${ident.ancientIngredientId} → ${ident.ingredientProductId}`,
        route: `identification:${ident.id}`,
        keywords: [ident.confidence ?? "", ident.locator ?? ""].filter(Boolean),
      })),

      ...(db.masterTools ?? []).map((tool) => ({
        title: tool.name,
        kind: "Tool",
        subtitle: tool.originalName ? `${tool.originalName}${tool.transliteratedName ? ` (${tool.transliteratedName})` : ""}` : tool.urn,
        route: `workshop-tool:${tool.id}`,
      })),

      ...(db.masterProcesses ?? []).map((process) => ({
        title: process.name,
        kind: "Process",
        subtitle: process.originalName ? `${process.originalName}${process.transliteratedName ? ` (${process.transliteratedName})` : ""}` : process.urn,
        route: `workshop-process:${process.id}`,
      })),

      ...(db.masterPeople ?? []).map((person) => ({
        title: person.name,
        kind: "Person",
        subtitle: [person.role, person.date].filter(Boolean).join(" • ") || person.urn,
        route: `person:${person.id}`,
        keywords: person.categories ?? [],
      })),

      ...(db.masterWorks ?? []).map((work) => ({
        title: work.name,
        kind: "Work",
        subtitle: [work.author, work.date].filter(Boolean).join(" • ") || work.urn,
        route: `work:${work.id}`,
      })),
    ];
  }, [db]);

  const filtered = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return docs;
    return docs.filter((d) => docMatches(d, trimmed));
  }, [docs, query]);

  return (
    <div className="page-container">
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
