import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import YAML from "yaml";

const PEOPLE_DIR = "data/people";
const SEED_PATH = "public/data/seed.json";

const allowedCategories = new Set(["historical", "team", "collaborator", "alumni"]);
const projectCategories = new Set(["team", "collaborator", "alumni"]);

type PeopleRecord = Record<string, unknown>;

const readJson = async (filePath: string) => {
  const text = await fs.readFile(filePath, "utf8");
  return JSON.parse(text);
};

const writeJson = async (filePath: string, data: unknown) => {
  const text = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, `${text}\n`, "utf8");
};

const collectYamlFiles = async () => {
  const entries = await fs.readdir(PEOPLE_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /\.(ya?ml)$/i.test(entry.name))
    .map((entry) => path.join(PEOPLE_DIR, entry.name));
};

const normalizeArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string");
  if (typeof value === "string") return [value];
  return [];
};

const normalizeExternalLinks = (value: unknown) => {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const label = typeof (item as { label?: unknown }).label === "string" ? (item as { label: string }).label : "";
      const url = typeof (item as { url?: unknown }).url === "string" ? (item as { url: string }).url : "";
      if (!label && !url) return null;
      return { label, url };
    })
    .filter(Boolean);
};

const main = async () => {
  const errors: string[] = [];
  let seed: Record<string, unknown> = {};
  try {
    seed = await readJson(SEED_PATH);
  } catch (err) {
    errors.push(`Failed to read ${SEED_PATH}: ${(err as Error).message}`);
  }

  let files: string[] = [];
  try {
    files = await collectYamlFiles();
  } catch (err) {
    errors.push(`Failed to read ${PEOPLE_DIR}: ${(err as Error).message}`);
  }

  const compiled: PeopleRecord[] = [];
  const ids = new Set<string>();
  const urns = new Set<string>();

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, "utf8");
    const data = YAML.parse(raw) as PeopleRecord;
    const label = path.basename(filePath);

    const id = typeof data.id === "string" ? data.id.trim() : "";
    const urn = typeof data.urn === "string" ? data.urn.trim() : "";
    const slug = typeof data.slug === "string" ? data.slug.trim() : "";
    const displayName =
      typeof data.displayName === "string" ? data.displayName.trim() : typeof data.name === "string" ? data.name.trim() : "";

    if (!id) errors.push(`${label}: missing id`);
    if (!urn) errors.push(`${label}: missing urn`);
    if (!slug) errors.push(`${label}: missing slug`);
    if (!displayName) errors.push(`${label}: missing displayName`);

    if (id && ids.has(id)) errors.push(`${label}: duplicate id (${id})`);
    if (urn && urns.has(urn)) errors.push(`${label}: duplicate urn (${urn})`);
    if (id) ids.add(id);
    if (urn) urns.add(urn);

    const categories = normalizeArray(data.categories);
    for (const category of categories) {
      if (!allowedCategories.has(category)) {
        errors.push(`${label}: unknown category (${category})`);
      }
    }

    const roles = normalizeArray(data.roles);
    const role = typeof data.role === "string" ? data.role : roles[0];
    const links = normalizeExternalLinks(data.links) ?? normalizeExternalLinks(data.externalLinks);

    compiled.push({
      ...data,
      id,
      urn,
      slug,
      name: displayName,
      displayName,
      description: typeof data.bio === "string" ? data.bio : typeof data.description === "string" ? data.description : "",
      bio: typeof data.bio === "string" ? data.bio : undefined,
      role: role || undefined,
      roles: roles.length ? roles : undefined,
      categories,
      links: links ?? undefined,
      externalLinks: links ?? undefined,
    });
  }

  if (errors.length) {
    for (const error of errors) {
      // eslint-disable-next-line no-console
      console.error(`compile-people-to-seed\t${error}`);
    }
    process.exit(1);
  }

  const existing = Array.isArray(seed.masterPeople) ? seed.masterPeople : [];
  const preserved = existing.filter((person) => {
    const categories = Array.isArray(person?.categories) ? person.categories : [];
    return !categories.some((category) => projectCategories.has(category));
  });

  const finalPeople = [...preserved, ...compiled];
  const finalIds = new Set<string>();
  for (const person of finalPeople) {
    const pid = typeof person?.id === "string" ? person.id : "";
    if (!pid) continue;
    if (finalIds.has(pid)) {
      // eslint-disable-next-line no-console
      console.error(`compile-people-to-seed\tduplicate id after merge (${pid})`);
      process.exit(1);
    }
    finalIds.add(pid);
  }

  seed.masterPeople = finalPeople;
  await writeJson(SEED_PATH, seed);
};

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(`compile-people-to-seed\t${(err as Error).message}`);
  process.exit(1);
});
