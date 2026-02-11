export type WorkshopEntityKind = "ingredient" | "tool" | "process";

export type WorkshopEntityRoute =
  | { kind: WorkshopEntityKind; mode: "master"; id: string }
  | { kind: WorkshopEntityKind; mode: "unlinked"; recipeId: string; itemId: string };

export type InterpretationRoute =
  | { kind: "ancient-term"; id: string }
  | { kind: "identification"; id: string }
  | { kind: "ingredient-product"; id: string }
  | { kind: "material-source"; id: string };

export type RecipeRoute = { id: string };

export type PersonRoute = { id: string };
export type WorkRoute = { id: string };

export type NavigateOptions = {
  replace?: boolean;
  searchQuery?: string;
  params?: Record<string, string>;
};

export type NavigateFn = (route: string, options?: NavigateOptions) => void;

export type NavigationState = {
  route: string;
  searchQuery?: string;
  params?: Record<string, string>;
  fromRoute?: string;
  fromQuery?: string;
  fromParams?: Record<string, string>;
};
