import React, { useState } from "react";
import type { DatabaseState, Recipe, RecipeItem } from "../../types";
import { createOrResumeStudioSession, setActiveStudioSessionId } from "../../studio/storage";
import { resolveAncientTermIdForRecipeAnnotation, resolveAncientTermIdForRecipeItem } from "../../workshop/resolveAncientTermId";

type RecipeTextViewMode = "annotated" | "translation" | "greek";

export const RecipePage = ({
  navigate,
  db,
  recipeId,
}: {
  navigate: (route: string) => void;
  db: DatabaseState;
  recipeId: string;
}) => {
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [textMode, setTextMode] = useState<RecipeTextViewMode>("annotated");

  const recipe = (db.recipes.find((r) => r.id === recipeId) ?? db.recipes[0]) as Recipe | undefined;
  const sourceWork = recipe?.metadata?.sourceWorkId
    ? db.masterWorks.find((w) => w.id === recipe.metadata.sourceWorkId)
    : undefined;

  const segments = recipe?.text?.combinedSegments ?? [];
  const annotations = recipe?.annotations ?? {};
  const activeAnnotation = activeAnnotationId ? (annotations as any)[activeAnnotationId] : null;
  const activeAnnotationAncientTermId =
    recipe && activeAnnotationId ? resolveAncientTermIdForRecipeAnnotation(db, recipe.id, activeAnnotationId) : null;
  const processItems = (recipe?.items ?? []).filter((item) => item.type === "process") as RecipeItem[];
  
  const openInStudio = () => {
    if (!recipe) return;
    const saved = createOrResumeStudioSession(recipe.id);
    setActiveStudioSessionId(saved.id);
    navigate("studio");
  };

  const renderPlainText = (text: string) => {
    const trimmed = (text || "").trim();
    if (!trimmed) return <div className="empty-state">No text available.</div>;
    const paragraphs = trimmed.split(/\n{2,}/g);
    return (
      <div className="recipe-text reading">
        {paragraphs.map((p, idx) => (
          <p key={idx} style={{ marginTop: idx === 0 ? 0 : "1rem" }}>
            {p}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="page-container recipe-page">
      <div className="recipe-header">
        <h1 className="hero-title">{recipe?.metadata?.title ?? "Recipe"}</h1>
        <div className="subtitle">
          {[recipe?.metadata?.author, sourceWork?.name].filter(Boolean).join(", ")}
        </div>
        
        <div className="metadata-box source-box">
          <div className="meta-row">
            <span>{sourceWork?.description ?? ""}</span>
          </div>
          <div className="meta-row">
            <span className="urn">{recipe?.urn ?? ""}</span>
            <div className="actions">
              <button className="text-btn">[Copy]</button>
              <button className="text-btn">[JSON-LD]</button>
              <button type="button" className="text-btn" onClick={openInStudio}>[Open in Studio]</button>
            </div>
          </div>
        </div>

        <div className="view-toggles">
          <label>
            <input
              type="radio"
              name="view"
              checked={textMode === "annotated"}
              onChange={() => {
                setActiveAnnotationId(null);
                setTextMode("annotated");
              }}
            />{" "}
            Annotated
          </label>
          <label>
            <input
              type="radio"
              name="view"
              checked={textMode === "translation"}
              onChange={() => {
                setActiveAnnotationId(null);
                setTextMode("translation");
              }}
            />{" "}
            Translation
          </label>
          <label>
            <input
              type="radio"
              name="view"
              checked={textMode === "greek"}
              onChange={() => {
                setActiveAnnotationId(null);
                setTextMode("greek");
              }}
            />{" "}
            Greek
          </label>
        </div>
      </div>

      <div className={`recipe-split-view ${activeAnnotation ? 'has-annotation' : ''}`}>
        <div className="text-column">
          <h2>THE TEXT</h2>
          {textMode === "greek" && renderPlainText(recipe?.text?.original ?? "")}
          {textMode === "translation" && renderPlainText(recipe?.text?.translation ?? "")}
          {textMode === "annotated" && (
            <>
              {segments.length === 0 ? (
                <>
                  <div className="metadata-box" style={{ marginBottom: "1rem" }}>
                    Annotated view not available for this recipe yet (demo fallback).
                  </div>
                  {renderPlainText(recipe?.text?.translation ?? "")}
                </>
              ) : (
                <div className="recipe-text reading">
                  {segments.map((seg, i) => {
                    if (seg.type === "annotation") {
                      return (
                        <span
                          key={i}
                          className={`annotated-term ${activeAnnotationId === seg.id ? "active" : ""}`}
                          onClick={() => setActiveAnnotationId((prev) => (prev === seg.id ? null : seg.id))}
                        >
                          {seg.text}
                        </span>
                      );
                    }
                    return <span key={i}>{seg.text}</span>;
                  })}
                </div>
              )}
            </>
          )}

          <div className="ingredients-section">
            <h2>INGREDIENTS</h2>
            <div className="ingredients-table">
              {(recipe?.items ?? [])
                .filter((item) => item.type === "ingredient")
                .map((ing, i) => (
                <div className="ing-row" key={i}>
                  <span className="ing-name">
                    {ing.originalTerm}
                    {ing.transliteration ? ` (${ing.transliteration})` : ""}
                  </span>
                  <span className="ing-amt">{ing.amount}</span>
                  <span className="ing-role">{ing.role}</span>
                  <span
                    className="ing-link"
                    onClick={() => {
                      if (!recipe) return;
                      const aiId = resolveAncientTermIdForRecipeItem(db, recipe.id, ing);
                      if (aiId) {
                        navigate(`ancient-term:${aiId}`);
                        return;
                      }
                      navigate(`workshop-unlinked:ingredient:${recipe.id}:${ing.id}`);
                    }}
                  >
                    → ancient term
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="processes-section">
            <h2>PROCESSES</h2>
            {processItems.length === 0 ? (
              <p style={{ color: "var(--color-stone)" }}>No processes listed for this recipe.</p>
            ) : (
              <p>
                {processItems.map((process, idx) => {
                  const label = (process.displayTerm || "").trim() || process.originalTerm || process.id;
                  const route = process.masterId
                    ? `workshop-process:${process.masterId}`
                    : recipe
                      ? `workshop-unlinked:process:${recipe.id}:${process.id}`
                      : null;
                  return (
                    <React.Fragment key={process.id}>
                      {idx > 0 ? " → " : null}
                      {route ? (
                        <span className="text-btn" style={{ cursor: "pointer" }} onClick={() => navigate(route)}>
                          {label}
                        </span>
                      ) : (
                        <span>{label}</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </p>
            )}
          </div>
        </div>

        <div className={`notes-column ${textMode === "annotated" && activeAnnotation ? "has-content" : ""}`}>
          <h2>NOTES</h2>
          {textMode === "annotated" && activeAnnotation ? (
            <div className="annotation-card fade-in">
              <div className="anno-header">
                <div className="anno-title">
                  <h3>{activeAnnotation.term}</h3>
                  <span className="transliteration">{activeAnnotation.transliteration}</span>
                </div>
                <button
                  type="button"
                  className="anno-close"
                  onClick={() => setActiveAnnotationId(null)}
                  aria-label="Close annotation"
                  title="Close"
                >
                  ×
                </button>
              </div>
              {activeAnnotation.definition && <p className="reading">{activeAnnotation.definition}</p>}
              <div className="anno-links">
                {(activeAnnotation.links ?? []).map((link, i) => (
                  <button key={i} className="text-btn" onClick={() => navigate(link.route)}>
                    → {link.label}
                  </button>
                ))}
                {activeAnnotationAncientTermId ? (
                  <button className="text-btn" onClick={() => navigate(`ancient-term:${activeAnnotationAncientTermId}`)}>
                    → View ancient term
                  </button>
                ) : (activeAnnotation.links ?? []).length === 0 ? (
                  <div style={{ color: "var(--color-stone)", fontFamily: "var(--font-sans)", fontSize: "0.875rem" }}>
                    No linked material for this note yet.
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              {textMode === "annotated"
                ? "Click any highlighted term to see commentary."
                : "Switch to Annotated view to see commentary."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
