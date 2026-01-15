export interface StudioRecipeContent {
  recipeId: string;
  titleOverride?: string;
  intro: string;
  time: string;
  yieldBasisIngredientKey: string;
  heroImageAlt: string;
  steps: string[];
}

export const studioRecipes: Record<string, StudioRecipeContent> = {
  "r-rose-perfume": {
    recipeId: "r-rose-perfume",
    intro: "Curated Studio copy pending.",
    time: "Time: curated estimate pending.",
    yieldBasisIngredientKey: "ri-2",
    heroImageAlt: "Hero image placeholder.",
    steps: ["Curated Studio steps pending."],
  },
};
