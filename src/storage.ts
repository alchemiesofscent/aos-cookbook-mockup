import { DatabaseState, MasterEntity, Recipe, RecipeItem } from "./types";
import { recipeItemToAncientTermId } from "./content/pins";

const STORAGE_KEYS = {
  RECIPES: 'AOS_RECIPES',
  INGREDIENTS: 'AOS_MASTER_INGREDIENTS',
  TOOLS: 'AOS_MASTER_TOOLS',
  PROCESSES: 'AOS_MASTER_PROCESSES',
  WORKS: 'AOS_MASTER_WORKS',
  PEOPLE: 'AOS_MASTER_PEOPLE',
  ANCIENT_INGREDIENTS: "AOS_ANCIENT_INGREDIENTS",
  INGREDIENT_PRODUCTS: "AOS_INGREDIENT_PRODUCTS",
  MATERIAL_SOURCES: "AOS_MATERIAL_SOURCES",
  IDENTIFICATIONS: "AOS_IDENTIFICATIONS",
  DB_VERSION: 'AOS_DB_VERSION',
  DB_INITIALIZED: 'AOS_DB_INITIALIZED'
};

const CURRENT_DB_VERSION = "1";

const writeDatabaseToStorage = (data: DatabaseState) => {
  localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(data.recipes));
  localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(data.masterIngredients));
  localStorage.setItem(STORAGE_KEYS.TOOLS, JSON.stringify(data.masterTools));
  localStorage.setItem(STORAGE_KEYS.PROCESSES, JSON.stringify(data.masterProcesses));
  localStorage.setItem(STORAGE_KEYS.WORKS, JSON.stringify(data.masterWorks));
  localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(data.masterPeople));
  localStorage.setItem(STORAGE_KEYS.ANCIENT_INGREDIENTS, JSON.stringify((data as any).ancientIngredients ?? []));
  localStorage.setItem(STORAGE_KEYS.INGREDIENT_PRODUCTS, JSON.stringify((data as any).ingredientProducts ?? []));
  localStorage.setItem(STORAGE_KEYS.MATERIAL_SOURCES, JSON.stringify((data as any).materialSources ?? []));
  localStorage.setItem(STORAGE_KEYS.IDENTIFICATIONS, JSON.stringify((data as any).identifications ?? []));
  localStorage.setItem(STORAGE_KEYS.DB_VERSION, CURRENT_DB_VERSION);
  localStorage.setItem(STORAGE_KEYS.DB_INITIALIZED, "true");
};

export const StorageAdapter = {
  load: (): DatabaseState => {
    return {
      recipes: JSON.parse(localStorage.getItem(STORAGE_KEYS.RECIPES) || '[]'),
      masterIngredients: JSON.parse(localStorage.getItem(STORAGE_KEYS.INGREDIENTS) || '[]'),
      masterTools: JSON.parse(localStorage.getItem(STORAGE_KEYS.TOOLS) || '[]'),
      masterProcesses: JSON.parse(localStorage.getItem(STORAGE_KEYS.PROCESSES) || '[]'),
      masterWorks: JSON.parse(localStorage.getItem(STORAGE_KEYS.WORKS) || '[]'),
      masterPeople: JSON.parse(localStorage.getItem(STORAGE_KEYS.PEOPLE) || '[]'),
      ancientIngredients: JSON.parse(localStorage.getItem(STORAGE_KEYS.ANCIENT_INGREDIENTS) || "[]"),
      ingredientProducts: JSON.parse(localStorage.getItem(STORAGE_KEYS.INGREDIENT_PRODUCTS) || "[]"),
      materialSources: JSON.parse(localStorage.getItem(STORAGE_KEYS.MATERIAL_SOURCES) || "[]"),
      identifications: JSON.parse(localStorage.getItem(STORAGE_KEYS.IDENTIFICATIONS) || "[]"),
    };
  },

  save: (data: DatabaseState) => {
    writeDatabaseToStorage(data);
  },
  
  export: () => {
      const data = StorageAdapter.load();
      const blob = new Blob([JSON.stringify(data, null, 2)], {type : 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aos_backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
  },

  import: async (file: File): Promise<DatabaseState> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
              try {
                  const data = JSON.parse(e.target?.result as string);
                  // Ensure masterPeople exists for older backups
                  if (!data.masterPeople) data.masterPeople = [];
                  resolve(data);
              } catch (err) {
                  reject(err);
              }
          };
          reader.readAsText(file);
      });
  }
};

export const generateSlug = (text: string): string => {
  if (!text) return '';
  return text
    .normalize('NFD')                   // Decompose combined graphemes (e.g. ē -> e + ̄ )
    .replace(/[\u0300-\u036f]/g, "")    // Remove diacritical marks (accents, macrons, etc.)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')        // Replace non-alphanumeric with dashes
    .replace(/(^-|-$)+/g, '');          // Trim leading/trailing dashes
};

export const generateURN = (type: string, slug: string): string => {
  return `urn:aos:${type}:${slug}`;
};

const shouldInitializeFromSeed = (): boolean => {
  const version = localStorage.getItem(STORAGE_KEYS.DB_VERSION);
  const initialized = localStorage.getItem(STORAGE_KEYS.DB_INITIALIZED);
  const hasRecipes = localStorage.getItem(STORAGE_KEYS.RECIPES);
  return version !== CURRENT_DB_VERSION || initialized !== "true" || !hasRecipes;
};

export const loadState = async (): Promise<DatabaseState> => {
  const tryFetchSeedDb = async (): Promise<DatabaseState | null> => {
    try {
      const base = import.meta.env.BASE_URL || "/";
      const normalizedBase = base.endsWith("/") ? base : `${base}/`;
      const seedUrl = `${normalizedBase}data/seed.json`;
      const response = await fetch(seedUrl, { cache: "no-cache" });
      if (!response.ok) return null;
      return (await response.json()) as DatabaseState;
    } catch {
      return null;
    }
  };

  const backfillAncientTermIds = (db: DatabaseState): boolean => {
    let changed = false;
    for (const recipe of db.recipes ?? []) {
      for (const item of recipe.items ?? []) {
        if (item.type !== "ingredient") continue;
        if ((item as RecipeItem).ancientTermId) continue;
        const pinned = recipeItemToAncientTermId[`${recipe.id}:${item.id}`];
        if (pinned) {
          (item as RecipeItem).ancientTermId = pinned;
          changed = true;
        }
      }
    }
    return changed;
  };

  const mergeMissingCollectionsFromSeed = (db: DatabaseState, seedDb: DatabaseState | null): boolean => {
    const seed = seedDb ?? ({} as DatabaseState);
    let changed = false;

    const ensureArrayKey = <K extends keyof DatabaseState>(key: K): void => {
      const currentValue = (db as any)[key];
      const seedValue = (seed as any)[key];

      if (Array.isArray(currentValue)) {
        if (currentValue.length === 0 && Array.isArray(seedValue) && seedValue.length > 0) {
          (db as any)[key] = seedValue;
          changed = true;
        }
        return;
      }

      (db as any)[key] = Array.isArray(seedValue) ? seedValue : [];
      changed = true;
    };

    const mergeArrayById = <K extends keyof DatabaseState>(key: K): void => {
      const currentValue = (db as any)[key];
      const seedValue = (seed as any)[key];
      if (!Array.isArray(seedValue)) {
        ensureArrayKey(key);
        return;
      }

      if (!Array.isArray(currentValue)) {
        (db as any)[key] = seedValue;
        changed = true;
        return;
      }

      if (currentValue.length === 0 && seedValue.length > 0) {
        (db as any)[key] = seedValue;
        changed = true;
        return;
      }

      const currentIds = new Set<string>(currentValue.map((item: any) => item?.id).filter(Boolean));
      const additions = seedValue.filter((item: any) => item?.id && !currentIds.has(item.id));
      if (additions.length > 0) {
        (db as any)[key] = [...currentValue, ...additions];
        changed = true;
      }
    };

    mergeArrayById("recipes");
    mergeArrayById("masterIngredients");
    mergeArrayById("masterTools");
    mergeArrayById("masterProcesses");
    mergeArrayById("masterWorks");
    mergeArrayById("masterPeople");
    mergeArrayById("ancientIngredients");
    mergeArrayById("ingredientProducts");
    mergeArrayById("materialSources");
    mergeArrayById("identifications");
    return changed;
  };

  if (!shouldInitializeFromSeed()) {
    const current = StorageAdapter.load();
    const seedDb = await tryFetchSeedDb();
    const changed =
      mergeMissingCollectionsFromSeed(current, seedDb) ||
      backfillAncientTermIds(current);
    if (changed) writeDatabaseToStorage(current);
    return current;
  }

  try {
    const base = import.meta.env.BASE_URL || "/";
    const normalizedBase = base.endsWith("/") ? base : `${base}/`;
    const seedUrl = `${normalizedBase}data/seed.json`;
    const response = await fetch(seedUrl, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Failed to fetch seed.json: ${response.status} ${response.statusText}`);
    }
    const seed = (await response.json()) as DatabaseState;
    backfillAncientTermIds(seed);
    mergeMissingCollectionsFromSeed(seed, seed);
    writeDatabaseToStorage(seed);
    return StorageAdapter.load();
  } catch (error) {
    console.warn("Seed overlay failed; falling back to existing localStorage state.", error);
    const current = StorageAdapter.load();
    const changed = backfillAncientTermIds(current) || mergeMissingCollectionsFromSeed(current, null);
    if (changed) writeDatabaseToStorage(current);
    return current;
  }
};

export const saveState = (data: DatabaseState) => StorageAdapter.save(data);
