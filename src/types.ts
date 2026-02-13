export interface ExternalLink {
  label: string;
  url: string;
}

export type ContentBlock = {
  type: "heading" | "paragraph";
  text: string;
};

export interface ContentSource {
  title?: string;
  slug?: string;
  link?: string;
  publishedAt?: string;
}

export interface ProjectContent {
  title: string;
  intro?: string;
  blocks: ContentBlock[];
  source?: ContentSource;
}

export interface NewsItem {
  id: string;
  title: string;
  date?: string;
  blocks: ContentBlock[];
  source?: ContentSource;
  categories?: string[];
}

export interface SiteContent {
  project?: ProjectContent;
  news?: NewsItem[];
}

export interface TextSegment {
  text: string;
  type?: "annotation";
  id?: string;
}

export interface AnnotationLink {
  label: string;
  route: string;
}

export interface AnnotationRecord {
  term: string;
  transliteration?: string;
  definition?: string;
  annotationType?: string;
  lemma?: string;
  links?: AnnotationLink[];
}

export interface MasterEntity {
  id: string;
  slug: string;
  urn: string;
  name: string;
  displayName?: string;
  sortName?: string;
  categories?: string[];
  originalName?: string; // Ancient/Greek term
  transliteratedName?: string; // Latinized ancient term
  description: string;
  bio?: string;
  family?: string; // For ingredients
  source?: string; // For ingredients (botanical source)
  type?: string; // For tools (Tool type)
  role?: string; // For people (e.g. "Physician")
  roles?: string[]; // For people
  affiliations?: string[]; // For people
  shortBlurb?: string; // For people cards/indexes
  affiliationsDetailed?: Array<{
    institution: string;
    department?: string;
    location?: string;
    url?: string;
  }>; // For people
  publications?: ExternalLink[]; // For people
  image?: {
    src: string;
    alt?: string;
    credit?: string;
  };
  links?: ExternalLink[];
  legacy?: {
    sourceUrl?: string;
    sourcePostName?: string;
  };
  todo?: string[];
  parentId?: string; // For hierarchical works (e.g. Edition -> Work)
  author?: string; // For works (Legacy/Display string)
  authorId?: string; // For works (Link to Person)
  date?: string; // For works (Date) or People (Period)
  language?: string; // For works
  place?: string; // For works
  externalLinks?: ExternalLink[]; // For people/works (e.g. Wikipedia, VIAF)
  externalIds?: Record<string, string>; // For people/works (e.g. VIAF, ORCID)
}

export interface Quantity {
  value: number;
  unit: string;
  unitKey?: string;
  unitType?: "weight" | "volume" | "n/a";
  displayUnit?: string;
  isEstimate?: boolean;
  unitRaw?: {
    term: string;
    transliteration?: string;
    kind?: "mass" | "volume" | "count" | "other";
  };
  needsReview?: boolean;
}

export interface RecipeItem {
  id: string; // unique instance id
  masterId: string | null;
  ancientTermId?: string;
  originalTerm: string;
  transliteration?: string;
  displayTerm: string;
  amount: string; // Human readable string (Translated, e.g. "5 lbs")
  originalAmount?: string; // Original text (e.g. "litras pente")
  quantities: Quantity[]; // Structured data for normalization
  role: string;
  annotation?: string;
  sequenceOrder?: number;
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
    combinedSegments?: TextSegment[];
  };
  annotations?: Record<string, AnnotationRecord>;
  items: RecipeItem[];
}

export type PlaceholderSourceKind = "project" | "work" | "bibliography" | "none";

export interface PlaceholderStamped {
  placeholder: boolean;
  sourceKind: PlaceholderSourceKind;
}

export interface AncientIngredient extends PlaceholderStamped {
  id: string; // ai-*
  term: string; // Greek/Latin term
  transliteration?: string;
  description?: string;
}

export interface IngredientProduct extends PlaceholderStamped {
  id: string; // ip-*
  label: string;
  description?: string;
}

export interface MaterialSource extends PlaceholderStamped {
  id: string; // ms-*
  label: string;
  description?: string;
}

export interface Identification extends PlaceholderStamped {
  id: string; // id-*
  ancientIngredientId: string; // ai-*
  ingredientProductId: string; // ip-*
  materialSourceId?: string; // ms-*
  confidence?: "established" | "probable" | "speculative";
  workId?: string;
  locator?: string;
  notes?: string;
}

export interface DatabaseState {
  recipes: Recipe[];
  masterIngredients: MasterEntity[];
  masterTools: MasterEntity[];
  masterProcesses: MasterEntity[];
  masterWorks: MasterEntity[];
  masterPeople: MasterEntity[];
  ancientIngredients: AncientIngredient[];
  ingredientProducts: IngredientProduct[];
  materialSources: MaterialSource[];
  identifications: Identification[];
  siteContent?: SiteContent;
  pins?: {
    recipeItemToAncientTermId?: Record<string, string>;
    recipeAnnotationToAncientTermId?: Record<string, string>;
  };
}
