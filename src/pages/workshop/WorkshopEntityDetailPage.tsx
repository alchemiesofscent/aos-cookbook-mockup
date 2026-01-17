import React from "react";
import type { DatabaseState } from "../../types";
import type { WorkshopEntityRoute } from "../../app/router";
import { Icons } from "../../components/Icons";
import { RecipeLinkCards } from "../../components/RecipeLinkCards";
import { formatRecipeLabel } from "../../lib/formatRecipeLabel";
import { formatAncientName } from "../../lib/workshopCards";

export const WorkshopEntityDetailPage = ({
  navigate,
  db,
  routeInfo,
}: {
  navigate: (route: string) => void;
  db: DatabaseState;
  routeInfo: WorkshopEntityRoute;
}) => {
  const entity =
    routeInfo.mode === "master"
      ? routeInfo.kind === "ingredient"
        ? db.masterIngredients.find((m) => m.id === routeInfo.id)
        : routeInfo.kind === "tool"
          ? db.masterTools.find((m) => m.id === routeInfo.id)
          : db.masterProcesses.find((m) => m.id === routeInfo.id)
      : null;

  const recipesUsingEntity =
    routeInfo.mode === "master"
      ? db.recipes.filter((r) => (r.items ?? []).some((i) => i.type === routeInfo.kind && i.masterId === routeInfo.id))
      : [];

  const unlinkedRecipe = routeInfo.mode === "unlinked" ? db.recipes.find((r) => r.id === routeInfo.recipeId) : null;
  const unlinkedItem =
    routeInfo.mode === "unlinked"
      ? (unlinkedRecipe?.items ?? []).find((i) => i.id === routeInfo.itemId && i.type === routeInfo.kind)
      : null;

  const backTarget = "workshop";
  const title =
    routeInfo.mode === "master"
      ? entity?.name ?? "Workshop card"
      : (unlinkedItem?.displayTerm || "").trim() || unlinkedItem?.originalTerm || "Workshop card";

  const ancientLabel =
    routeInfo.mode === "master" && entity
      ? formatAncientName(entity) || null
      : unlinkedItem?.originalTerm && unlinkedItem?.transliteration
        ? `${unlinkedItem.originalTerm} (${unlinkedItem.transliteration})`
        : unlinkedItem?.originalTerm ?? null;

  const urn =
    routeInfo.mode === "master"
      ? entity?.urn ?? null
      : unlinkedRecipe
        ? `urn:aos:unlinked:${routeInfo.kind}:${unlinkedRecipe.id}:${routeInfo.itemId}`
        : null;

  const description =
    routeInfo.mode === "master"
      ? entity?.description ?? null
      : "Auto-generated placeholder card for an unlinked term referenced in a recipe item.";

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate(backTarget)}>
        <Icons.ArrowLeft /> Back to Workshop
      </div>

      <div className="product-section" style={{ paddingBottom: "2rem", borderBottom: "1px solid var(--color-border-strong)" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.25rem", marginTop: 0 }}>{title}</h1>
        {ancientLabel && (
          <div
            style={{
              fontSize: "1.5rem",
              color: "var(--color-stone)",
              fontStyle: "italic",
              marginBottom: "1.25rem",
              fontFamily: "var(--font-serif)",
            }}
          >
            {ancientLabel}
          </div>
        )}
        {urn && <div className="urn" style={{ display: "inline-block" }}>URN: {urn}</div>}
      </div>

      <div className="product-section">
        <h2>DESCRIPTION</h2>
        <p style={{ fontSize: "1.1rem", lineHeight: "1.7", maxWidth: "900px" }}>
          {description ?? "Auto-generated placeholder description."}
        </p>
      </div>

      {routeInfo.mode === "unlinked" && unlinkedRecipe && unlinkedItem && (
        <div className="product-section">
          <h2>RECIPE ITEM</h2>
          <div className="term-row" style={{ gridTemplateColumns: "1fr 2fr", borderBottom: "none" }}>
            <div style={{ fontWeight: 600 }}>Recipe</div>
            <div>
              <span
                className="text-btn"
                style={{ fontSize: "0.95rem" }}
                onClick={() => navigate(`recipe:${unlinkedRecipe.id}`)}
              >
                {formatRecipeLabel(unlinkedRecipe)} →
              </span>
            </div>
          </div>
          <div className="term-row" style={{ gridTemplateColumns: "1fr 2fr", borderBottom: "none" }}>
            <div style={{ fontWeight: 600 }}>Original term</div>
            <div>{unlinkedItem.originalTerm}</div>
          </div>
          <div className="term-row" style={{ gridTemplateColumns: "1fr 2fr", borderBottom: "none" }}>
            <div style={{ fontWeight: 600 }}>Transliteration</div>
            <div>{unlinkedItem.transliteration ?? "—"}</div>
          </div>
          <div className="term-row" style={{ gridTemplateColumns: "1fr 2fr", borderBottom: "none" }}>
            <div style={{ fontWeight: 600 }}>Amount</div>
            <div>{unlinkedItem.amount || "—"}</div>
          </div>
          <div className="term-row" style={{ gridTemplateColumns: "1fr 2fr", borderBottom: "none" }}>
            <div style={{ fontWeight: 600 }}>Role</div>
            <div>{unlinkedItem.role || "—"}</div>
          </div>
        </div>
      )}

      <div className="product-section" style={{ borderBottom: "none" }}>
        <h2>RECIPES</h2>
        {routeInfo.mode === "master" ? (
          recipesUsingEntity.length === 0 ? (
            <p style={{ color: "var(--color-stone)" }}>No recipes found.</p>
          ) : (
            <RecipeLinkCards recipes={recipesUsingEntity} db={db} navigate={navigate} />
          )
        ) : (
          <>
            {unlinkedRecipe ? (
              <RecipeLinkCards recipes={[unlinkedRecipe]} db={db} navigate={navigate} />
            ) : (
              <p style={{ color: "var(--color-stone)" }}>No recipe found.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

