export type DocsRecord = {
  slug: string;
  title: string;
  body: string;
};

export type NewsRecord = {
  slug: string;
  title: string;
  date?: string;
  summary?: string;
  body: string;
  legacyUrl?: string;
};

const parseMarkdown = (raw: string) => {
  const text = raw ?? "";
  if (!text.startsWith("---")) {
    return { data: {} as Record<string, unknown>, content: text.trim() };
  }

  const normalized = text.replace(/\r\n/g, "\n");
  const endIdx = normalized.indexOf("\n---", 3);
  if (endIdx === -1) {
    return { data: {} as Record<string, unknown>, content: normalized.trim() };
  }

  const frontmatterBlock = normalized.slice(3, endIdx).trim();
  const body = normalized.slice(endIdx + 4).trim();
  const data: Record<string, unknown> = {};

  for (const line of frontmatterBlock.split("\n")) {
    const match = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }

  return { data, content: body };
};

const docsModules = import.meta.glob("/content/docs/*.md", { as: "raw", eager: true });
const newsModules = import.meta.glob("/content/news/*.md", { as: "raw", eager: true });

const buildDocs = () => {
  return Object.entries(docsModules)
    .map(([path, raw]) => {
      const slug = path.split("/").pop()?.replace(/\.md$/, "") ?? path;
      const { data, content } = parseMarkdown(raw as string);
      const title = (data.title as string) || slug;
      return { slug, title, body: content };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
};

const buildNews = () => {
  return Object.entries(newsModules)
    .map(([path, raw]) => {
      const slug = path.split("/").pop()?.replace(/\.md$/, "") ?? path;
      const { data, content } = parseMarkdown(raw as string);
      const title = (data.title as string) || slug;
      const date = typeof data.date === "string" ? data.date : undefined;
      const summary = typeof data.summary === "string" ? data.summary : undefined;
      const legacyUrl = typeof data.legacyUrl === "string" ? data.legacyUrl : undefined;
      return { slug, title, date, summary, legacyUrl, body: content };
    })
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date < b.date ? 1 : -1;
    });
};

export const docsList = buildDocs();
export const docsBySlug = new Map(docsList.map((doc) => [doc.slug, doc]));
export const newsList = buildNews();
