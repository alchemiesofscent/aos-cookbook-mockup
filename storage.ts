import { DatabaseState, MasterEntity, Recipe } from "./types";

const STORAGE_KEYS = {
  RECIPES: 'AOS_RECIPES',
  INGREDIENTS: 'AOS_MASTER_INGREDIENTS',
  TOOLS: 'AOS_MASTER_TOOLS',
  PROCESSES: 'AOS_MASTER_PROCESSES',
  WORKS: 'AOS_MASTER_WORKS'
};

export const StorageAdapter = {
  load: (): DatabaseState => {
    return {
      recipes: JSON.parse(localStorage.getItem(STORAGE_KEYS.RECIPES) || '[]'),
      masterIngredients: JSON.parse(localStorage.getItem(STORAGE_KEYS.INGREDIENTS) || '[]'),
      masterTools: JSON.parse(localStorage.getItem(STORAGE_KEYS.TOOLS) || '[]'),
      masterProcesses: JSON.parse(localStorage.getItem(STORAGE_KEYS.PROCESSES) || '[]'),
      masterWorks: JSON.parse(localStorage.getItem(STORAGE_KEYS.WORKS) || '[]'),
    };
  },

  save: (data: DatabaseState) => {
    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(data.recipes));
    localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(data.masterIngredients));
    localStorage.setItem(STORAGE_KEYS.TOOLS, JSON.stringify(data.masterTools));
    localStorage.setItem(STORAGE_KEYS.PROCESSES, JSON.stringify(data.masterProcesses));
    localStorage.setItem(STORAGE_KEYS.WORKS, JSON.stringify(data.masterWorks));
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
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

export const generateURN = (type: string, slug: string): string => {
  return `urn:aos:${type}:${slug}`;
};
