import type { AnnotationRecord, TextSegment } from "./types";

const normalizeVisibleText = (value: string): string =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^[\s.,;:!?()[\]{}"'“”‘’]+|[\s.,;:!?()[\]{}"'“”‘’]+$/g, "");

const looksSharplyDifferent = (segmentText: string, annotationTerm: string): boolean => {
  const a = normalizeVisibleText(segmentText);
  const b = normalizeVisibleText(annotationTerm);
  if (!a || !b) return false;
  if (a === b) return false;
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  if (aLower.includes(bLower) || bLower.includes(aLower)) return false;

  const aNoParens = aLower.replace(/\([^)]*\)/g, "").trim();
  const bNoParens = bLower.replace(/\([^)]*\)/g, "").trim();
  if (!aNoParens || !bNoParens) return false;
  if (aNoParens.includes(bNoParens) || bNoParens.includes(aNoParens)) return false;

  return true;
};

export const assertRecipeAnnotationInvariants = (params: {
  recipeId?: string;
  segments: TextSegment[];
  annotations: Record<string, AnnotationRecord> | null | undefined;
  validateLinkRoutes?: boolean;
}): void => {
  const { recipeId, segments, annotations, validateLinkRoutes = true } = params;

  if (!annotations) {
    throw new Error(
      `Recipe${recipeId ? ` "${recipeId}"` : ""} is missing annotations map (required when segments contain annotations).`,
    );
  }

  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index];
    if (segment?.type !== "annotation") continue;

    const id = segment.id;
    if (!id) {
      throw new Error(
        `Recipe${recipeId ? ` "${recipeId}"` : ""} has an annotated segment with no id at index ${index}.`,
      );
    }

    const record = annotations[id];
    if (!record) {
      throw new Error(
        `Recipe${recipeId ? ` "${recipeId}"` : ""} references missing annotation id "${id}" at segment index ${index}.`,
      );
    }

    const links = record.links ?? [];
    if (validateLinkRoutes) {
      for (let linkIndex = 0; linkIndex < links.length; linkIndex++) {
        const link = links[linkIndex];
        if (typeof link?.route !== "string") {
          throw new Error(
            `Recipe${recipeId ? ` "${recipeId}"` : ""} annotation "${id}" has a non-string links[${linkIndex}].route.`,
          );
        }
      }
    }

    if (looksSharplyDifferent(segment.text, record.term)) {
      console.warn(
        `Recipe${recipeId ? ` "${recipeId}"` : ""} annotation "${id}" term/segment mismatch: segment text "${segment.text}" vs annotation.term "${record.term}".`,
      );
    }
  }
};

export const annotationsArrayToMap = <T extends { id: string }>(
  annotations: T[],
): Record<string, T> => {
  const map: Record<string, T> = {};
  for (const record of annotations) {
    if (!record?.id) {
      throw new Error(`Annotation record missing required "id".`);
    }
    if (map[record.id]) {
      throw new Error(`Duplicate annotation id "${record.id}" encountered while building map.`);
    }
    map[record.id] = record;
  }
  return map;
};
