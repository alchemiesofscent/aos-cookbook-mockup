export interface StudioTimeBlock {
  active: string | null;
  total: string | null;
  note: string;
}

export interface StudioHeroImage {
  alt: string;
  caption: string | null;
}

export interface StudioRecipeContent {
  recipeId: string;
  titleOverride?: string;
  intro: string;
  time: StudioTimeBlock;
  yieldBasisIngredientKey: string;
  steps: string[];
  disclaimers: string[];
  heroImage: StudioHeroImage;
}

export const studioRecipes: Record<string, StudioRecipeContent> = {
  "r-rose-perfume": {
    recipeId: "r-rose-perfume",
    intro:
      "This recipe makes rose-scented oil by first boiling an aromatic plant material in oil, then infusing the oil with dried rose petals. You will stir and press the mixture, leave it overnight, then strain and decant the oil once the sediment settles. The text describes repeating the infusion several times to strengthen the scent.",
    time: {
      active: null,
      total: null,
      note: "The text specifies an overnight rest; it does not give durations for boiling, settling, or later infusion cycles.",
    },
    yieldBasisIngredientKey: "ri-2",
    steps: [
      "Cut and soften the aromatic plant material in water, then add it to the oil. Boil while stirring.",
      "Strain the oil. Add the dried rose petals to the strained oil, then stir repeatedly and press gently with honey-coated hands.",
      "Leave overnight, then press out and strain the oil. After the sediment settles, transfer the clear oil to a clean container and store it in a vessel smeared with honey.",
      "Put the strained rose petals into a small basin. Pour in the measured portion of pressed oil and strain again to produce a second batch.",
      "If desired, repeat by adding fresh dried roses to the previously strained oil and carrying out the same pressing and straining to make further batches. The text allows repeated infusions up to seven times, and advises smearing the receiving vessels with honey each time.",
      "Separate the oil carefully from any sediment, since even a small amount left behind spoils the preparation. The text also reports alternative practices as optional variations.",
    ],
    disclaimers: [
      "Some ingredients, especially the aromatic plant material, may have multiple modern identifications; select an interpretation in the Studio drawer if options are provided.",
      "Several additions and alternative methods are attributed to “some people” in the text and should be treated as optional variations rather than required steps.",
    ],
    heroImage: {
      alt: "Rose-infused oil in a jar",
      caption: null,
    },
  },
};
