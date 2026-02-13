import type { ExternalLink, MasterEntity } from "../types";

const emailRe = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

export const getPersonDisplayName = (person: MasterEntity | null | undefined) =>
  person?.displayName ?? person?.name ?? "Person";

export const resolvePersonImageSrc = (src: string | undefined): string => {
  if (!src) return "";
  if (/^(https?:)?\/\//i.test(src) || src.startsWith("data:")) return src;
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  if (src.startsWith("/")) return `${normalizedBase}${src.slice(1)}`;
  return `${normalizedBase}${src}`;
};

export const getPersonSortKey = (person: MasterEntity | null | undefined) => {
  const explicit = typeof person?.sortName === "string" ? person.sortName.trim() : "";
  if (explicit) return explicit.toLocaleLowerCase();

  const displayName = getPersonDisplayName(person).trim();
  if (!displayName) return "";
  const normalized = displayName.replace(/\s+/g, " ");
  const parts = normalized.split(" ");
  const last = parts[parts.length - 1] ?? "";
  const leading = parts.slice(0, -1).join(" ");
  return `${last} ${leading}`.trim().toLocaleLowerCase();
};

export const getPersonRoles = (person: MasterEntity | null | undefined) => {
  if (!person) return [] as string[];
  if (Array.isArray(person.roles) && person.roles.length) return person.roles;
  if (typeof person.role === "string" && person.role.trim()) return [person.role.trim()];
  return [] as string[];
};

export const getPersonBio = (person: MasterEntity | null | undefined) => {
  const raw = person?.bio ?? person?.description ?? "";
  return raw.replace(emailRe, "").trim();
};

export const splitBioParagraphs = (bio: string) =>
  bio
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

export const getPersonShortBlurb = (person: MasterEntity | null | undefined, maxLength = 180) => {
  const explicit = typeof person?.shortBlurb === "string" ? person.shortBlurb.replace(emailRe, "").trim() : "";
  if (explicit) return explicit;

  const bio = getPersonBio(person);
  if (!bio) return "";

  const firstParagraph = splitBioParagraphs(bio)[0] ?? bio;
  const normalized = firstParagraph.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  const clipped = normalized.slice(0, maxLength - 1).replace(/\s+\S*$/, "").trim();
  return `${clipped}…`;
};

export const isProjectPerson = (person: MasterEntity | null | undefined) => {
  const categories = person?.categories ?? [];
  return categories.includes("team") || categories.includes("collaborator");
};

export const isTeamPerson = (person: MasterEntity | null | undefined) => {
  const categories = person?.categories ?? [];
  return categories.includes("team") && !categories.includes("collaborator");
};

export const isCollaboratorPerson = (person: MasterEntity | null | undefined) => {
  const categories = person?.categories ?? [];
  return categories.includes("collaborator") && !categories.includes("team");
};

export type PersonAffiliation = {
  institution: string;
  department?: string;
  location?: string;
  url?: string;
};

const normalizeLinkList = (links: unknown): ExternalLink[] => {
  if (!Array.isArray(links)) return [];
  return links
    .map((link) => {
      if (!link || typeof link !== "object") return null;
      const label = typeof (link as { label?: unknown }).label === "string" ? (link as { label: string }).label.trim() : "";
      const url = typeof (link as { url?: unknown }).url === "string" ? (link as { url: string }).url.trim() : "";
      if (!label || !url || url.startsWith("mailto:")) return null;
      return { label, url };
    })
    .filter(Boolean) as ExternalLink[];
};

export const getPersonPublications = (person: MasterEntity | null | undefined) => {
  const curated = normalizeLinkList(person?.publications);
  if (curated.length) return curated;

  const links = normalizeLinkList(person?.links).concat(normalizeLinkList(person?.externalLinks));
  return links.filter((link) => /doi\.org/i.test(link.url));
};

export const getPersonAffiliations = (person: MasterEntity | null | undefined): PersonAffiliation[] => {
  const detailed = Array.isArray(person?.affiliationsDetailed)
    ? person.affiliationsDetailed
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const institution =
            typeof (item as { institution?: unknown }).institution === "string"
              ? (item as { institution: string }).institution.trim()
              : "";
          const department =
            typeof (item as { department?: unknown }).department === "string"
              ? (item as { department: string }).department.trim()
              : "";
          const location =
            typeof (item as { location?: unknown }).location === "string"
              ? (item as { location: string }).location.trim()
              : "";
          const url = typeof (item as { url?: unknown }).url === "string" ? (item as { url: string }).url.trim() : "";
          if (!institution) return null;
          return {
            institution,
            department: department || undefined,
            location: location || undefined,
            url: url || undefined,
          };
        })
        .filter(Boolean)
    : [];

  if (detailed.length) return detailed as PersonAffiliation[];

  const fallback = (person?.affiliations ?? []).flatMap((raw) =>
    raw
      .split(/\s*;\s*/)
      .map((value) => value.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .map((institution) => ({ institution })),
  );

  if (fallback.length) return fallback;
  if (person?.place) return [{ institution: person.place }];
  return [];
};
