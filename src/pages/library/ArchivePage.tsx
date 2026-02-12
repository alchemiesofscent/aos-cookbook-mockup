import React from "react";
import type { DatabaseState } from "../../types";

export const ArchivePage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const recipes = [...(db.recipes ?? [])].sort((a, b) => {
    const aTitle = a.metadata?.title ?? a.id;
    const bTitle = b.metadata?.title ?? b.id;
    return aTitle.localeCompare(bTitle);
  });

  return (
    <div className="page-container">
      <div className="archive-intro">
        <h1 className="hero-title">RECIPES</h1>
        <p className="reading">Explore the ancient perfume recipes in our collection.</p>
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
              <button className="btn-primary recipe-card-cta" onClick={() => navigate(`recipe:${recipe.id}`)}>
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
