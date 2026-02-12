import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { XMLParser } from "fast-xml-parser";
import { parse as parseHtml } from "node-html-parser";
import YAML from "yaml";

type WxrCategory = {
  domain?: string;
  nicename?: string;
  label: string;
};

type WxrItem = {
  title: string;
  slug: string;
  link: string;
  postType: string;
  status: string;
  pubDate?: string;
  contentHtml?: string;
  categories: WxrCategory[];
};

const WXR_PATH = process.argv[2] || "Squarespace-Wordpress-Export-02-11-2026.xml";
const PEOPLE_DRAFT_DIR = "data/import/people_draft";
const NEWS_DRAFT_DIR = "content/news/_draft";
const REDIRECTS_PATH = "public/legacy/redirects.json";

const listingConfig = {
  team: "team",
  collaborators: ["associated-faculty", "visiting-members"],
  optional: ["our-team2"],
};

const slugOverrides: Record<string, string> = {
  "dr-maarten-janssen": "maarten-janssen",
  "julie-machatova": "julie-tomsova",
  "associate-members": "associated-faculty",
  "visiting-researchers-and-artists": "visiting-members",
};

const ignoredSlugs = new Set(["previous-members"]);

const honorificRe = /^(dr\.|prof\.|mgr\.|mr\.|ms\.|mrs\.|phd)\s+/i;
const emailRe = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

const toArray = <T>(value: T | T[] | undefined): T[] => (Array.isArray(value) ? value : value ? [value] : []);

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const stripHonorifics = (value: string) => value.replace(honorificRe, "").trim();

const parseWxrXml = async (filePath: string): Promise<WxrItem[]> => {
  const xmlText = await fs.readFile(filePath, "utf8");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
  });
  const doc = parser.parse(xmlText);
  const channel = doc?.rss?.channel ?? {};
  const items = toArray(channel.item);

  return items.map((item: Record<string, unknown>) => {
    const categoryItems = toArray(item.category);
    const categories = categoryItems
      .map((cat: Record<string, unknown> | string) => {
        if (typeof cat === "string") return { label: cat };
        return {
          domain: typeof cat["@_domain"] === "string" ? cat["@_domain"] : "",
          nicename: typeof cat["@_nicename"] === "string" ? cat["@_nicename"] : "",
          label: typeof cat["#text"] === "string" ? cat["#text"] : "",
        };
      })
      .filter((cat) => cat.label);

    return {
      title: typeof item.title === "string" ? item.title : "",
      link: typeof item.link === "string" ? item.link : "",
      slug: (() => {
        const direct =
          (typeof item["wp:post_name"] === "string" && item["wp:post_name"]) ||
          (typeof item["post_name"] === "string" && item["post_name"]) ||
          "";
        if (direct) return direct;
        if (typeof item.link === "string" && item.link) {
          try {
            const pathname = new URL(item.link).pathname.replace(/\/+$/, "");
            return pathname.split("/").pop() || "";
          } catch {
            return item.link.replace(/^\/+/, "").split("/").pop() || "";
          }
        }
        return "";
      })(),
      postType:
        (typeof item["wp:post_type"] === "string" && item["wp:post_type"]) ||
        (typeof item["post_type"] === "string" && item["post_type"]) ||
        "",
      status:
        (typeof item["wp:status"] === "string" && item["wp:status"]) ||
        (typeof item["status"] === "string" && item["status"]) ||
        "",
      pubDate: typeof item.pubDate === "string" ? item.pubDate : undefined,
      contentHtml:
        (typeof item["content:encoded"] === "string" && item["content:encoded"]) ||
        (typeof item["encoded"] === "string" && item["encoded"]) ||
        "",
      categories,
    };
  });
};

const parseHtmlDocument = (html?: string) => {
  return parseHtml(html || "", { lowerCaseTagName: false });
};

const splitHeadingLines = (html: string) => {
  const normalized = html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "");
  return normalized
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
};

const extractInternalSlugs = (html?: string) => {
  if (!html) return [];
  const doc = parseHtmlDocument(html);
  const links = doc.querySelectorAll("a");
  const slugs = new Set<string>();
  for (const link of links) {
    const href = link.getAttribute("href") || "";
    if (!href || href.startsWith("mailto:")) continue;
    let pathValue = href;
    if (href.startsWith("http")) {
      try {
        pathValue = new URL(href).pathname;
      } catch {
        continue;
      }
    }
    if (!pathValue.startsWith("/")) continue;
    const trimmed = pathValue.split("?")[0].split("#")[0].replace(/^\/+/, "");
    if (!trimmed) continue;
    const slug = trimmed.split("/").pop() || "";
    if (!slug) continue;
    const normalized = slugOverrides[slug] ?? slug;
    if (ignoredSlugs.has(normalized)) continue;
    slugs.add(normalized);
  }
  return Array.from(slugs);
};

const formatDate = (value?: string) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 10);
};

const extractLinks = (doc: ReturnType<typeof parseHtmlDocument>) => {
  const links = doc.querySelectorAll("a");
  const output: { label: string; url: string }[] = [];
  for (const link of links) {
    const href = link.getAttribute("href") || "";
    if (!href || href.startsWith("mailto:")) continue;
    const label = (link.text || "").replace(/\s+/g, " ").trim();
    if (!href) continue;
    output.push({ label: label || href, url: href });
  }
  return output.length ? output : undefined;
};

const extractBio = (doc: ReturnType<typeof parseHtmlDocument>) => {
  const paragraphs = doc.querySelectorAll("p");
  const lines = paragraphs
    .map((p) => (p.text || "").replace(/\s+/g, " ").trim())
    .filter((text) => text && !emailRe.test(text));
  return lines.join("\n\n");
};

const extractImage = (doc: ReturnType<typeof parseHtmlDocument>) => {
  const img = doc.querySelector("img");
  if (!img) return undefined;
  const src = img.getAttribute("src") || "";
  if (!src) return undefined;
  const alt = img.getAttribute("alt") || undefined;
  return { src, alt };
};

const derivePeople = (items: WxrItem[]) => {
  const pages = items.filter((item) => item.postType === "page" && item.status === "publish");
  const pageBySlug = new Map(pages.map((page) => [page.slug, page]));

  const teamListing = pageBySlug.get(listingConfig.team);
  const collaboratorListings = listingConfig.collaborators.map((slug) => pageBySlug.get(slug)).filter(Boolean) as WxrItem[];
  const optionalListings = listingConfig.optional.map((slug) => pageBySlug.get(slug)).filter(Boolean) as WxrItem[];

  const teamSlugs = new Set(extractInternalSlugs(teamListing?.contentHtml));
  const collaboratorSlugs = new Set(
    collaboratorListings.flatMap((listing) => extractInternalSlugs(listing.contentHtml)),
  );
  for (const listing of optionalListings) {
    for (const slug of extractInternalSlugs(listing.contentHtml)) {
      collaboratorSlugs.add(slug);
    }
  }

  const candidates = new Set<string>([...teamSlugs, ...collaboratorSlugs]);

  const honorificCandidates = pages.filter((page) => honorificRe.test(page.title || ""));
  for (const page of honorificCandidates) candidates.add(page.slug);

  const headingCandidates = pages.filter((page) => {
    const html = page.contentHtml || "";
    return /<h2[^>]*>.*<br/i.test(html) && /<img/i.test(html);
  });
  for (const page of headingCandidates) candidates.add(page.slug);

  const people = [];
  for (const candidate of candidates) {
    const resolvedSlug = slugOverrides[candidate] ?? candidate;
    if (ignoredSlugs.has(resolvedSlug)) continue;
    const item = pageBySlug.get(resolvedSlug);
    if (!item) continue;
    const doc = parseHtmlDocument(item.contentHtml);
    const heading = doc.querySelector("h1, h2, h3, h4");
    const headingLines = heading ? splitHeadingLines(heading.innerHTML) : [];
    const rawName = headingLines[0] || item.title || resolvedSlug;
    const displayName = stripHonorifics(rawName);
    const roleLine = headingLines[1];
    const affiliationLine = headingLines[2];

    const roles = roleLine && !emailRe.test(roleLine) ? [roleLine] : [];
    const affiliations = affiliationLine && !emailRe.test(affiliationLine) ? [affiliationLine] : [];
    const bio = extractBio(doc);
    const image = extractImage(doc);
    const links = extractLinks(doc);

    const todo: string[] = [];
    if (!roles.length) todo.push("Review roles");
    if (!bio) todo.push("Add bio");
    if (!image?.src) todo.push("Add image");
    if (!displayName) todo.push("Check display name");

    const categories: string[] = [];
    if (teamSlugs.has(resolvedSlug)) categories.push("team");
    if (collaboratorSlugs.has(resolvedSlug)) categories.push("collaborator");
    if (!categories.length) todo.push("Assign category (team/collaborator)");

    const normalizedSlug = normalizeSlug(resolvedSlug || item.slug || displayName || "person");
    people.push({
      id: `p-${normalizedSlug}`,
      urn: `urn:aos:person:${normalizedSlug}`,
      slug: normalizedSlug,
      displayName,
      categories,
      roles: roles.length ? roles : undefined,
      affiliations: affiliations.length ? affiliations : undefined,
      bio: bio || undefined,
      image,
      links,
      legacy: {
        sourceUrl: item.link || undefined,
        sourcePostName: item.slug || undefined,
      },
      date: categories.length ? "Contemporary" : undefined,
      todo: todo.length ? todo : undefined,
    });
  }

  return people.sort((a, b) => a.slug.localeCompare(b.slug));
};

const deriveNews = (items: WxrItem[]) => {
  return items
    .filter((item) => item.postType === "post" && item.status === "publish")
    .map((item) => {
      const doc = parseHtmlDocument(item.contentHtml);
      const paragraphs = doc
        .querySelectorAll("p")
        .map((p) => (p.text || "").replace(/\s+/g, " ").trim())
        .filter(Boolean);
      const body = paragraphs.join("\n\n");
      const summary = paragraphs[0];
      return {
        slug: normalizeSlug(item.slug || item.title || "news-item"),
        title: item.title || "News item",
        date: formatDate(item.pubDate),
        legacyUrl: item.link || undefined,
        summary,
        body,
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
};

const ensureDir = async (dir: string) => {
  await fs.mkdir(dir, { recursive: true });
};

const writePeopleDrafts = async (people: Record<string, unknown>[]) => {
  await ensureDir(PEOPLE_DRAFT_DIR);
  for (const person of people) {
    const slug = typeof person.slug === "string" ? person.slug : "person";
    const filePath = path.join(PEOPLE_DRAFT_DIR, `${slug}.yaml`);
    const text = YAML.stringify(person, { lineWidth: 0 });
    await fs.writeFile(filePath, text, "utf8");
  }
};

const writeNewsDrafts = async (news: ReturnType<typeof deriveNews>) => {
  await ensureDir(NEWS_DRAFT_DIR);
  for (const item of news) {
    const frontmatter = {
      title: item.title,
      date: item.date || undefined,
      summary: item.summary || undefined,
      legacyUrl: item.legacyUrl || undefined,
    };
    const header = YAML.stringify(frontmatter, { lineWidth: 0 }).trim();
    const content = `---\n${header}\n---\n\n${item.body || ""}\n`;
    const filePath = path.join(NEWS_DRAFT_DIR, `${item.slug}.md`);
    await fs.writeFile(filePath, content, "utf8");
  }
};

const writeRedirects = async (people: Record<string, unknown>[], items: WxrItem[]) => {
  const itemBySlug = new Map(items.map((item) => [item.slug, item]));
  const redirects = people.map((person) => {
    const slug = typeof person.slug === "string" ? person.slug : "";
    const personId = typeof person.id === "string" ? person.id : "";
    const sourceItem = itemBySlug.get(slug);
    let fromPath = `/${slug}`;
    if (sourceItem?.link) {
      try {
        fromPath = new URL(sourceItem.link).pathname || fromPath;
      } catch {
        fromPath = sourceItem.link.startsWith("/") ? sourceItem.link : fromPath;
      }
    }
    return { fromPath, toRoute: `person:${personId}` };
  });

  await fs.mkdir(path.dirname(REDIRECTS_PATH), { recursive: true });
  await fs.writeFile(REDIRECTS_PATH, `${JSON.stringify(redirects, null, 2)}\n`, "utf8");
};

const main = async () => {
  const items = await parseWxrXml(WXR_PATH);
  const people = derivePeople(items);
  const news = deriveNews(items);

  await writePeopleDrafts(people);
  if (news.length) {
    await writeNewsDrafts(news);
  }
  await writeRedirects(people, items);

  // eslint-disable-next-line no-console
  console.log(`Imported ${people.length} people drafts and ${news.length} news drafts.`);
};

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(`import-wxr-people-news\t${(err as Error).message}`);
  process.exit(1);
});
