import type {
  DocsRoute,
  InterpretationRoute,
  PersonRoute,
  RecipeRoute,
  WorkRoute,
  WorkshopEntityRoute,
} from "./types";

export const parseWorkshopEntityRoute = (route: string): WorkshopEntityRoute | null => {
  if (route.startsWith("workshop-unlinked:")) {
    const [, kindRaw, recipeId, itemId] = route.split(":");
    if (!kindRaw || !recipeId || !itemId) return null;
    if (kindRaw !== "ingredient" && kindRaw !== "tool" && kindRaw !== "process") return null;
    return { kind: kindRaw, mode: "unlinked", recipeId, itemId };
  }

  if (route.startsWith("workshop-ingredient:")) {
    const [, id] = route.split(":");
    if (!id) return null;
    return { kind: "ingredient", mode: "master", id };
  }
  if (route.startsWith("workshop-tool:")) {
    const [, id] = route.split(":");
    if (!id) return null;
    return { kind: "tool", mode: "master", id };
  }
  if (route.startsWith("workshop-process:")) {
    const [, id] = route.split(":");
    if (!id) return null;
    return { kind: "process", mode: "master", id };
  }

  return null;
};

export const parseInterpretationRoute = (route: string): InterpretationRoute | null => {
  if (route.startsWith("ancient-term:")) {
    const [, id] = route.split(":");
    if (!id) return null;
    return { kind: "ancient-term", id };
  }
  if (route.startsWith("identification:")) {
    const [, id] = route.split(":");
    if (!id) return null;
    return { kind: "identification", id };
  }
  if (route.startsWith("ingredient-product:")) {
    const [, id] = route.split(":");
    if (!id) return null;
    return { kind: "ingredient-product", id };
  }
  if (route.startsWith("material-source:")) {
    const [, id] = route.split(":");
    if (!id) return null;
    return { kind: "material-source", id };
  }
  return null;
};

export const parseRecipeRoute = (route: string): RecipeRoute | null => {
  if (!route.startsWith("recipe:")) return null;
  const [, id] = route.split(":");
  if (!id) return null;
  return { id };
};

export const parsePersonRoute = (route: string): PersonRoute | null => {
  if (!route.startsWith("person:")) return null;
  const [, id] = route.split(":");
  if (!id) return null;
  return { id };
};

export const parseWorkRoute = (route: string): WorkRoute | null => {
  if (!route.startsWith("work:")) return null;
  const [, id] = route.split(":");
  if (!id) return null;
  return { id };
};

export const parseDocsRoute = (route: string): DocsRoute | null => {
  if (!route.startsWith("docs:")) return null;
  const [, slug] = route.split(":");
  if (!slug) return null;
  return { slug };
};
