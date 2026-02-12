import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { newsList } from "../../content/markdown";

const formatDate = (value?: string) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

export const NewsPage = () => {
  const news = newsList;
  return (
    <div className="page-container">
      <h1 className="hero-title">News & Updates</h1>
      <div className="section-block">
        {news.length ? (
          news.map((item) => (
            <div key={item.slug} className="metadata-box" style={{ width: "100%", marginBottom: "1.5rem" }}>
              <div className="meta-row">
                <span style={{ fontWeight: 600 }}>{item.title}</span>
                {item.date ? <span style={{ color: "var(--color-stone)" }}>{formatDate(item.date)}</span> : null}
              </div>
              {item.summary ? <p className="reading" style={{ marginBottom: "0.75rem" }}>{item.summary}</p> : null}
              {item.body ? (
                <div className="reading">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                    {item.body}
                  </ReactMarkdown>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <>
            <div className="metadata-box" style={{ width: "100%", marginBottom: "1.5rem" }}>
              <div className="meta-row">
                <span style={{ fontWeight: 600 }}>Publication Release</span>
                <span style={{ color: "var(--color-stone)" }}>October 2023</span>
              </div>
              <p className="reading">
                Our latest paper on the reconstruction of the Mendesian perfume has been published in the American Journal of
                Archaeology.
              </p>
            </div>
            <div className="metadata-box" style={{ width: "100%", marginBottom: "1.5rem" }}>
              <div className="meta-row">
                <span style={{ fontWeight: 600 }}>Conference Presentation</span>
                <span style={{ color: "var(--color-stone)" }}>September 2023</span>
              </div>
              <p className="reading">
                The team presented findings on resin distillation at the International Conference on History of Chemistry.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
