export interface MasterEntity {
  id: string;
  slug: string;
  urn: string;
  name: string;
  description: string;
  family?: string; // For ingredients
  source?: string; // For ingredients (botanical source)
  type?: string; // For tools (Tool type)
  parentId?: string; // For hierarchical works (e.g. Edition -> Work)
  author?: string; // For works
  date?: string; // For works
  language?: string; // For works
  place?: string; // For works
}

export interface Quantity {
  value: number;
  unit: string;
}

export interface RecipeItem {
  id: string; // unique instance id
  masterId: string | null;
  originalTerm: string;
  displayTerm: string;
  amount: string; // Human readable string
  quantities: Quantity[]; // Structured data for normalization
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
    attribution: string;
    language: string;
    date: string;
    place: string;
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
