export interface MasterEntity {
  id: string;
  slug: string;
  urn: string;
  name: string;
  description: string;
  family?: string; // For ingredients
  source?: string; // For ingredients (botanical source)
  type?: string; // For tools (Tool type)
}

export interface RecipeItem {
  id: string; // unique instance id
  masterId: string | null;
  originalTerm: string;
  displayTerm: string;
  amount: string;
  role: string;
  annotation?: string;
  type: 'ingredient' | 'tool' | 'process';
}

export interface Recipe {
  id: string;
  slug: string;
  urn: string;
  metadata: {
    title: string;
    sourceWorkId: string;
    author: string;
    language: string;
    date: string;
  };
  text: {
    original: string;
    translation: string;
    notes: string;
  };
  items: RecipeItem[];
}

export interface DatabaseState {
  recipes: Recipe[];
  masterIngredients: MasterEntity[];
  masterTools: MasterEntity[];
  masterProcesses: MasterEntity[];
  masterWorks: MasterEntity[];
}
