import type { DatabaseState, RecipeItem } from "../types";

export const resolveAncientTermIdForRecipeItem = (db: DatabaseState, recipeId: string, item: RecipeItem): string | null => {
  if (item.type !== "ingredient") return null;
  if (item.ancientTermId) return item.ancientTermId;
  const pins = db.pins?.recipeItemToAncientTermId ?? {};
  return pins[`${recipeId}:${item.id}`] ?? pins[item.id] ?? null;
};

export const resolveAncientTermIdForRecipeAnnotation = (
  db: DatabaseState,
  recipeId: string,
  annotationId: string,
): string | null => {
  const pins = db.pins?.recipeAnnotationToAncientTermId ?? {};
  return pins[`${recipeId}:${annotationId}`] ?? pins[annotationId] ?? null;
};
