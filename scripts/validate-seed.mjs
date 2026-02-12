import fs from "node:fs/promises";

const SEED_PATH = "public/data/seed.json";
const VERSION_PATH = "public/data/version.json";
const HOMEPAGE_CONTENT_PATH = "src/content/homepage.ts";

const readJson = async (path) => {
  const text = await fs.readFile(path, "utf8");
  return JSON.parse(text);
};

const addError = (errors, path, entityId, field, reason) => {
  errors.push({ path, entityId, field, reason });
};

const ensureUniqueIdsPerCollection = (errors, seed) => {
  for (const [collectionKey, value] of Object.entries(seed)) {
    if (!Array.isArray(value)) continue;

    const seen = new Map();
    for (const item of value) {
      if (!item || typeof item !== "object") continue;
      if (typeof item.id !== "string" || item.id.length === 0) continue;
      if (!seen.has(item.id)) {
        seen.set(item.id, 1);
        continue;
      }
      addError(errors, SEED_PATH, `${collectionKey}:${item.id}`, "id", "duplicate id in collection");
    }
  }
};

const ensureUniqueUrnsGlobal = (errors, seed) => {
  const seen = new Map();
  const visit = (collectionKey, item) => {
    if (!item || typeof item !== "object") return;
    if (typeof item.urn !== "string" || item.urn.length === 0) return;
    if (!seen.has(item.urn)) {
      seen.set(item.urn, `${collectionKey}:${item.id ?? "(no-id)"}`);
      return;
    }
    addError(
      errors,
      SEED_PATH,
      `${collectionKey}:${item.id ?? "(no-id)"}`,
      "urn",
      `duplicate urn (also in ${seen.get(item.urn)})`,
    );
  };

  for (const [collectionKey, value] of Object.entries(seed)) {
    if (!Array.isArray(value)) continue;
    for (const item of value) visit(collectionKey, item);
  }
};

const validateCombinedSegments = (errors, seed) => {
  for (const recipe of seed.recipes ?? []) {
    const recipeId = recipe?.id ?? "(missing-id)";
    const annotations = recipe?.annotations ?? {};
    const segments = recipe?.text?.combinedSegments ?? [];
    if (!Array.isArray(segments)) continue;
    for (let idx = 0; idx < segments.length; idx += 1) {
      const seg = segments[idx];
      if (!seg || typeof seg !== "object") continue;
      if (seg.type !== "annotation") continue;
      const annotationId = seg.annotationId ?? seg.id;
      if (typeof annotationId !== "string" || annotationId.length === 0) {
        addError(errors, SEED_PATH, `recipe:${recipeId}`, `text.combinedSegments[${idx}].id`, "missing annotation id");
        continue;
      }
      if (!annotations || typeof annotations !== "object" || !(annotationId in annotations)) {
        addError(
          errors,
          SEED_PATH,
          `recipe:${recipeId}`,
          `text.combinedSegments[${idx}].${seg.annotationId ? "annotationId" : "id"}`,
          `unresolved annotation id (${annotationId})`,
        );
      }
    }
  }
};

const validateIngredientAncientTermLinks = (errors, seed) => {
  const ancientIds = new Set((seed.ancientIngredients ?? []).map((t) => t.id).filter(Boolean));
  const pins = seed.pins?.recipeItemToAncientTermId ?? {};

  for (const recipe of seed.recipes ?? []) {
    const recipeId = recipe?.id ?? "(missing-id)";
    for (const item of recipe?.items ?? []) {
      if (!item || typeof item !== "object") continue;
      if (item.type !== "ingredient") continue;
      const entityId = `recipe:${recipeId}:item:${item.id ?? "(missing-id)"}`;
      const pinnedKey = `${recipeId}:${item.id}`;
      const pinnedTermId = pins[pinnedKey] ?? pins[item.id];
      const resolvedTermId = item.ancientTermId ?? pinnedTermId;

      if (!resolvedTermId) {
        addError(errors, SEED_PATH, entityId, "ancientTermId", "missing ancientTermId (and no pin entry)");
        continue;
      }
      if (!ancientIds.has(resolvedTermId)) {
        addError(
          errors,
          SEED_PATH,
          entityId,
          item.ancientTermId ? "ancientTermId" : `pins.recipeItemToAncientTermId[${JSON.stringify(pinnedKey)}]`,
          `unknown ancientTermId (${resolvedTermId})`,
        );
      }
    }
  }
};

const validateIdentifications = (errors, seed) => {
  const ancientIds = new Set((seed.ancientIngredients ?? []).map((t) => t.id).filter(Boolean));
  const productIds = new Set((seed.ingredientProducts ?? []).map((t) => t.id).filter(Boolean));
  const sourceIds = new Set((seed.materialSources ?? []).map((t) => t.id).filter(Boolean));

  for (const ident of seed.identifications ?? []) {
    const identId = ident?.id ?? "(missing-id)";
    if (!ident || typeof ident !== "object") continue;

    if (!ident.ancientIngredientId || !ancientIds.has(ident.ancientIngredientId)) {
      addError(errors, SEED_PATH, `identification:${identId}`, "ancientIngredientId", `unresolved (${ident.ancientIngredientId ?? "missing"})`);
    }
    if (!ident.ingredientProductId || !productIds.has(ident.ingredientProductId)) {
      addError(errors, SEED_PATH, `identification:${identId}`, "ingredientProductId", `unresolved (${ident.ingredientProductId ?? "missing"})`);
    }
    if (ident.materialSourceId && !sourceIds.has(ident.materialSourceId)) {
      addError(errors, SEED_PATH, `identification:${identId}`, "materialSourceId", `unresolved (${ident.materialSourceId})`);
    }
  }
};

const validateHomepageCuratedTargets = async (errors, seed) => {
  let sourceText = "";
  try {
    sourceText = await fs.readFile(HOMEPAGE_CONTENT_PATH, "utf8");
  } catch {
    return;
  }

  const recipesById = new Set((seed.recipes ?? []).map((r) => r.id).filter(Boolean));
  const recipesBySlug = new Set((seed.recipes ?? []).map((r) => r.slug).filter(Boolean));
  const worksById = new Set((seed.masterWorks ?? []).map((w) => w.id).filter(Boolean));
  const peopleById = new Set((seed.masterPeople ?? []).map((p) => p.id).filter(Boolean));
  const termsById = new Set((seed.ancientIngredients ?? []).map((t) => t.id).filter(Boolean));
  const toolsById = new Set((seed.masterTools ?? []).map((t) => t.id).filter(Boolean));
  const processesById = new Set((seed.masterProcesses ?? []).map((p) => p.id).filter(Boolean));

  const routeRe = /\b(?:route|recipeRoute)\s*:\s*["']([^"']+)["']/g;
  for (const match of sourceText.matchAll(routeRe)) {
    const route = match[1];
    const parsed = /^([a-z-]+):(.+)$/.exec(route);
    if (!parsed) continue;
    const [, kind, id] = parsed;

    const exists =
      (kind === "recipe" && recipesById.has(id)) ||
      (kind === "work" && worksById.has(id)) ||
      (kind === "person" && peopleById.has(id)) ||
      (kind === "ancient-term" && termsById.has(id)) ||
      (kind === "workshop-tool" && toolsById.has(id)) ||
      (kind === "workshop-process" && processesById.has(id));

    if (!exists) {
      addError(errors, HOMEPAGE_CONTENT_PATH, `homepage:${route}`, "route", "unresolved route target id");
    }
  }

  const slugRe = /\brecipeSlug\s*:\s*["']([^"']+)["']/g;
  for (const match of sourceText.matchAll(slugRe)) {
    const slug = match[1];
    if (!recipesBySlug.has(slug)) {
      addError(errors, HOMEPAGE_CONTENT_PATH, `homepage:recipeSlug:${slug}`, "recipeSlug", "unresolved recipe slug");
    }
  }
};

const validateMasterPeople = (errors, seed) => {
  const allowedCategories = new Set(["historical", "team", "collaborator", "alumni"]);
  for (const person of seed.masterPeople ?? []) {
    const personId = person?.id ?? "(missing-id)";
    if (!person || typeof person !== "object") continue;
    if (!person.id) addError(errors, SEED_PATH, `masterPeople:${personId}`, "id", "missing");
    if (!person.urn) addError(errors, SEED_PATH, `masterPeople:${personId}`, "urn", "missing");
    if (!person.slug) addError(errors, SEED_PATH, `masterPeople:${personId}`, "slug", "missing");
    if (!person.displayName && !person.name) {
      addError(errors, SEED_PATH, `masterPeople:${personId}`, "displayName", "missing displayName/name");
    }
    const categories = Array.isArray(person.categories) ? person.categories : [];
    for (const category of categories) {
      if (!allowedCategories.has(category)) {
        addError(errors, SEED_PATH, `masterPeople:${personId}`, "categories", `unknown category (${category})`);
      }
    }
  }
};

const validateRecipeAnnotationLinkRoutes = (errors, seed) => {
  const recipesById = new Set((seed.recipes ?? []).map((r) => r?.id).filter(Boolean));
  const worksById = new Set((seed.masterWorks ?? []).map((w) => w?.id).filter(Boolean));
  const peopleById = new Set((seed.masterPeople ?? []).map((p) => p?.id).filter(Boolean));

  const termsById = new Set((seed.ancientIngredients ?? []).map((t) => t?.id).filter(Boolean));
  const identificationsById = new Set((seed.identifications ?? []).map((i) => i?.id).filter(Boolean));
  const productsById = new Set((seed.ingredientProducts ?? []).map((p) => p?.id).filter(Boolean));
  const sourcesById = new Set((seed.materialSources ?? []).map((s) => s?.id).filter(Boolean));

  const workshopIngredientsById = new Set((seed.masterIngredients ?? []).map((t) => t?.id).filter(Boolean));
  const workshopToolsById = new Set((seed.masterTools ?? []).map((t) => t?.id).filter(Boolean));
  const workshopProcessesById = new Set((seed.masterProcesses ?? []).map((p) => p?.id).filter(Boolean));

  const simplePages = new Set([
    "home",
    "library",
    "archive",
    "works",
    "people",
    "about",
    "project",
    "about-people",
    "news",
    "docs",
    "workshop",
    "materials",
    "processes",
    "tools",
    "experiments",
    "terms",
    "ingredients",
    "sources",
    "search",
    "studio",
  ]);

  const legacyPrefixes = [
    "recipe_",
    "work_",
    "person_",
    "ancient-term_",
    "identification_",
    "ingredient-product_",
    "material-source_",
    "workshop-entity_",
    "workshop-ingredient_",
    "workshop-tool_",
    "workshop-process_",
  ];

  const validateRouteTargetExists = (entityId, field, route, kind, id) => {
    const exists =
      (kind === "recipe" && recipesById.has(id)) ||
      (kind === "work" && worksById.has(id)) ||
      (kind === "person" && peopleById.has(id)) ||
      (kind === "ancient-term" && termsById.has(id)) ||
      (kind === "identification" && identificationsById.has(id)) ||
      (kind === "ingredient-product" && productsById.has(id)) ||
      (kind === "material-source" && sourcesById.has(id)) ||
      (kind === "workshop-ingredient" && workshopIngredientsById.has(id)) ||
      (kind === "workshop-tool" && workshopToolsById.has(id)) ||
      (kind === "workshop-process" && workshopProcessesById.has(id));

    if (!exists) {
      addError(errors, SEED_PATH, entityId, field, `unresolved route target (${route})`);
    }
  };

  for (const recipe of seed.recipes ?? []) {
    const recipeId = recipe?.id ?? "(missing-id)";
    const annotations = recipe?.annotations ?? {};
    if (!annotations || typeof annotations !== "object") continue;

    for (const [annotationId, annotation] of Object.entries(annotations)) {
      if (!annotation || typeof annotation !== "object") continue;
      const links = annotation.links ?? [];
      if (!Array.isArray(links)) continue;

      for (let linkIdx = 0; linkIdx < links.length; linkIdx += 1) {
        const link = links[linkIdx];
        if (!link || typeof link !== "object") continue;

        const route = link.route;
        const entityId = `recipe:${recipeId}:annotation:${annotationId}`;
        const field = `annotations.${annotationId}.links[${linkIdx}].route`;

        if (typeof route !== "string" || route.trim().length === 0) {
          addError(errors, SEED_PATH, entityId, field, "missing/invalid route string");
          continue;
        }

        if (legacyPrefixes.some((p) => route.startsWith(p))) {
          addError(errors, SEED_PATH, entityId, field, `legacy route string (${route})`);
          continue;
        }

        if (simplePages.has(route)) continue;

        let match;

        match = /^recipe:([^:]+)$/.exec(route);
        if (match) {
          validateRouteTargetExists(entityId, field, route, "recipe", match[1]);
          continue;
        }
        match = /^work:([^:]+)$/.exec(route);
        if (match) {
          validateRouteTargetExists(entityId, field, route, "work", match[1]);
          continue;
        }
        match = /^person:([^:]+)$/.exec(route);
        if (match) {
          validateRouteTargetExists(entityId, field, route, "person", match[1]);
          continue;
        }

        match = /^interpretation:(ancient-term|identification|ingredient-product|material-source):([^:]+)$/.exec(route);
        if (match) {
          validateRouteTargetExists(entityId, field, route, match[1], match[2]);
          continue;
        }
        match = /^(ancient-term|identification|ingredient-product|material-source):([^:]+)$/.exec(route);
        if (match) {
          validateRouteTargetExists(entityId, field, route, match[1], match[2]);
          continue;
        }

        match = /^workshop-entity:(ingredient|tool|process):([^:]+)$/.exec(route);
        if (match) {
          const kind = match[1] === "ingredient" ? "workshop-ingredient" : match[1] === "tool" ? "workshop-tool" : "workshop-process";
          validateRouteTargetExists(entityId, field, route, kind, match[2]);
          continue;
        }

        match = /^workshop-(ingredient|tool|process):([^:]+)$/.exec(route);
        if (match) {
          const kind = match[1] === "ingredient" ? "workshop-ingredient" : match[1] === "tool" ? "workshop-tool" : "workshop-process";
          validateRouteTargetExists(entityId, field, route, kind, match[2]);
          continue;
        }

        addError(errors, SEED_PATH, entityId, field, `invalid route (${route})`);
      }
    }
  }
};

const main = async () => {
  const errors = [];

  let seed;
  let version;
  try {
    seed = await readJson(SEED_PATH);
  } catch (e) {
    addError(errors, SEED_PATH, "(file)", "(parse)", `failed to read/parse: ${e.message}`);
    seed = {};
  }

  try {
    version = await readJson(VERSION_PATH);
  } catch (e) {
    addError(errors, VERSION_PATH, "(file)", "(parse)", `failed to read/parse: ${e.message}`);
    version = null;
  }

  if (version) {
    if (!version.datasetVersion) addError(errors, VERSION_PATH, "(file)", "datasetVersion", "missing");
    if (!version.releasedAt) addError(errors, VERSION_PATH, "(file)", "releasedAt", "missing");
    if (!version.schemaVersion) addError(errors, VERSION_PATH, "(file)", "schemaVersion", "missing");
  }

  ensureUniqueIdsPerCollection(errors, seed);
  ensureUniqueUrnsGlobal(errors, seed);
  validateMasterPeople(errors, seed);
  validateCombinedSegments(errors, seed);
  validateIngredientAncientTermLinks(errors, seed);
  validateIdentifications(errors, seed);
  validateRecipeAnnotationLinkRoutes(errors, seed);
  await validateHomepageCuratedTargets(errors, seed);

  if (errors.length > 0) {
    for (const err of errors) {
      // eslint-disable-next-line no-console
      console.error(`${err.path}\t${err.entityId}\t${err.field}\t${err.reason}`);
    }
    process.exitCode = 1;
  }
};

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(`validate-seed.mjs\t(file)\t(runtime)\t${e.message}`);
  process.exit(1);
});
