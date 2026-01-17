import React from "react";
import type { DatabaseState, IngredientProduct, MaterialSource } from "../../types";
import { DemoBadge } from "../../components/DemoBadge";
import { Icons } from "../../components/Icons";
import { RecipeLinkCards } from "../../components/RecipeLinkCards";

export const AncientTermDetailPage = ({
  navigate,
  db,
  termId,
}: {
  navigate: (route: string) => void;
  db: DatabaseState;
  termId: string;
}) => {
  const term = (db.ancientIngredients ?? []).find((t) => t.id === termId) ?? null;
  const identifications = (db.identifications ?? []).filter((i) => i.ancientIngredientId === termId);

  const productsById = new Map<string, IngredientProduct>((db.ingredientProducts ?? []).map((p) => [p.id, p]));
  const sourcesById = new Map<string, MaterialSource>((db.materialSources ?? []).map((s) => [s.id, s]));

  const recipesUsing = (db.recipes ?? []).filter((r) =>
    (r.items ?? []).some((item) => item.type === "ingredient" && item.ancientTermId === termId),
  );

  const displayTerm = term?.term ?? termId;
  const displayTranslit = term?.transliteration ?? "";
  const urn = `urn:aos:ancient-ingredient:${termId}`;

  const demoQuotes = [
    {
      author: "Dioscorides",
      work: "De materia medica",
      locator: "Demo citation",
      text: `In this wireframe, ${displayTerm} is presented as an ancient ingredient term that may admit multiple modern identifications.`,
    },
    {
      author: "Project demo",
      work: "Demo Workshop Notes",
      locator: "Demo §0",
      text: `The quotation panel is placeholder content designed to preview layout and navigation, not scholarship.`,
    },
  ];

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate("terms")}>
        <Icons.ArrowLeft /> Back to Ancient Terms
      </div>

      <div
        className="product-section"
        style={{ paddingBottom: "2rem", borderBottom: "1px solid var(--color-border-strong)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <h1 style={{ marginTop: 0, marginBottom: "0.25rem" }}>{displayTerm}</h1>
            {displayTranslit && (
              <div
                style={{
                  fontSize: "1.25rem",
                  color: "var(--color-stone)",
                  fontStyle: "italic",
                  fontFamily: "var(--font-serif)",
                }}
              >
                {displayTranslit}
              </div>
            )}
          </div>
          <DemoBadge placeholder={term?.placeholder ?? true} />
        </div>
        <div className="urn" style={{ display: "inline-block", marginTop: "1rem" }}>
          URN: {urn}
        </div>
      </div>

      <div className="product-section">
        <h2>DESCRIPTION</h2>
        <p style={{ maxWidth: "900px" }}>{term?.description ?? "Demo term record."}</p>
      </div>

      <div className="product-section">
        <h2>WHAT THE ANCIENTS SAID</h2>
        {demoQuotes.map((q, idx) => (
          <div className="quote-block" key={idx}>
            <strong>
              {q.author} — {q.work} ({q.locator})
            </strong>
            <p>"{q.text}"</p>
          </div>
        ))}
      </div>

      <div className="product-section">
        <h2>IDENTIFICATIONS</h2>
        {identifications.length === 0 ? (
          <p style={{ color: "var(--color-stone)" }}>No identifications found.</p>
        ) : (
          <div className="workshop-grid">
            {identifications.map((ident) => {
              const product = productsById.get(ident.ingredientProductId) ?? null;
              const source = ident.materialSourceId ? sourcesById.get(ident.materialSourceId) ?? null : null;
              return (
                <div className="workshop-card" key={ident.id} onClick={() => navigate(`identification:${ident.id}`)}>
                  <div className="card-top">
                    <h3>{product?.label ?? ident.ingredientProductId}</h3>
                    <DemoBadge placeholder={ident.placeholder} />
                  </div>
                  <div className="def" style={{ marginBottom: "0.5rem" }}>
                    Confidence: <span className="type-tag">{ident.confidence ?? "—"}</span>
                  </div>
                  {source && <div className="def">Source: {source.label}</div>}
                  {!source && <div className="def" style={{ color: "var(--color-stone)" }}>Source: —</div>}
                  <div className="def" style={{ marginTop: "0.75rem" }}>
                    <span
                      className="text-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`ingredient-product:${ident.ingredientProductId}`);
                      }}
                    >
                      → View product
                    </span>
                    {ident.materialSourceId && (
                      <span style={{ marginLeft: "1rem" }}>
                        <span
                          className="text-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`material-source:${ident.materialSourceId}`);
                          }}
                        >
                          → View source
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="product-section" style={{ borderBottom: "none" }}>
        <h2>RECIPES USING THIS TERM</h2>
        {recipesUsing.length === 0 ? (
          <p style={{ color: "var(--color-stone)" }}>No recipes found.</p>
        ) : (
          <RecipeLinkCards recipes={recipesUsing} db={db} navigate={navigate} />
        )}
      </div>
    </div>
  );
};

