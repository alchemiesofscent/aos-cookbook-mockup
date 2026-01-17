import type { DatabaseState, MasterEntity, RecipeItem } from "../types";
import type { WorkshopEntityKind } from "../app/router";

export const formatAncientName = (entity: Pick<MasterEntity, "originalName" | "transliteratedName">): string => {
  if (!entity.originalName) return "";
  if (entity.transliteratedName) return `${entity.originalName} (${entity.transliteratedName})`;
  return entity.originalName;
};

export type WorkshopCardModel = {
  key: string;
  title: string;
  tag: string;
  ancientLabel: string | null;
  description: string | null;
  usageLabel: string;
  route: string;
};

export const buildWorkshopCardsFromRecipes = (
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

