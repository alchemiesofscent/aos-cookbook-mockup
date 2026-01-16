export type RouteId = string;

export type HomepagePrimaryCardTint = "indigo" | "emerald";

export interface HomepageExploreTabItem {
  label: string;
  route?: RouteId;
}

export interface HomepageExploreTab {
  label: string;
  items: HomepageExploreTabItem[];
}

export interface HomepagePrimaryCard {
  title: string;
  kicker: string;
  body: string;
  cta: string;
  route: RouteId;
  tint: HomepagePrimaryCardTint;
}

export interface HomepageContentCard {
  title: string;
  subtitle: string;
  tag: string;
  route: RouteId;
  accent: "rose" | "resin" | "methods";
}

export interface HomepageUpdate {
  title: string;
  meta: string;
  route: RouteId;
}

export const homepageContent = {
  hero: {
    title: "Ancient perfume recipes, unpacked.",
    subtitle: "Read the texts. Trace the ingredients. See the evidence. Smell the results.",
  },
  search: {
    placeholder: "Search recipes, ingredients, works, people…",
    examples: ["rose oil", "σμύρνα", "Dioscorides", "enfleurage"],
  },
  primaryCards: [
    {
      title: "The Library",
      kicker: "Textual witnesses",
      body: "Clean reading views with citable identifiers and layered notes.",
      cta: "Browse recipes",
      route: "archive",
      tint: "indigo",
    },
    {
      title: "The Workshop",
      kicker: "Materials & methods",
      body: "Ancient terms, identifications, products and processes.",
      cta: "Browse ingredients",
      route: "ingredients",
      tint: "emerald",
    },
  ] satisfies HomepagePrimaryCard[],
  feature: {
    title: "Rose Perfume",
    recipeSlug: "rose-perfume-dioscorides",
    recipeRoute: "recipe:r-rose-perfume",
    subtitleFallback: "Dioscorides, Mat. Med. 1.43",
    blurb: "A “rose” perfume sharpened with citrus-green notes once you follow σχοῖνος.",
    primaryCta: { label: "Read recipe →", route: "recipe:r-rose-perfume" },
    secondaryCta: { label: "View interpretation chain →", route: "ancient-term:ai-skhoinos" },
  },
  exploreTabs: [
    {
      label: "Period",
      items: [
        { label: "Classical", route: "archive" },
        { label: "Hellenistic", route: "archive" },
        { label: "Roman", route: "archive" },
      ],
    },
    {
      label: "Source work",
      items: [
        { label: "Dioscorides", route: "work:w-materia-medica" },
        { label: "Theophrastus", route: "works" },
        { label: "Pliny", route: "works" },
      ],
    },
    {
      label: "Scent family",
      items: [
        { label: "Floral", route: "ingredients" },
        { label: "Resinous", route: "ingredients" },
        { label: "Spiced", route: "ingredients" },
        { label: "Balsamic", route: "ingredients" },
      ],
    },
    {
      label: "Process",
      items: [
        { label: "Maceration", route: "processes" },
        { label: "Stypsis", route: "processes" },
        { label: "Boiling", route: "workshop-process:pr-boiling" },
        { label: "Distillation", route: "processes" },
      ],
    },
  ] satisfies HomepageExploreTab[],
  experiments: [
    {
      title: "Replicating Rose Perfume",
      subtitle: "Cold maceration · oil matrices",
      tag: "Experiment",
      route: "experiments",
      accent: "rose",
    },
    {
      title: "Megalleion Trials",
      subtitle: "Resins · aromatics · ageing",
      tag: "Series",
      route: "experiments",
      accent: "resin",
    },
    {
      title: "Methods Note: GC–MS & FTIR",
      subtitle: "Reference spectra · reporting",
      tag: "Methods",
      route: "experiments",
      accent: "methods",
    },
  ] satisfies HomepageContentCard[],
  updates: [
    { title: "Symposium photos now online", meta: "January 2026", route: "news" },
    { title: "New paper: On the scent of myrrh", meta: "December 2025", route: "news" },
    { title: "Upcoming event: Spring workshop", meta: "March 2026", route: "news" },
  ] satisfies HomepageUpdate[],
} as const;
