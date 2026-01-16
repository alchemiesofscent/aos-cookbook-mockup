import type { RecipeItem } from "../types";
import { recipeAnnotationToAncientTermId, recipeItemToAncientTermId } from "../content/pins";

export const resolveAncientTermIdForRecipeItem = (recipeId: string, item: RecipeItem): string | null => {
  if (item.type !== "ingredient") return null;
  if (item.ancientTermId) return item.ancientTermId;
  return recipeItemToAncientTermId[`${recipeId}:${item.id}`] ?? null;
};

export const resolveAncientTermIdForRecipeAnnotation = (recipeId: string, annotationId: string): string | null => {
  return recipeAnnotationToAncientTermId[`${recipeId}:${annotationId}`] ?? null;
};
