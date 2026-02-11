import React, { useEffect, useMemo, useState } from "react";
import type { ContentBlock, DatabaseState, MasterEntity, NewsItem, ProjectContent } from "../../types";
import { generateSlug, generateURN, saveState } from "../../storage";
import { routeToUrl } from "../../app/router";
import "./import.css";

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

type WxrDocument = {
  title?: string;
  items: WxrItem[];
};

const WP_NS = "http://wordpress.org/export/1.2/";
const CONTENT_NS = "http://purl.org/rss/1.0/modules/content/";

const cleanCaptionShortcodes = (html: string) =>
  html
    .replace(/\[caption[^\]]*\]/gi, "<figure>")
    .replace(/\[\/caption\]/gi, "</figure>")
    .replace(/\[\/?gallery[^\]]*\]/gi, "");

const parseHtmlDocument = (html: string) => {
  const parser = new DOMParser();
  const cleaned = cleanCaptionShortcodes(html);
  return parser.parseFromString(cleaned, "text/html");
};

const extractBlocks = (html?: string): ContentBlock[] => {
  if (!html) return [];
  const doc = parseHtmlDocument(html);
  const nodes = Array.from(doc.body.querySelectorAll("h1, h2, h3, h4, p, li"));
  const blocks: ContentBlock[] = [];
  for (const node of nodes) {
    const raw = node.textContent ?? "";
    const text = raw.replace(/\s+/g, " ").trim();
    if (!text) continue;
    const type = node.tagName.startsWith("H") ? "heading" : "paragraph";
    const previous = blocks[blocks.length - 1];
    if (previous && previous.text === text && previous.type === type) continue;
    blocks.push({ type, text });
  }
  return blocks;
};

const splitHeadingLines = (value: string): string[] => {
  const normalized = value.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "");
  return normalized
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
};

const extractTeamProfile = (item: WxrItem): MasterEntity => {
  const slug = item.slug || generateSlug(item.title);
  const doc = parseHtmlDocument(item.contentHtml ?? "");
  const heading = doc.querySelector("h1, h2, h3, h4");
  const headingLines = heading ? splitHeadingLines(heading.innerHTML) : [];
  const name = headingLines[0] ?? item.title ?? slug;
  const role = headingLines[1] ?? "";
  const place = headingLines[2] ?? "";

  const paragraphs = Array.from(doc.querySelectorAll("p"))
    .map((p) => (p.textContent ?? "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  let description = paragraphs.join(" ");

  if (!description) {
    const imgAlt = doc.querySelector("img")?.getAttribute("alt") ?? "";
    description = imgAlt.replace(/\s+/g, " ").trim();
  }

  return {
    id: `p-${slug}`,
    slug,
    urn: generateURN("person", slug),
    name,
    role: role || undefined,
    place: place || undefined,
    description: description || "",
    categories: ["team"],
    date: "Contemporary",
  };
};

const parseWxrXml = (xmlText: string): WxrDocument => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");
  const errorNode = doc.querySelector("parsererror");
  if (errorNode) {
    throw new Error("XML parser error. Please confirm the export file is valid.");
  }

  const channel = doc.querySelector("channel");
  const title = channel?.querySelector("title")?.textContent?.trim() ?? "";
  const items = Array.from(channel?.getElementsByTagName("item") ?? []).map((item) => {
    const getText = (selector: string) => item.querySelector(selector)?.textContent?.trim() ?? "";
    const getNsText = (ns: string, tag: string) =>
      item.getElementsByTagNameNS(ns, tag)[0]?.textContent?.trim() ?? "";

    const categories = Array.from(item.getElementsByTagName("category")).map((cat) => ({
      domain: cat.getAttribute("domain") ?? "",
      nicename: cat.getAttribute("nicename") ?? "",
      label: cat.textContent?.trim() ?? "",
    }));

    return {
      title: getText("title"),
      link: getText("link"),
      slug: getNsText(WP_NS, "post_name") || getText("link").replace(/^\//, ""),
      postType: getNsText(WP_NS, "post_type"),
      status: getNsText(WP_NS, "status"),
      pubDate: getText("pubDate"),
      contentHtml: getNsText(CONTENT_NS, "encoded"),
      categories,
    };
  });

  return { title, items };
};

const extractInternalSlugs = (html?: string): string[] => {
  if (!html) return [];
  const doc = parseHtmlDocument(html);
  const links = Array.from(doc.querySelectorAll("a[href]"));
  const slugs = new Set<string>();
  for (const link of links) {
    const href = link.getAttribute("href") ?? "";
    if (!href.startsWith("/")) continue;
    const trimmed = href.split("?")[0].split("#")[0].replace(/^\/+/, "").trim();
    if (!trimmed) continue;
    slugs.add(trimmed);
  }
  return Array.from(slugs);
};

const candidateScore = (value: string, weights: Record<string, number>) => {
  const lower = value.toLowerCase();
  return Object.entries(weights).reduce((score, [term, weight]) => (lower.includes(term) ? score + weight : score), 0);
};

const pickProjectPage = (pages: WxrItem[]) => {
  const weights = {
    project: 6,
    research: 4,
    objective: 4,
    introduction: 3,
    "aim": 3,
    method: 3,
    "greco-egyptian": 2,
  };
  return [...pages].sort((a, b) => {
    const aScore = candidateScore(`${a.title} ${a.slug}`, weights);
    const bScore = candidateScore(`${b.title} ${b.slug}`, weights);
    return bScore - aScore;
  })[0];
};

const pickTeamIndexPage = (pages: WxrItem[]) => {
  const weights = {
    team: 6,
    "who we are": 5,
    "our team": 5,
    "who-we-are": 4,
    "our-team": 4,
  };
  return [...pages].sort((a, b) => {
    const aScore = candidateScore(`${a.title} ${a.slug}`, weights);
    const bScore = candidateScore(`${b.title} ${b.slug}`, weights);
    return bScore - aScore;
  })[0];
};

const formatDate = (value?: string) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 10);
};

const buildProjectContent = (item: WxrItem): ProjectContent => {
  const blocks = extractBlocks(item.contentHtml);
  const intro = blocks.find((block) => block.type === "paragraph")?.text ?? "";
  const remaining = intro ? blocks.filter((block) => block.text !== intro) : blocks;
  return {
    title: item.title || "About the Project",
    intro: intro || undefined,
    blocks: remaining,
    source: {
      title: item.title,
      slug: item.slug,
      link: item.link,
      publishedAt: formatDate(item.pubDate),
    },
  };
};

const buildNewsItem = (item: WxrItem): NewsItem => ({
  id: `news-${item.slug || generateSlug(item.title)}`,
  title: item.title || "News item",
  date: formatDate(item.pubDate),
  blocks: extractBlocks(item.contentHtml),
  categories: item.categories?.map((c) => c.label).filter(Boolean),
  source: {
    title: item.title,
    slug: item.slug,
    link: item.link,
    publishedAt: formatDate(item.pubDate),
  },
});

const guessTeamCandidates = (pages: WxrItem[]) => {
  const honorific = /(dr\.|prof\.|mgr\.|phd|mr\.|ms\.|mrs\.)/i;
  return pages.filter((page) => honorific.test(page.title));
};

const guessNewsCandidates = (pages: WxrItem[]) => {
  const keywords = /(news|workshop|conference|position|press|media|publication|event)/i;
  return pages.filter((page) => keywords.test(page.title) || keywords.test(page.slug));
};

export const ImportPage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const [wxr, setWxr] = useState<WxrDocument | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const pages = useMemo(
    () => (wxr?.items ?? []).filter((item) => item.postType === "page" && item.status === "publish"),
    [wxr],
  );
  const posts = useMemo(
    () => (wxr?.items ?? []).filter((item) => item.postType === "post" && item.status === "publish"),
    [wxr],
  );

  const [projectSlug, setProjectSlug] = useState("");
  const [teamIndexSlug, setTeamIndexSlug] = useState("");
  const [selectedTeamSlugs, setSelectedTeamSlugs] = useState<string[]>([]);
  const [selectedNewsSlugs, setSelectedNewsSlugs] = useState<string[]>([]);
  const [showAllTeamPages, setShowAllTeamPages] = useState(false);
  const [showNewsPages, setShowNewsPages] = useState(false);
  const [replaceTeam, setReplaceTeam] = useState(true);
  const [replaceNews, setReplaceNews] = useState(true);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const teamIndex = pages.find((page) => page.slug === teamIndexSlug);
  const teamIndexSlugs = useMemo(() => extractInternalSlugs(teamIndex?.contentHtml), [teamIndex?.contentHtml]);

  useEffect(() => {
    if (!teamIndexSlug) return;
    if (!teamIndexSlugs.length) return;
    if (showAllTeamPages) return;
    setSelectedTeamSlugs(teamIndexSlugs);
  }, [teamIndexSlug, teamIndexSlugs, showAllTeamPages]);

  const teamCandidates = useMemo(() => {
    if (showAllTeamPages) return pages;
    if (teamIndexSlugs.length) {
      const slugSet = new Set(teamIndexSlugs);
      return pages.filter((page) => slugSet.has(page.slug));
    }
    return guessTeamCandidates(pages);
  }, [pages, showAllTeamPages, teamIndexSlugs]);

  const newsPageCandidates = useMemo(() => guessNewsCandidates(pages), [pages]);

  const projectPreview = useMemo(() => {
    const item = pages.find((page) => page.slug === projectSlug);
    if (!item) return "";
    const blocks = extractBlocks(item.contentHtml);
    return blocks
      .filter((block) => block.type === "paragraph")
      .slice(0, 2)
      .map((block) => block.text)
      .join(" ");
  }, [pages, projectSlug]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseWxrXml(text);
      setWxr(parsed);
      setFileName(file.name);
      setParseError(null);
      setImportStatus(null);

      const defaultProject = pickProjectPage(parsed.items.filter((i) => i.postType === "page"));
      const defaultTeamIndex = pickTeamIndexPage(parsed.items.filter((i) => i.postType === "page"));

      setProjectSlug(defaultProject?.slug ?? "");
      setTeamIndexSlug(defaultTeamIndex?.slug ?? "");
      setSelectedNewsSlugs(parsed.items.filter((i) => i.postType === "post").map((i) => i.slug));

      const defaultTeamLinks = extractInternalSlugs(defaultTeamIndex?.contentHtml ?? "");
      const defaultTeam = defaultTeamLinks.length
        ? defaultTeamLinks
        : guessTeamCandidates(parsed.items.filter((i) => i.postType === "page")).map((i) => i.slug);
      setSelectedTeamSlugs(defaultTeam);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Unable to parse XML.");
    }
  };

  const toggleSelection = (value: string, list: string[], setList: (next: string[]) => void) => {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  const handleImport = () => {
    if (!wxr) return;
    const nextDb: DatabaseState = { ...db };

    if (projectSlug) {
      const projectItem = pages.find((page) => page.slug === projectSlug);
      if (projectItem) {
        nextDb.siteContent = {
          ...(nextDb.siteContent ?? {}),
          project: buildProjectContent(projectItem),
        };
      }
    }

    if (selectedTeamSlugs.length) {
      const teamItems = pages.filter((page) => selectedTeamSlugs.includes(page.slug));
      const importedTeam = teamItems.map(extractTeamProfile);
      const existing = [...(nextDb.masterPeople ?? [])];

      let merged: MasterEntity[] = existing;
      if (replaceTeam) {
        merged = existing.filter((person) => !(person.categories ?? []).includes("team"));
      }

      const byId = new Map(merged.map((person) => [person.id, person]));
      const bySlug = new Map(merged.map((person) => [person.slug, person]));

      for (const member of importedTeam) {
        const match = byId.get(member.id) ?? bySlug.get(member.slug);
        if (match) {
          const categories = Array.from(new Set([...(match.categories ?? []), ...(member.categories ?? [])]));
          Object.assign(match, { ...member, categories });
        } else {
          merged.push(member);
        }
      }

      nextDb.masterPeople = merged;
    }

    if (selectedNewsSlugs.length) {
      const selectedItems = (wxr.items ?? []).filter((item) => selectedNewsSlugs.includes(item.slug));
      const importedNews = selectedItems.map(buildNewsItem);
      const existingNews = Array.isArray(nextDb.siteContent?.news) ? nextDb.siteContent?.news ?? [] : [];
      let nextNews = importedNews;
      if (!replaceNews) {
        const byId = new Map(existingNews.map((news) => [news.id, news]));
        for (const news of importedNews) {
          byId.set(news.id, news);
        }
        nextNews = Array.from(byId.values());
      }
      nextDb.siteContent = {
        ...(nextDb.siteContent ?? {}),
        news: nextNews,
      };
    }

    saveState(nextDb);
    setImportStatus(
      `Imported ${selectedTeamSlugs.length} team member${selectedTeamSlugs.length === 1 ? "" : "s"} and ${
        selectedNewsSlugs.length
      } news item${selectedNewsSlugs.length === 1 ? "" : "s"}.`,
    );
  };

  const openAfterReload = (route: string) => {
    window.location.href = routeToUrl(route);
  };

  return (
    <div className="page-container">
      <div className="library-hero">
        <h1 className="hero-title">Import from Squarespace XML</h1>
        <p className="intro-text reading">
          Upload a WordPress export (.xml) and map entries to Project, Team, and News content.
        </p>
      </div>

      <div className="section-block import-upload">
        <div className="import-upload-row">
          <input type="file" accept=".xml" onChange={handleFileChange} />
          {fileName ? <span className="import-tag">{fileName}</span> : null}
        </div>
        <p className="import-hint">The importer runs locally in your browser and writes to local storage.</p>
        {parseError ? <div className="import-error">{parseError}</div> : null}
      </div>

      {wxr ? (
        <>
          <div className="import-grid">
            <section className="import-panel">
              <h2>Project</h2>
              <label className="import-label">
                Source page
                <select value={projectSlug} onChange={(e) => setProjectSlug(e.target.value)}>
                  <option value="">Select a page</option>
                  {pages.map((page) => (
                    <option key={page.slug} value={page.slug}>
                      {page.title} ({page.slug})
                    </option>
                  ))}
                </select>
              </label>
              {projectPreview ? <div className="import-preview">{projectPreview}</div> : null}
            </section>

            <section className="import-panel">
              <h2>Team</h2>
              <label className="import-label">
                Team index page
                <select value={teamIndexSlug} onChange={(e) => setTeamIndexSlug(e.target.value)}>
                  <option value="">Select a page</option>
                  {pages.map((page) => (
                    <option key={page.slug} value={page.slug}>
                      {page.title} ({page.slug})
                    </option>
                  ))}
                </select>
              </label>
              <label className="import-toggle">
                <input type="checkbox" checked={showAllTeamPages} onChange={(e) => setShowAllTeamPages(e.target.checked)} />
                Show all pages as team candidates
              </label>
              <div className="import-list">
                {teamCandidates.length ? (
                  teamCandidates.map((page) => (
                    <label key={page.slug} className="import-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedTeamSlugs.includes(page.slug)}
                        onChange={() => toggleSelection(page.slug, selectedTeamSlugs, setSelectedTeamSlugs)}
                      />
                      <span>{page.title}</span>
                    </label>
                  ))
                ) : (
                  <div className="import-hint">No team candidates found.</div>
                )}
              </div>
              <label className="import-toggle">
                <input type="checkbox" checked={replaceTeam} onChange={(e) => setReplaceTeam(e.target.checked)} />
                Replace existing team members
              </label>
            </section>

            <section className="import-panel">
              <h2>News</h2>
              <div className="import-list">
                {posts.length ? (
                  posts.map((post) => (
                    <label key={post.slug} className="import-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedNewsSlugs.includes(post.slug)}
                        onChange={() => toggleSelection(post.slug, selectedNewsSlugs, setSelectedNewsSlugs)}
                      />
                      <span>{post.title}</span>
                    </label>
                  ))
                ) : (
                  <div className="import-hint">No post items found in this export.</div>
                )}
              </div>
              <label className="import-toggle">
                <input type="checkbox" checked={showNewsPages} onChange={(e) => setShowNewsPages(e.target.checked)} />
                Show page candidates
              </label>
              {showNewsPages ? (
                <div className="import-list" style={{ marginTop: "0.75rem" }}>
                  {newsPageCandidates.length ? (
                    newsPageCandidates.map((page) => (
                      <label key={page.slug} className="import-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedNewsSlugs.includes(page.slug)}
                          onChange={() => toggleSelection(page.slug, selectedNewsSlugs, setSelectedNewsSlugs)}
                        />
                        <span>{page.title}</span>
                      </label>
                    ))
                  ) : (
                    <div className="import-hint">No page candidates matched the news keywords.</div>
                  )}
                </div>
              ) : null}
              <label className="import-toggle">
                <input type="checkbox" checked={replaceNews} onChange={(e) => setReplaceNews(e.target.checked)} />
                Replace existing news
              </label>
            </section>
          </div>

          <div className="section-block import-actions">
            <button type="button" className="btn-primary" onClick={handleImport}>
              Import selected content
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate("about")}>
              Back to About
            </button>
            {importStatus ? <span className="import-status">{importStatus}</span> : null}
            {importStatus ? (
              <div className="import-actions-row">
                <button type="button" className="btn-secondary" onClick={() => openAfterReload("project")}>
                  Reload & view Project
                </button>
                <button type="button" className="btn-secondary" onClick={() => openAfterReload("team")}>
                  Reload & view Team
                </button>
                <button type="button" className="btn-secondary" onClick={() => openAfterReload("news")}>
                  Reload & view News
                </button>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
};
