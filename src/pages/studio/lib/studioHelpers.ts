import type { Quantity, Recipe, RecipeItem } from "../../../types";
import { isCitableStudioOption, studioIdentifications, type StudioIdentificationOption } from "../../../content/studioIdentifications";
import type { UnitEquivalentsLookup, UnitTypeKey } from "../../../studio/unitEquivalents";
import type { StudioSession } from "../../../studio/storage";

type StudioRecipe = {
  titleOverride?: string;
  intro?: string;
  disclaimers?: string[];
  steps?: string[];
  time?: { note?: string };
  yieldBasisIngredientKey?: string;
} | undefined;

export const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export const formatMetric = (params: { unitType: UnitTypeKey; value: number; countUnitLabel?: string | null }): string => {
  const { unitType, value, countUnitLabel } = params;
  if (unitType === "n/a") {
    const label = (countUnitLabel ?? "").trim() || "count";
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(value))} ${label}`;
  }

  if (unitType === "weight") {
    if (value >= 1000) return `${numberFormat.format(value / 1000)} kg`;
    return `${numberFormat.format(value)} g`;
  }

  if (value >= 1000) return `${numberFormat.format(value / 1000)} l`;
  return `${numberFormat.format(value)} ml`;
};

const normalizeQuantityType = (quantity: Quantity, equivalents: UnitEquivalentsLookup): UnitTypeKey | null => {
  if (quantity.unitType) return quantity.unitType;
  const key = quantity.unitKey ?? quantity.unit;
  const candidates: UnitTypeKey[] = ["weight", "volume", "n/a"].filter((t) => key in equivalents[t]) as UnitTypeKey[];
  if (candidates.length === 1) return candidates[0];
  return null;
};

const normalizeQuantityKey = (quantity: Quantity): string => {
  return quantity.unitKey ?? quantity.unit;
};

export const computeConvertibleMetricTotal = (params: {
  quantities: Quantity[];
  scale: number;
  equivalents: UnitEquivalentsLookup;
}):
  | { ok: true; unitType: UnitTypeKey; metricTotal: number; countUnitLabel: string | null }
  | { ok: false } => {
  const { quantities, scale, equivalents } = params;
  if (!quantities.length) return { ok: false };
  if (!Number.isFinite(scale) || scale <= 0) return { ok: false };

  let unitType: UnitTypeKey | null = null;
  let total = 0;
  let countUnitLabel: string | null = null;

  for (const q of quantities) {
    if (!Number.isFinite(q.value)) return { ok: false };
    const resolvedType = normalizeQuantityType(q, equivalents);
    if (!resolvedType) return { ok: false };
    const key = normalizeQuantityKey(q);
    const factor = equivalents[resolvedType]?.[key];
    if (!Number.isFinite(factor)) return { ok: false };
    if (unitType && unitType !== resolvedType) return { ok: false };
    unitType = resolvedType;

    if (resolvedType === "n/a") {
      const label =
        (q.displayUnit?.trim() || "") ||
        (q.unit && q.unit !== "count" && q.unit !== "number-n/a" ? q.unit.trim() : "");
      if (label) {
        if (countUnitLabel && countUnitLabel !== label) return { ok: false };
        countUnitLabel = label;
      }
    }

    const scaledValue = q.value * scale;
    total += scaledValue * factor;
  }

  if (!unitType) return { ok: false };
  return { ok: true, unitType, metricTotal: total, countUnitLabel };
};

export const getIngredientOptions = (recipeId: string, ingredientKey: string): StudioIdentificationOption[] => {
  return studioIdentifications[recipeId]?.[ingredientKey] ?? [];
};

export const getIngredientBaseEnglishName = (ing: RecipeItem, hasOptions: boolean): string => {
  const display = ing.displayTerm?.trim();
  if (display) return display;
  if (hasOptions) return "Aromatic plant material";
  return "Ingredient";
};

export const getIngredientDisplayName = (params: {
  recipeId: string;
  ing: RecipeItem;
  session: StudioSession;
}): string => {
  const { recipeId, ing, session } = params;
  const hasOptions = getIngredientOptions(recipeId, ing.id).length > 0;
  const base = getIngredientBaseEnglishName(ing, hasOptions);
  const selectedId = session.selectedOptionByIngredientKey[ing.id];
  const opt = selectedId ? getIngredientOptions(recipeId, ing.id).find((o) => o.id === selectedId) ?? null : null;
  return opt?.label ?? base;
};

export const getSelectedOption = (params: {
  recipeId: string;
  ingredientKey: string;
  session: StudioSession;
}): StudioIdentificationOption | null => {
  const options = getIngredientOptions(params.recipeId, params.ingredientKey);
  const selectedId = params.session.selectedOptionByIngredientKey[params.ingredientKey];
  if (!selectedId) return null;
  return options.find((o) => o.id === selectedId) ?? null;
};

export const buildExportText = (params: {
  recipe: Recipe;
  studio: StudioRecipe;
  session: StudioSession;
  equivalents: UnitEquivalentsLookup;
}): string => {
  const { recipe, studio, session, equivalents } = params;

  const ingredientLines = recipe.items
    .filter((i) => i.type === "ingredient")
    .map((ing) => {
      const metric = computeConvertibleMetricTotal({ quantities: ing.quantities ?? [], scale: session.scale, equivalents });
      const amount = metric.ok ? formatMetric({ unitType: metric.unitType, value: metric.metricTotal, countUnitLabel: metric.countUnitLabel }) : "amount unavailable";
      const displayName = getIngredientDisplayName({ recipeId: recipe.id, ing, session });
      return `- ${displayName}: ${amount}`;
    });

  const selected = recipe.items
    .filter((i) => i.type === "ingredient")
    .map((ing) => {
      const opt = getSelectedOption({ recipeId: recipe.id, ingredientKey: ing.id, session });
      if (!opt) return null;
      const baseName = getIngredientBaseEnglishName(ing, getIngredientOptions(recipe.id, ing.id).length > 0);
      const badge = opt.placeholder ? " (demo placeholder; not citable)" : "";
      return `- ${baseName} → ${opt.label} [${opt.confidence}]${badge}`;
    })
    .filter(Boolean) as string[];

  const citations = recipe.items
    .filter((i) => i.type === "ingredient")
    .flatMap((ing) => {
      const opt = getSelectedOption({ recipeId: recipe.id, ingredientKey: ing.id, session });
      if (!opt || !isCitableStudioOption(opt)) return [];
      const baseName = getIngredientBaseEnglishName(ing, getIngredientOptions(recipe.id, ing.id).length > 0);
      return opt.citations.map((c) => `- ${baseName}: ${c}`);
    });

  const yieldBasis = studio?.yieldBasisIngredientKey
    ? recipe.items.find((i) => i.id === studio.yieldBasisIngredientKey) ?? null
    : null;
  const yieldMetric = yieldBasis
    ? computeConvertibleMetricTotal({ quantities: yieldBasis.quantities ?? [], scale: session.scale, equivalents })
    : { ok: false as const };
  const yieldDisplay = yieldMetric.ok
    ? formatMetric({ unitType: yieldMetric.unitType, value: yieldMetric.metricTotal, countUnitLabel: yieldMetric.countUnitLabel })
    : "yield unavailable";

  const header = [
    "ALCHEMIES OF SCENT — STUDIO (PREVIEW)",
    "Practical recipe card (local draft; read-only composer)",
    "",
    `Title: ${studio?.titleOverride ?? recipe.metadata.title}`,
    `URN: ${recipe.urn}`,
    `Scale: ${numberFormat.format(session.scale)}×`,
    `Yield: ${yieldDisplay}`,
    `Time note: ${studio?.time?.note ?? "time unavailable"}`,
    "",
  ];

  const introBlock = studio?.intro ? ["Intro", studio.intro, ""] : [];
  const disclaimersBlock = studio?.disclaimers?.length ? ["Notes", ...studio.disclaimers.map((d) => `- ${d}`), ""] : [];
  const ingredientsBlock = ["Ingredients", ...ingredientLines, ""];
  const stepsBlock = ["Steps", ...(studio?.steps?.length ? studio.steps.map((s, i) => `${i + 1}. ${s}`) : ["1. Steps unavailable."]), ""];
  const selectedBlock = selected.length ? ["Selected interpretations", ...selected, ""] : [];
  const citationsBlock = ["Citations", ...(citations.length ? citations : ["- (No citable sources for selected options.)"]), ""];

  return [...header, ...introBlock, ...disclaimersBlock, ...ingredientsBlock, ...stepsBlock, ...selectedBlock, ...citationsBlock].join("\n");
};

