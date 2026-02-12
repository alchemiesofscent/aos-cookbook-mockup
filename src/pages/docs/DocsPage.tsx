import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { docsBySlug, docsList } from "../../content/markdown";

export const DocsPage = ({ navigate, slug }: { navigate: (route: string) => void; slug?: string }) => {
  if (!slug) {
    return (
      <div className="page-container">
        <div className="archive-intro">
          <h1 className="hero-title">Docs</h1>
          <p className="reading">Scholar-facing documentation for the Cookbook project.</p>
        </div>
        <div className="section-block">
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {docsList.map((doc) => (
              <li key={doc.slug} style={{ marginBottom: "1rem" }}>
                <button type="button" className="text-btn" onClick={() => navigate(`docs:${doc.slug}`)}>
                  {doc.title} →
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  const doc = docsBySlug.get(slug);
  if (!doc) {
    return (
      <div className="page-container">
        <h1 className="hero-title">Docs</h1>
        <div className="section-block">
          <p className="reading">Document not found.</p>
          <button type="button" className="text-btn" onClick={() => navigate("docs")}>
            Back to docs →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="hero-title">{doc.title}</h1>
      <div className="section-block reading">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
          {doc.body}
        </ReactMarkdown>
      </div>
    </div>
  );
};
