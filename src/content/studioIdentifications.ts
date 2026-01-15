export type StudioConfidence = "high" | "medium" | "low";

export type StudioSourceKind = "work" | "bibliography" | "project" | "none";

export interface StudioIdentificationOption {
  id: string;
  label: string;
  confidence: StudioConfidence;
  citations: string[];
  sourceKind: StudioSourceKind;
  placeholder: boolean;
  linkTarget: string | null;
}

export type StudioIngredientKey = string;

export type StudioIdentificationsByRecipe = Record<string, Record<StudioIngredientKey, StudioIdentificationOption[]>>;

export const studioIdentifications: StudioIdentificationsByRecipe = {
  "r-rose-perfume": {
    "ri-1": [
      {
        id: "schoinos-opt-01",
        label: "Cymbopogon schoenanthus (camel grass)",
        confidence: "high",
        citations: [
          "Project placeholder: add your preferred published authority supporting Cymbopogon schoenanthus for σχοῖνος.",
        ],
        sourceKind: "project",
        placeholder: true,
        linkTarget: null,
      },
      {
        id: "schoinos-opt-02",
        label: "Cymbopogon citratus (lemongrass)",
        confidence: "medium",
        citations: [
          "Project placeholder: add your preferred published authority supporting Cymbopogon citratus for σχοῖνος.",
        ],
        sourceKind: "project",
        placeholder: true,
        linkTarget: null,
      },
    ],
  },
};

export const isCitableStudioOption = (option: StudioIdentificationOption): boolean => {
  if (option.placeholder) return false;
  if (option.sourceKind !== "work" && option.sourceKind !== "bibliography") return false;
  return option.citations.some((c) => c.trim().length > 0);
};

