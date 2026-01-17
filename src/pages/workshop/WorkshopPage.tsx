import React, { useMemo } from "react";
import type { DatabaseState } from "../../types";
import { DemoBadge } from "../../components/DemoBadge";
import { Icons } from "../../components/Icons";
import { buildWorkshopCardsFromRecipes, type WorkshopCardModel } from "../../lib/workshopCards";

export const WorkshopPage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const { ingredients, tools, processes } = useMemo(() => buildWorkshopCardsFromRecipes(db), [db]);

  const featuredTerm = useMemo(() => {
    return (db.ancientIngredients ?? []).find((t) => t.id === "ai-smyrna") ?? (db.ancientIngredients ?? [])[0] ?? null;
  }, [db.ancientIngredients]);

  const featuredIdentification = useMemo(() => {
    if (!featuredTerm) return null;
    return (db.identifications ?? []).find((i) => i.ancientIngredientId === featuredTerm.id) ?? null;
  }, [db.identifications, featuredTerm]);

  const featuredProduct = useMemo(() => {
    if (!featuredIdentification) return null;
    return (db.ingredientProducts ?? []).find((p) => p.id === featuredIdentification.ingredientProductId) ?? null;
  }, [db.ingredientProducts, featuredIdentification]);

  const featuredSource = useMemo(() => {
    if (!featuredIdentification?.materialSourceId) return null;
    return (db.materialSources ?? []).find((s) => s.id === featuredIdentification.materialSourceId) ?? null;
  }, [db.materialSources, featuredIdentification]);

  const renderWorkshopCard = (card: WorkshopCardModel) => (
    <div className="workshop-card" key={card.key} onClick={() => navigate(card.route)}>
      <div className="card-top">
        <h3>{card.title}</h3>
        <span className="type-tag">{card.tag}</span>
      </div>
      {card.ancientLabel && <div className="def">{card.ancientLabel}</div>}
      {card.description && (
        <div className="def" style={{ fontStyle: "italic", color: "var(--color-stone)" }}>
          {card.description}
        </div>
      )}
      <div className="def" style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--color-stone)" }}>
        {card.usageLabel}
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate('library')}>
        <Icons.ArrowLeft /> Back to Library
      </div>
      
      <div className="workshop-header">
        <h1>The Workshop</h1>
        <p className="intro-text">
          A compendium of the materials used in ancient perfumery, organized by their ancient terminology, the specific ingredients used in recipes, and their biological sources.
        </p>
      </div>

      <div className="workshop-section">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '1.5rem'}}>
            <h2 style={{margin:0, border: 'none'}}>MATERIALS</h2>
            <button className="text-btn" onClick={() => navigate('materials')}>See overview &rarr;</button>
        </div>
        <div className="workshop-grid">
          <div className="workshop-card" onClick={() => featuredTerm && navigate(`ancient-term:${featuredTerm.id}`)}>
            <div className="card-top">
              <h3>{featuredTerm?.term ?? "Ancient term"}</h3>
              <DemoBadge placeholder={featuredTerm?.placeholder} />
            </div>
            {featuredTerm?.transliteration && <div className="translit">{featuredTerm.transliteration}</div>}
            <div className="def">{featuredTerm?.description ?? "Demo term preview card."}</div>
          </div>

          <div className="workshop-card" onClick={() => featuredProduct && navigate(`ingredient-product:${featuredProduct.id}`)}>
            <div className="card-top">
              <h3>{featuredProduct?.label ?? "Ingredient product"}</h3>
              <DemoBadge placeholder={featuredProduct?.placeholder} />
            </div>
            <div className="def">{featuredProduct?.description ?? "Demo product preview card."}</div>
          </div>

          <div className="workshop-card" onClick={() => featuredSource && navigate(`material-source:${featuredSource.id}`)}>
            <div className="card-top">
              <h3>{featuredSource?.label ?? "Material source"}</h3>
              <DemoBadge placeholder={featuredSource?.placeholder} />
            </div>
            <div className="def">{featuredSource?.description ?? "Demo source preview card."}</div>
          </div>
        </div>
      </div>

      <div className="workshop-section">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '1.5rem'}}>
            <h2 style={{margin:0, border: 'none'}}>METHODS</h2>
            <button className="text-btn" onClick={() => navigate('processes')}>See all processes &rarr;</button>
        </div>
        <div className="workshop-grid">
          {db.masterProcesses[0] ? (
            <div className="workshop-card" onClick={() => navigate(`workshop-process:${db.masterProcesses[0].id}`)}>
              <div className="card-top">
                <h3>{db.masterProcesses[0].name}</h3>
                <span className="type-tag">Process</span>
              </div>
              <div className="def">{db.masterProcesses[0].description || "No description yet."}</div>
            </div>
          ) : null}
          {db.masterTools[0] ? (
            <div className="workshop-card" onClick={() => navigate(`workshop-tool:${db.masterTools[0].id}`)}>
              <div className="card-top">
                <h3>{db.masterTools[0].name}</h3>
                <span className="type-tag">Tool</span>
              </div>
              <div className="def">{db.masterTools[0].description || "No description yet."}</div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="workshop-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, border: "none" }}>INGREDIENTS IN RECIPES</h2>
          <button className="text-btn" onClick={() => navigate("ingredients")}>
            See ingredient profiles &rarr;
          </button>
        </div>
        <div className="workshop-grid">{ingredients.map(renderWorkshopCard)}</div>
      </div>

      <div className="workshop-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, border: "none" }}>TOOLS IN RECIPES</h2>
          <button className="text-btn" onClick={() => navigate("tools")}>
            See all tools &rarr;
          </button>
        </div>
        <div className="workshop-grid">{tools.map(renderWorkshopCard)}</div>
      </div>

      <div className="workshop-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, border: "none" }}>PROCESSES IN RECIPES</h2>
          <button className="text-btn" onClick={() => navigate("processes")}>
            See all processes &rarr;
          </button>
        </div>
        <div className="workshop-grid">{processes.map(renderWorkshopCard)}</div>
      </div>
    </div>
  );
};

