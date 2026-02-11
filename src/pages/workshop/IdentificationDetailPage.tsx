import React from "react";
import type { DatabaseState } from "../../types";
import { DemoBadge } from "../../components/DemoBadge";

export const IdentificationDetailPage = ({
  navigate,
  db,
  identificationId,
}: {
  navigate: (route: string) => void;
  db: DatabaseState;
  identificationId: string;
}) => {
  const ident = (db.identifications ?? []).find((i) => i.id === identificationId) ?? null;
  const term = ident ? (db.ancientIngredients ?? []).find((t) => t.id === ident.ancientIngredientId) ?? null : null;
  const product = ident ? (db.ingredientProducts ?? []).find((p) => p.id === ident.ingredientProductId) ?? null : null;
  const source = ident?.materialSourceId
    ? (db.materialSources ?? []).find((s) => s.id === ident.materialSourceId) ?? null
    : null;
  const work = ident?.workId ? (db.masterWorks ?? []).find((w) => w.id === ident.workId) ?? null : null;

  if (!ident) {
    return (
      <div className="page-container">
        <h1>Identification not found</h1>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div
        className="product-section"
        style={{ paddingBottom: "2rem", borderBottom: "1px solid var(--color-border-strong)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <h1 style={{ marginTop: 0, marginBottom: "0.25rem" }}>IDENTIFICATION</h1>
            <div style={{ fontSize: "1.25rem" }}>
              {(term?.term ?? ident.ancientIngredientId) + " "} <span style={{ color: "var(--color-stone)" }}>→</span>{" "}
              {product?.label ?? ident.ingredientProductId}
            </div>
          </div>
          <DemoBadge placeholder={ident.placeholder} />
        </div>
        <div className="urn" style={{ display: "inline-block", marginTop: "1rem" }}>
          URN: urn:aos:identification:{identificationId}
        </div>
      </div>

      <div className="product-section">
        <h2>THE CLAIM</h2>
        <div className="term-row" style={{ gridTemplateColumns: "1fr 2fr" }}>
          <div style={{ fontWeight: 600 }}>Ancient term</div>
          <div>
            <span className="text-btn" onClick={() => navigate(`ancient-term:${ident.ancientIngredientId}`)}>
              {term?.term ?? ident.ancientIngredientId} →
            </span>
          </div>
        </div>
        <div className="term-row" style={{ gridTemplateColumns: "1fr 2fr" }}>
          <div style={{ fontWeight: 600 }}>Ingredient product</div>
          <div>
            <span className="text-btn" onClick={() => navigate(`ingredient-product:${ident.ingredientProductId}`)}>
              {product?.label ?? ident.ingredientProductId} →
            </span>
          </div>
        </div>
        <div className="term-row" style={{ gridTemplateColumns: "1fr 2fr" }}>
          <div style={{ fontWeight: 600 }}>Material source</div>
          <div>
            {ident.materialSourceId ? (
              <span className="text-btn" onClick={() => navigate(`material-source:${ident.materialSourceId}`)}>
                {source?.label ?? ident.materialSourceId} →
              </span>
            ) : (
              <span style={{ color: "var(--color-stone)" }}>—</span>
            )}
          </div>
        </div>
        <div className="term-row" style={{ gridTemplateColumns: "1fr 2fr" }}>
          <div style={{ fontWeight: 600 }}>Confidence</div>
          <div>
            <span className="type-tag">{ident.confidence ?? "—"}</span>
          </div>
        </div>
      </div>

      <div className="product-section" style={{ borderBottom: "none" }}>
        <h2>SOURCE</h2>
        <p style={{ marginBottom: "0.5rem" }}>
          <strong>{work?.name ?? "Demo source"}</strong>
        </p>
        <p style={{ marginTop: 0, color: "var(--color-stone)" }}>{ident.locator ?? "Demo locator"}</p>
        <p style={{ maxWidth: "900px" }}>{ident.notes ?? "Demo note."}</p>
      </div>
    </div>
  );
};
