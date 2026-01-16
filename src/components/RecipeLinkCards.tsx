import React from "react";
import type { DatabaseState, Recipe } from "../types";

const formatRecipeLabel = (recipe: Pick<Recipe, "id" | "metadata">): string => {
  const title = recipe.metadata?.title ?? recipe.id;
  const parenthetical = [recipe.metadata?.author, recipe.metadata?.attribution].filter(Boolean).join(" / ");
  return parenthetical ? `${title} (${parenthetical})` : title;
};

export const RecipeLinkCards = ({
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

