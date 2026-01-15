export type UnitTypeKey = "weight" | "volume" | "n/a";

export interface UnitEquivalentsFile {
  version: string;
  notes?: string;
  bases?: Partial<Record<UnitTypeKey, string>>;
  units: Array<{
    greek?: string;
    transliteration?: string;
    type: UnitTypeKey;
    key: string;
    metricEquivalent: number;
    baseEquivalent?: string;
  }>;
}

export type UnitEquivalentsLookup = Record<UnitTypeKey, Record<string, number>>;

const BUILTIN_MODERN_EQUIVALENTS: UnitEquivalentsLookup = {
  weight: {
    lb: 453.59237,
    oz: 28.349523125,
    g: 1,
    kg: 1000,
  },
  volume: {
    ml: 1,
    l: 1000,
  },
  "n/a": {
    count: 1,
    "number-n/a": 1,
  },
};

let cached: UnitEquivalentsLookup | null = null;
let cachedPromise: Promise<UnitEquivalentsLookup> | null = null;

const emptyLookup = (): UnitEquivalentsLookup => ({ weight: {}, volume: {}, "n/a": {} });

export const loadUnitEquivalents = async (): Promise<UnitEquivalentsLookup> => {
  if (cached) return cached;
  if (cachedPromise) return cachedPromise;

  cachedPromise = (async () => {
    const base = import.meta.env.BASE_URL || "/";
    const normalizedBase = base.endsWith("/") ? base : `${base}/`;
    const url = `${normalizedBase}data/unit_equivalents.json`;

    try {
      const response = await fetch(url, { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`Failed to fetch unit_equivalents.json: ${response.status} ${response.statusText}`);
      }
      const parsed = (await response.json()) as UnitEquivalentsFile;
      const lookup = emptyLookup();
      for (const unit of parsed.units ?? []) {
        if (!unit?.type || !unit?.key) continue;
        if (!Number.isFinite(unit.metricEquivalent)) continue;
        lookup[unit.type][unit.key] = unit.metricEquivalent;
      }

      cached = {
        weight: { ...BUILTIN_MODERN_EQUIVALENTS.weight, ...lookup.weight },
        volume: { ...BUILTIN_MODERN_EQUIVALENTS.volume, ...lookup.volume },
        "n/a": { ...BUILTIN_MODERN_EQUIVALENTS["n/a"], ...lookup["n/a"] },
      };
      return cached;
    } catch {
      cached = BUILTIN_MODERN_EQUIVALENTS;
      return cached;
    } finally {
      cachedPromise = null;
    }
  })();

  return cachedPromise;
};

