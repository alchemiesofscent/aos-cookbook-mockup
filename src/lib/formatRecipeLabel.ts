import type { Recipe } from "../types";

export const formatRecipeLabel = (recipe: Pick<Recipe, "id" | "metadata">): string => {
  const title = recipe.metadata?.title ?? recipe.id;
  const parenthetical = [recipe.metadata?.author, recipe.metadata?.attribution].filter(Boolean).join(" / ");
  return parenthetical ? `${title} (${parenthetical})` : title;
};

