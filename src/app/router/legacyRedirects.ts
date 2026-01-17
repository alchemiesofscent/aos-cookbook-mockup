import type { DatabaseState } from "../../types";

export const resolveLegacyRoute = (route: string, db: DatabaseState): string | null => {
  switch (route) {
    case "recipe_rose": {
      const id = "r-rose-perfume";
      return (db.recipes ?? []).some((r) => r.id === id) ? `recipe:${id}` : null;
    }

    case "ingredient_smyrna": {
      const id = "ai-smyrna";
      return (db.ancientIngredients ?? []).some((t) => t.id === id) ? `ancient-term:${id}` : null;
    }

    case "identification_smyrna": {
      const id = "id-smyrna-a";
      return (db.identifications ?? []).some((i) => i.id === id) ? `identification:${id}` : null;
    }

    case "product_myrrh": {
      const id = "ip-smyrna-a";
      return (db.ingredientProducts ?? []).some((p) => p.id === id) ? `ingredient-product:${id}` : null;
    }

    case "source_commiphora": {
      const id = "ms-smyrna-a";
      return (db.materialSources ?? []).some((s) => s.id === id) ? `material-source:${id}` : null;
    }

    case "process_enfleurage": {
      const id = "pr-boiling";
      return (db.masterProcesses ?? []).some((p) => p.id === id) ? `workshop-process:${id}` : "processes";
    }

    case "tool_alembic": {
      return "tools";
    }

    case "person_dioscorides": {
      const id = "p-dioscorides";
      return (db.masterPeople ?? []).some((p) => p.id === id) ? `person:${id}` : null;
    }

    case "team_sean": {
      const id = "p-sean-coughlin";
      return (db.masterPeople ?? []).some((p) => p.id === id) ? `person:${id}` : null;
    }

    case "work_materia_medica": {
      const id = "w-materia-medica";
      return (db.masterWorks ?? []).some((w) => w.id === id) ? `work:${id}` : null;
    }

    default:
      return null;
  }
};

