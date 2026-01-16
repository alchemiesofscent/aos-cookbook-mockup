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
  "r-lily-dioscorides": {
    recipeId: "r-lily-dioscorides",
    intro:
      "This recipe makes lily-scented oil (sousinon/leirinon) by first steeping aromatics in wine, then boiling them with oil and straining. The oil is treated by pouring it over soaked ground cardamom, then infused with fresh lily petals. Three grades of perfume are produced by pressing the same lily petals three times: the first pressing is best, while the second and third are made by rinsing the petals with additional aromatized oil. The text emphasizes careful separation from water during decanting to avoid spoilage.",
    time: {
      active: null,
      total: null,
      note: "The text specifies a full day and night resting period for the lily infusion; it does not specify durations for steeping the aromatics in wine, boiling, short rests, or later cycles (a practical steep could be hours to a few days).",
    },
    yieldBasisIngredientKey: "ri-1",
    steps: [
      "Soak calamus and myrrh in fragrant wine until moistened and aromatic (the text does not specify a time; a practical rest could be several hours up to three days).",
      "Add the wine-steeped calamus and myrrh to the oil, then boil. Strain the oil.",
      "Grind cardamom and soak it in rainwater. Pour the strained oil over the soaked cardamom. Let it rest briefly, then press out and strain to obtain aromatized oil.",
      "Measure out one-third of the aromatized oil (reserve the remaining two-thirds). Pluck the petals from fresh lilies and spread them in a wide, shallow basin.",
      "Pour the oil over the lilies and stir repeatedly with hands smeared with honey. Leave for one day and one night.",
      "In the morning, transfer the lilies (and oil) to a strainer basket and press/strain: this runoff is the first grade and best perfume.",
      "Return the pressed lilies to the basin. Pour over them one of the remaining thirds of aromatized oil, add fresh ground cardamom, stir, pause briefly, then press/strain again: this runoff is the second grade.",
      "Repeat the same rinse and pressing a third time with the last third of aromatized oil and more cardamom: this runoff is the third grade and least.",
      "Immediately separate each grade of oil from any pressed-out water. Decant repeatedly into honey-smeared vessels, sprinkling in fine salt and removing impurities as they collect.",
      "If desired, strengthen the scent by repeating the lily infusion cycles using fresh lilies, continuing to add cardamom as described. Finish by mixing in myrrh, cinnamon, and saffron (or use the alternate finishing method involving sifting spices and pre-anointing the receiving vessels with gum, myrrh, saffron, and honey diluted with water).",
    ],
    disclaimers: [
      "Some ingredient identifications are debated (e.g., κάλαμος); choose an interpretation in the Studio drawer if options are provided.",
      "Several additions and alternative methods are attributed to “some people” and should be treated as optional variations rather than required steps.",
      "The text warns that this preparation spoils if water remains mixed with the oil; take appropriate modern food-safety precautions if attempting a reconstruction.",
    ],
    heroImage: {
      alt: "Lily petals infusing in oil in a basin",
      caption: null,
    },
  },
};
