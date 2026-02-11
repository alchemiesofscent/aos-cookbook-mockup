import type { DatabaseState } from "../../types";
import {
  parseInterpretationRoute,
  parsePersonRoute,
  parseRecipeRoute,
  parseWorkRoute,
  parseWorkshopEntityRoute,
} from "./parse";

export type BreadcrumbItem = {
  label: string;
  route?: string;
};

const HOME: BreadcrumbItem = { label: "Home", route: "home" };
const LIBRARY: BreadcrumbItem = { label: "Library", route: "library" };
const WORKSHOP: BreadcrumbItem = { label: "Workshop", route: "workshop" };
const ABOUT: BreadcrumbItem = { label: "About", route: "about" };

const crumb = (label: string, route?: string): BreadcrumbItem => ({ label, route });

export const getDetailFallback = (route: string): BreadcrumbItem | null => {
  const workshopEntity = parseWorkshopEntityRoute(route);
  if (workshopEntity) {
    if (workshopEntity.kind === "tool") return crumb("Tools", "tools");
    if (workshopEntity.kind === "process") return crumb("Processes", "processes");
    return crumb("Ingredients", "ingredients");
  }

  const interpretation = parseInterpretationRoute(route);
  if (interpretation) {
    if (interpretation.kind === "ancient-term") return crumb("Ancient Terms", "terms");
    if (interpretation.kind === "identification") return crumb("Ancient Terms", "terms");
    if (interpretation.kind === "ingredient-product") return crumb("Ingredients", "ingredients");
    if (interpretation.kind === "material-source") return crumb("Material Sources", "sources");
  }

  if (parseRecipeRoute(route)) return crumb("Recipes", "archive");
  if (parsePersonRoute(route)) return crumb("People", "people");
  if (parseWorkRoute(route)) return crumb("Works", "works");
  return null;
};

export const buildBreadcrumbs = (route: string, db: DatabaseState): BreadcrumbItem[] => {
  const workshopEntity = parseWorkshopEntityRoute(route);
  if (workshopEntity) {
    if (workshopEntity.mode === "master") {
      if (workshopEntity.kind === "tool") {
        const tool = (db.masterTools ?? []).find((t) => t.id === workshopEntity.id);
        return [HOME, WORKSHOP, crumb("Tools", "tools"), crumb(tool?.name ?? "Tool")];
      }
      if (workshopEntity.kind === "process") {
        const process = (db.masterProcesses ?? []).find((p) => p.id === workshopEntity.id);
        return [HOME, WORKSHOP, crumb("Processes", "processes"), crumb(process?.name ?? "Process")];
      }
      const ingredient = (db.masterIngredients ?? []).find((m) => m.id === workshopEntity.id);
      return [
        HOME,
        WORKSHOP,
        crumb("Materials", "materials"),
        crumb("Ingredients", "ingredients"),
        crumb(ingredient?.name ?? "Ingredient"),
      ];
    }

    const recipe = (db.recipes ?? []).find((r) => r.id === workshopEntity.recipeId);
    const item = (recipe?.items ?? []).find((i) => i.id === workshopEntity.itemId);
    const label = item?.displayTerm || item?.originalTerm || "Workshop item";

    if (workshopEntity.kind === "tool") {
      return [HOME, WORKSHOP, crumb("Tools", "tools"), crumb(label)];
    }
    if (workshopEntity.kind === "process") {
      return [HOME, WORKSHOP, crumb("Processes", "processes"), crumb(label)];
    }
    return [HOME, WORKSHOP, crumb("Materials", "materials"), crumb("Ingredients", "ingredients"), crumb(label)];
  }

  const interpretation = parseInterpretationRoute(route);
  if (interpretation) {
    if (interpretation.kind === "ancient-term") {
      const term = (db.ancientIngredients ?? []).find((t) => t.id === interpretation.id);
      return [HOME, WORKSHOP, crumb("Ancient Terms", "terms"), crumb(term?.term ?? "Ancient term")];
    }
    if (interpretation.kind === "identification") {
      const ident = (db.identifications ?? []).find((i) => i.id === interpretation.id);
      return [HOME, WORKSHOP, crumb("Identifications"), crumb(ident?.id ?? "Identification")];
    }
    if (interpretation.kind === "ingredient-product") {
      const product = (db.ingredientProducts ?? []).find((p) => p.id === interpretation.id);
      return [
        HOME,
        WORKSHOP,
        crumb("Materials", "materials"),
        crumb("Ingredients", "ingredients"),
        crumb(product?.label ?? "Ingredient"),
      ];
    }
    if (interpretation.kind === "material-source") {
      const source = (db.materialSources ?? []).find((s) => s.id === interpretation.id);
      return [
        HOME,
        WORKSHOP,
        crumb("Materials", "materials"),
        crumb("Material Sources", "sources"),
        crumb(source?.label ?? "Material source"),
      ];
    }
  }

  const recipeRoute = parseRecipeRoute(route);
  if (recipeRoute) {
    const recipe = (db.recipes ?? []).find((r) => r.id === recipeRoute.id);
    return [HOME, LIBRARY, crumb("Recipes", "archive"), crumb(recipe?.metadata?.title ?? "Recipe")];
  }

  const personRoute = parsePersonRoute(route);
  if (personRoute) {
    const person = (db.masterPeople ?? []).find((p) => p.id === personRoute.id);
    return [HOME, LIBRARY, crumb("People", "people"), crumb(person?.name ?? "Person")];
  }

  const workRoute = parseWorkRoute(route);
  if (workRoute) {
    const work = (db.masterWorks ?? []).find((w) => w.id === workRoute.id);
    return [HOME, LIBRARY, crumb("Works", "works"), crumb(work?.name ?? "Work")];
  }

  switch (route) {
    case "home":
      return [HOME];
    case "library":
      return [HOME, LIBRARY];
    case "archive":
      return [HOME, LIBRARY, crumb("Recipes", "archive")];
    case "works":
      return [HOME, LIBRARY, crumb("Works", "works")];
    case "people":
      return [HOME, LIBRARY, crumb("People", "people")];
    case "about":
      return [HOME, ABOUT];
    case "project":
      return [HOME, ABOUT, crumb("Project", "project")];
    case "team":
      return [HOME, ABOUT, crumb("Team", "team")];
    case "news":
      return [HOME, ABOUT, crumb("News", "news")];
    case "import":
      return [HOME, ABOUT, crumb("Import", "import")];
    case "workshop":
      return [HOME, WORKSHOP];
    case "materials":
      return [HOME, WORKSHOP, crumb("Materials", "materials")];
    case "terms":
      return [HOME, WORKSHOP, crumb("Ancient Terms", "terms")];
    case "ingredients":
      return [HOME, WORKSHOP, crumb("Materials", "materials"), crumb("Ingredients", "ingredients")];
    case "sources":
      return [HOME, WORKSHOP, crumb("Materials", "materials"), crumb("Material Sources", "sources")];
    case "processes":
      return [HOME, WORKSHOP, crumb("Processes", "processes")];
    case "tools":
      return [HOME, WORKSHOP, crumb("Tools", "tools")];
    case "experiments":
      return [HOME, WORKSHOP, crumb("Experiments", "experiments")];
    case "search":
      return [HOME, crumb("Search", "search")];
    case "studio":
      return [HOME, crumb("Studio", "studio")];
    default:
      return [HOME];
  }
};
