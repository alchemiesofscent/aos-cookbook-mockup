export type StudioConfidence = "established" | "probable" | "possible" | "speculative";

export type StudioSourceKind = "scholarly" | "project" | "none";

export interface StudioSource {
  kind: StudioSourceKind;
  citation: string;
  urn?: string;
  route?: string;
}

export interface StudioIdentificationOption {
  id: string;
  label: string;
  confidence: StudioConfidence;
  placeholder: boolean;
  source?: StudioSource;
}

export interface StudioTermCatalogEntry {
  termId: string;
  term: string;
  transliteration?: string;
  options: StudioIdentificationOption[];
}

export const studioCatalog: StudioTermCatalogEntry[] = [
  {
    termId: "skhoinos",
    term: "σχοῖνος",
    transliteration: "skhoinos",
    options: [
      {
        id: "opt-lemongrass",
        label: "Lemongrass",
        confidence: "probable",
        placeholder: false,
        source: {
          kind: "project",
          citation: "Project master ingredient record: Lemongrass (urn:aos:ingredient:skhoinos).",
          urn: "urn:aos:ingredient:skhoinos",
        },
      },
      {
        id: "opt-rush-reed-unresolved",
        label: "Rush/Reed (unresolved modern identification)",
        confidence: "possible",
        placeholder: true,
        source: {
          kind: "project",
          citation: "Recipe annotation (Rose Perfume): “A rush or reed; identification varies in the secondary literature.”",
          route: "recipe_rose",
        },
      },
    ],
  },
];

