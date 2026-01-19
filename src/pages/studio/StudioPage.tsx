import React, { useEffect, useMemo, useState } from "react";
import type { DatabaseState, Recipe, RecipeItem, Quantity } from "../../types";
import { studioRecipes } from "../../content/studioRecipes";
import { isCitableStudioOption } from "../../content/studioIdentifications";
import "./studio.css";
import { loadUnitEquivalents, type UnitEquivalentsLookup, type UnitTypeKey } from "../../studio/unitEquivalents";
import {
  createOrResumeStudioSession,
  getActiveStudioSessionId,
  loadStudioSessions,
  setActiveStudioSessionId,
  upsertStudioSession,
  type StudioSession,
} from "../../studio/storage";
import {
  buildExportText,
  computeConvertibleMetricTotal,
  formatMetric,
  getIngredientDisplayName,
  getIngredientOptions,
  getSelectedOption,
  numberFormat,
} from "./lib/studioHelpers";

type StudioPageProps = {
  navigate: (route: string) => void;
  db: DatabaseState;
};

const DEFAULT_RECIPE_ID = "r-rose-perfume";

export default function StudioPage({ db }: StudioPageProps) {
  const [session, setSession] = useState<StudioSession | null>(null);
  const [equivalents, setEquivalents] = useState<UnitEquivalentsLookup | null>(null);
  const [drawerIngredientId, setDrawerIngredientId] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  useEffect(() => {
    loadUnitEquivalents().then(setEquivalents);
  }, []);

  useEffect(() => {
    const sessions = loadStudioSessions();
    const active = getActiveStudioSessionId();
    const found = active ? sessions.find((s) => s.id === active) : undefined;
    if (found) {
      setSession(found);
      return;
    }
    const created = createOrResumeStudioSession(DEFAULT_RECIPE_ID);
    setSession(created);
  }, []);

  const recipe = useMemo(() => {
    if (!session) return null;
    return db.recipes.find((r) => r.id === session.recipeId) ?? null;
  }, [db.recipes, session]);

  const studio = recipe ? studioRecipes[recipe.id] : undefined;

  const yieldDisplay = useMemo(() => {
    if (!recipe || !studio || !equivalents || !session) return "yield unavailable";
    const basis = recipe.items.find((i) => i.id === studio.yieldBasisIngredientKey);
    if (!basis) return "yield unavailable";
    const metric = computeConvertibleMetricTotal({ quantities: basis.quantities ?? [], scale: session.scale, equivalents });
    return metric.ok ? formatMetric({ unitType: metric.unitType, value: metric.metricTotal, countUnitLabel: metric.countUnitLabel }) : "yield unavailable";
  }, [equivalents, recipe, session, studio]);

  const ingredientRows = useMemo(() => {
    if (!recipe || !equivalents || !session) return [];
    return recipe.items
      .filter((i) => i.type === "ingredient")
      .map((ing) => {
        const hasOptions = getIngredientOptions(recipe.id, ing.id).length > 0;
        const metric = computeConvertibleMetricTotal({ quantities: ing.quantities ?? [], scale: session.scale, equivalents });
        const amount = metric.ok
          ? formatMetric({ unitType: metric.unitType, value: metric.metricTotal, countUnitLabel: metric.countUnitLabel })
          : "amount unavailable";
        const selected = getSelectedOption({ recipeId: recipe.id, ingredientKey: ing.id, session });
        const displayName = getIngredientDisplayName({ recipeId: recipe.id, ing, session });
        return { ing, amount, hasOptions, selected, displayName };
      });
  }, [equivalents, recipe, session]);

  const updateSession = (patch: Partial<StudioSession>) => {
    if (!session) return;
    const next = upsertStudioSession({ ...session, ...patch });
    setActiveStudioSessionId(next.id);
    setSession(next);
  };

  const handleSelectOption = (ingredientKey: string, optionId: string) => {
    if (!session) return;
    updateSession({
      selectedOptionByIngredientKey: { ...session.selectedOptionByIngredientKey, [ingredientKey]: optionId },
    });
  };

  const handleCopy = async () => {
    if (!recipe || !equivalents || !session) return;
    const text = buildExportText({ recipe, studio, session, equivalents });
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Copied to clipboard.");
      window.setTimeout(() => setCopyStatus(null), 2000);
    } catch {
      setCopyStatus("Copy failed (clipboard permission).");
      window.setTimeout(() => setCopyStatus(null), 2500);
    }
  };

  if (!recipe) {
    return (
      <div className="page-container">
        <div className="archive-intro">
          <h1>STUDIO (PREVIEW)</h1>
          <p style={{ color: "var(--color-stone)" }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="product-section" style={{ paddingBottom: "2rem", borderBottom: "1px solid var(--color-border-strong)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2rem", alignItems: "start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <h1 style={{ margin: 0 }}>{studio?.titleOverride ?? recipe.metadata.title}</h1>
              <span className="type-tag" style={{ fontSize: "0.7rem" }}>
                Studio (Preview)
              </span>
            </div>
            <p style={{ marginTop: "0.75rem", maxWidth: 860, lineHeight: 1.7 }}>{studio?.intro ?? ""}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", color: "var(--color-stone)" }}>
              <div>
                <strong style={{ color: "var(--color-charcoal)" }}>Yield:</strong> {yieldDisplay}
              </div>
              <div>
                <strong style={{ color: "var(--color-charcoal)" }}>Time:</strong> {studio?.time?.note ?? "time unavailable"}
              </div>
              <div className="urn">{recipe.urn}</div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", alignItems: "center" }}>
              <button type="button" className="btn-primary" onClick={handleCopy} disabled={!equivalents}>
                Copy recipe card
              </button>
              {copyStatus ? <span style={{ color: "var(--color-amber-dark)" }}>{copyStatus}</span> : null}
            </div>
            <div style={{ marginTop: "0.75rem", color: "var(--color-stone)", fontSize: "0.9rem" }}>
              Read-only composer. Interpretations are selectable in the drawer; no claims can be created or edited.
            </div>
            {studio?.disclaimers?.length ? (
              <ul style={{ marginTop: "0.75rem", paddingLeft: "1.25rem", color: "var(--color-stone)", lineHeight: 1.6 }}>
                {studio.disclaimers.map((d, idx) => (
                  <li key={idx}>{d}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div aria-hidden="true">
            <div
              style={{
                border: "1px solid var(--color-border-strong)",
                borderRadius: 16,
                background: "var(--color-muted-bg)",
                height: 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-stone)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {studio?.heroImage?.alt ?? "Hero image placeholder"}
            </div>
          </div>
        </div>
      </div>

      <div className="studio-panels">
        <section className="section-block studio-ingredientsPanel">
          <div className="studio-panelHeader">
            <h2 style={{ margin: 0 }}>INGREDIENTS</h2>
            <div className="studio-scaleControl">
              <label style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.9rem" }}>
                <span>Scale</span>
                <span style={{ color: "var(--color-stone)" }}>{numberFormat.format(session?.scale ?? 1)}×</span>
              </label>
              <input
                type="range"
                min="0.01"
                max="2"
                step="0.01"
                value={session?.scale ?? 1}
                onChange={(e) => updateSession({ scale: Number(e.target.value) })}
                style={{ width: "100%" }}
                aria-label="Scale recipe"
              />
            </div>
          </div>

          <div className="ingredients-table" style={{ marginTop: "1rem" }}>
            {ingredientRows.map(({ ing, amount, hasOptions, selected, displayName }) => (
              <div
                key={ing.id}
                className="ing-row"
                style={{ gridTemplateColumns: "1.5fr 1fr auto", gap: "1rem", cursor: hasOptions ? "pointer" : "default" }}
                onClick={() => (hasOptions ? setDrawerIngredientId(ing.id) : null)}
                role={hasOptions ? "button" : undefined}
                tabIndex={hasOptions ? 0 : -1}
                onKeyDown={(e) => {
                  if (!hasOptions) return;
                  if (e.key === "Enter" || e.key === " ") setDrawerIngredientId(ing.id);
                }}
              >
                <span className="ing-name" style={{ fontFamily: "var(--font-serif)" }}>
                  {displayName}
                </span>
                <span className="ing-amt" style={{ justifySelf: "end" }}>
                  {equivalents ? amount : "loading…"}
                </span>
                {hasOptions ? (
                  <span style={{ color: "var(--color-stone)", fontSize: "0.85rem" }}>
                    {selected ? "Interpretation" : "Select meaning"} →
                  </span>
                ) : (
                  <span style={{ color: "var(--color-stone)", fontSize: "0.85rem" }}> </span>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: "0.75rem", color: "var(--color-stone)", fontSize: "0.9rem" }}>
            Metric-only display. If conversion fails, amount is shown as unavailable.
          </div>
        </section>

        <section className="section-block studio-stepsPanel">
          <h2 style={{ marginTop: 0 }}>PREPARATION</h2>
          <ol className="studio-stepsList">
            {(studio?.steps?.length ? studio.steps : ["Steps unavailable."]).map((step, idx) => (
              <li key={idx} className="studio-step">
                <div className="studio-stepTitle">Step {idx + 1}</div>
                <div className="studio-stepBody">{step}</div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {drawerIngredientId ? (
        <>
          <div
            onClick={() => setDrawerIngredientId(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              zIndex: 2000,
            }}
            aria-hidden="true"
          />
          <aside
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(420px, 92vw)",
              background: "var(--color-warm-white)",
              borderLeft: "1px solid var(--color-border-strong)",
              boxShadow: "var(--shadow-raised-strong)",
              zIndex: 2001,
              padding: "1.25rem 1.25rem",
              overflowY: "auto",
            }}
            aria-label="Interpretation drawer"
          >
            {(() => {
              const ingredient = recipe.items.find((i) => i.id === drawerIngredientId) as RecipeItem | undefined;
              const options = getIngredientOptions(recipe.id, drawerIngredientId);
              const selected = session ? getSelectedOption({ recipeId: recipe.id, ingredientKey: drawerIngredientId, session }) : null;
              const ingredientName = ingredient && session ? getIngredientDisplayName({ recipeId: recipe.id, ing: ingredient, session }) : "";

              return (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start" }}>
                    <div>
                      <h2 style={{ margin: 0 }}>Interpretation</h2>
                      <div style={{ marginTop: "0.25rem", color: "var(--color-stone)" }}>
                        Select among pre-authored options only.
                      </div>
                    </div>
                    <button type="button" className="btn-secondary" onClick={() => setDrawerIngredientId(null)}>
                      Close
                    </button>
                  </div>

                  <div className="product-section" style={{ borderBottom: "1px solid var(--color-border-strong)", marginTop: "1.25rem" }}>
                    <div className="term-row" style={{ border: "none", padding: "0.25rem 0" }}>
                      <div style={{ fontWeight: 700 }}>Ancient term (transliteration):</div>
                      <div style={{ fontFamily: "var(--font-serif)" }}>{ingredient?.transliteration ?? ""}</div>
                    </div>
                    <div className="term-row" style={{ border: "none", padding: "0.25rem 0" }}>
                      <div style={{ fontWeight: 700 }}>Ingredient:</div>
                      <div>{ingredientName}</div>
                    </div>
                    <div className="term-row" style={{ border: "none", padding: "0.25rem 0" }}>
                      <div style={{ fontWeight: 700 }}>Selected:</div>
                      <div style={{ color: "var(--color-earth)" }}>{selected ? selected.label : "Not selected"}</div>
                    </div>
                  </div>

                  {!options.length ? (
                    <p style={{ color: "var(--color-stone)" }}>No options available for this ingredient in the demo dataset.</p>
                  ) : (
                    <div style={{ display: "grid", gap: "0.75rem" }}>
                      {options.map((opt) => {
                        const isSelected = selected?.id === opt.id;
                        return (
                          <label
                            key={opt.id}
                            style={{
                              border: "1px solid var(--color-border-strong)",
                              borderRadius: 12,
                              padding: "0.75rem 0.85rem",
                              display: "grid",
                              gap: "0.5rem",
                              background: isSelected ? "rgba(201,162,39,0.08)" : "transparent",
                              cursor: "pointer",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "flex-start" }}>
                              <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                                <input
                                  type="radio"
                                  name={`studio-opt-${drawerIngredientId}`}
                                  checked={isSelected}
                                  onChange={() => handleSelectOption(drawerIngredientId, opt.id)}
                                />
                                <div style={{ fontWeight: 800 }}>{opt.label}</div>
                              </div>
                              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                {opt.placeholder ? (
                                  <span className="type-tag" style={{ background: "rgba(201,162,39,0.15)", color: "var(--color-amber-dark)" }}>
                                    Demo placeholder
                                  </span>
                                ) : null}
                                <span className={`confidence-badge ${opt.confidence}`}>{opt.confidence}</span>
                              </div>
                            </div>

                            {isCitableStudioOption(opt) ? (
                              <div style={{ color: "var(--color-earth)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                                <strong>Source:</strong>
                                <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
                                  {opt.citations.map((c, idx) => (
                                    <li key={idx}>{c}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <div style={{ color: "var(--color-stone)", fontSize: "0.95rem" }}>
                                Source: project placeholder (not citable)
                              </div>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </aside>
        </>
      ) : null}
    </div>
  );
}
