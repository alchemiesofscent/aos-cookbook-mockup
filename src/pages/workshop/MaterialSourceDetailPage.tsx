import React from "react";
import type { DatabaseState, IngredientProduct } from "../../types";
import { DemoBadge } from "../../components/DemoBadge";
import { Icons } from "../../components/Icons";

export const MaterialSourceDetailPage = ({
  navigate,
  db,
  sourceId,
}: {
  navigate: (route: string) => void;
  db: DatabaseState;
  sourceId: string;
}) => {
  const source = (db.materialSources ?? []).find((s) => s.id === sourceId) ?? null;
  const identifications = (db.identifications ?? []).filter((i) => i.materialSourceId === sourceId);
  const productsById = new Map<string, IngredientProduct>((db.ingredientProducts ?? []).map((p) => [p.id, p]));

  const linkedProducts = identifications
    .map((i) => productsById.get(i.ingredientProductId))
    .filter(Boolean) as IngredientProduct[];

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate("sources")}>
        <Icons.ArrowLeft /> Back to Material Sources
      </div>

      <div
        className="product-section"
        style={{ paddingBottom: "2rem", borderBottom: "1px solid var(--color-border-strong)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <h1 style={{ marginTop: 0, marginBottom: "0.25rem" }}>{source?.label ?? sourceId}</h1>
          </div>
          <DemoBadge placeholder={source?.placeholder ?? true} />
        </div>
        <div className="urn" style={{ display: "inline-block", marginTop: "1rem" }}>
          URN: urn:aos:material-source:{sourceId}
        </div>
      </div>

      <div className="product-section">
        <h2>DESCRIPTION</h2>
        <p style={{ maxWidth: "900px" }}>
          {source?.description ??
            "This is a demo source page used to preview how a biological/mineral source might be presented in the Workshop."}
        </p>
      </div>

      <div className="product-section" style={{ borderBottom: "none" }}>
        <h2>DERIVED PRODUCTS</h2>
        {linkedProducts.length === 0 ? (
          <p style={{ color: "var(--color-stone)" }}>No linked products.</p>
        ) : (
          <div className="workshop-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
            {linkedProducts.map((p) => (
              <div className="workshop-card" key={p.id} onClick={() => navigate(`ingredient-product:${p.id}`)}>
                <div className="card-top">
                  <h3>{p.label}</h3>
                  <DemoBadge placeholder={p.placeholder} />
                </div>
                <div className="def">{p.description ?? "Demo product record."}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

