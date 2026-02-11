import React from "react";
import type { DatabaseState } from "../../types";
import { RecipeLinkCards } from "../../components/RecipeLinkCards";

export const WorkDetailPageDb = ({
  navigate,
  db,
  workId,
}: {
  navigate: (route: string) => void;
  db: DatabaseState;
  workId: string;
}) => {
  const work = (db.masterWorks ?? []).find((w) => w.id === workId) ?? null;
  const author = work?.authorId ? (db.masterPeople ?? []).find((p) => p.id === work.authorId) : null;
  const recipesInWork = (db.recipes ?? []).filter((r) => r.metadata?.sourceWorkId === workId);

  return (
    <div className="page-container">
      <div className="product-section" style={{ paddingBottom: "2rem", borderBottom: "1px solid var(--color-border-strong)" }}>
        <h1 className="hero-title" style={{ fontSize: "2.5rem", marginBottom: "0.25rem", marginTop: 0 }}>
          {work?.name ?? "Work"}
        </h1>
        <div style={{ fontSize: "1.25rem", color: "var(--color-charcoal)", marginBottom: "0.5rem" }}>
          {author ? (
            <span className="text-btn" style={{ fontSize: "1.25rem", cursor: "pointer" }} onClick={() => navigate(`person:${author.id}`)}>
              {author.name} →
            </span>
          ) : (
            <span>{work?.author ?? ""}</span>
          )}
        </div>
        <div style={{ fontSize: "1rem", color: "var(--color-stone)", marginBottom: "1.25rem" }}>
          {[work?.date, work?.language, work?.place].filter(Boolean).join(" • ")}
        </div>
        {work?.urn ? <div className="urn">URN: {work.urn}</div> : null}
      </div>

      <div className="product-section">
        <h2>DESCRIPTION</h2>
        <p className="reading" style={{ fontSize: "1.1rem", lineHeight: "1.65", maxWidth: "800px" }}>
          {work?.description ?? "No description yet."}
        </p>
      </div>

      <div className="product-section" style={{ borderBottom: "none" }}>
        <h2>RECIPES IN THIS WORK</h2>
        {!recipesInWork.length ? (
          <p style={{ color: "var(--color-stone)" }}>No recipes linked yet.</p>
        ) : (
          <RecipeLinkCards recipes={recipesInWork} db={db} navigate={navigate} />
        )}
      </div>
    </div>
  );
};
