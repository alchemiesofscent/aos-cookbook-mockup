import React from "react";
import type { DatabaseState, Recipe } from "../types";
import { formatRecipeLabel } from "../lib/formatRecipeLabel";

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
