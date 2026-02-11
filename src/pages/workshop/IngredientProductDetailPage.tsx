import React from "react";
import type { AncientIngredient, DatabaseState, MaterialSource } from "../../types";
import { DemoBadge } from "../../components/DemoBadge";

export const IngredientProductDetailPage = ({
  navigate,
  db,
  productId,
}: {
  navigate: (route: string) => void;
  db: DatabaseState;
  productId: string;
}) => {
  const product = (db.ingredientProducts ?? []).find((p) => p.id === productId) ?? null;
  const identifications = (db.identifications ?? []).filter((i) => i.ingredientProductId === productId);
  const termsById = new Map<string, AncientIngredient>((db.ancientIngredients ?? []).map((t) => [t.id, t]));
  const sourcesById = new Map<string, MaterialSource>((db.materialSources ?? []).map((s) => [s.id, s]));

  const linkedTerms = identifications
    .map((i) => termsById.get(i.ancientIngredientId))
    .filter(Boolean) as AncientIngredient[];

  const linkedSources = identifications
    .map((i) => (i.materialSourceId ? sourcesById.get(i.materialSourceId) : undefined))
    .filter(Boolean) as MaterialSource[];

  return (
    <div className="page-container">
      <div
        className="product-section"
        style={{ paddingBottom: "2rem", borderBottom: "1px solid var(--color-border-strong)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <h1 style={{ marginTop: 0, marginBottom: "0.25rem" }}>{product?.label ?? productId}</h1>
          </div>
          <DemoBadge placeholder={product?.placeholder ?? true} />
        </div>
        <div className="urn" style={{ display: "inline-block", marginTop: "1rem" }}>
          URN: urn:aos:ingredient-product:{productId}
        </div>
      </div>

      <div className="product-section">
        <h2>DESCRIPTION</h2>
        <p style={{ maxWidth: "900px" }}>
          {product?.description ??
            "This is a demo product page used to preview how scent profiles and interpretation notes might be displayed."}
        </p>
      </div>

      <div className="product-section">
        <h2>ANCIENT TERMS (REVERSE LINK)</h2>
        {linkedTerms.length === 0 ? (
          <p style={{ color: "var(--color-stone)" }}>No linked ancient terms.</p>
        ) : (
          <div className="workshop-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
            {linkedTerms.map((t) => (
              <div className="workshop-card" key={t.id} onClick={() => navigate(`ancient-term:${t.id}`)}>
                <div className="card-top">
                  <h3>{t.term}</h3>
                  <DemoBadge placeholder={t.placeholder} />
                </div>
                {t.transliteration && <div className="translit">{t.transliteration}</div>}
                <div className="def">{t.description ?? "Demo term record."}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="product-section" style={{ borderBottom: "none" }}>
        <h2>MATERIAL SOURCES</h2>
        {linkedSources.length === 0 ? (
          <p style={{ color: "var(--color-stone)" }}>No linked material sources.</p>
        ) : (
          <div className="workshop-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))" }}>
            {linkedSources.map((s) => (
              <div className="workshop-card" key={s.id} onClick={() => navigate(`material-source:${s.id}`)}>
                <div className="card-top">
                  <h3>{s.label}</h3>
                  <DemoBadge placeholder={s.placeholder} />
                </div>
                <div className="def">{s.description ?? "Demo source record."}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
