import React, { useEffect, useMemo, useState } from "react";
import type { DatabaseState, Recipe, RecipeItem } from "../../types";
import { studioCatalog } from "../../content/studioCatalog";
import {
  createStudioSession,
  getActiveStudioSessionId,
  loadStudioSessions,
  setActiveStudioSessionId,
  upsertStudioSession,
  type StudioSession,
} from "../../studio/storage";

type StudioPageProps = {
  navigate: (route: string) => void;
  db: DatabaseState;
};

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const formatNumber = (value: number) => {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
};

const formatScaledQuantities = (item: RecipeItem, scale: number) => {
  if (!item.quantities?.length || !isFiniteNumber(scale)) return null;
  return item.quantities
    .map((q) => `${formatNumber(q.value * scale)} ${q.unit}`)
    .join(", ");
};

const optionIsCitable = (option: { placeholder: boolean; source?: { kind: string; citation: string } }) => {
  const hasRealSource = Boolean(option.source && option.source.kind !== "none" && option.source.citation.trim());
  if (!option.placeholder) return hasRealSource;
  return hasRealSource;
};

const buildPracticalRecipeCard = (params: {
  recipe: Recipe;
  session: StudioSession;
  selections: Array<{
    termId: string;
    term: string;
    transliteration?: string;
    option: {
      id: string;
      label: string;
      confidence: string;
      placeholder: boolean;
      source?: { kind: string; citation: string };
    };
  }>;
  ingredientLines: Array<{
    label: string;
    originalAmount: string;
    scaledAmount: string | null;
    scalable: boolean;
  }>;
}) => {
  const { recipe, session, selections, ingredientLines } = params;

  const header = [
    "ALCHEMIES OF SCENT — THE STUDIO (PREVIEW)",
    "Practical recipe card (local draft; read-only composer)",
    "",
    `Recipe: ${recipe.metadata.title} — ${recipe.urn}`,
    `Session: ${session.id}`,
    `Updated: ${new Date(session.updatedAt).toLocaleString()}`,
    `Scale: ${formatNumber(session.scale)}×`,
    "",
  ];

  const selectedBlock = selections.length
    ? [
        "Selected interpretations",
        ...selections.map((s) => {
          const termLabel = [s.term, s.transliteration ? `(${s.transliteration})` : ""].filter(Boolean).join(" ");
          const flags = s.option.placeholder ? " [demo placeholder]" : "";
          return `- ${termLabel} → ${s.option.label} [${s.option.confidence}]${flags}`;
        }),
        "",
      ]
    : [];

  const sources = selections
    .filter((s) => optionIsCitable(s.option))
    .map((s) => {
      const prefix = s.option.placeholder ? "Demo source" : "Source";
      return `- ${prefix} for ${s.term} → ${s.option.label}: ${s.option.source?.citation ?? ""}`;
    });

  const sourcesBlock = sources.length ? ["Sources", ...sources, ""] : ["Sources", "- (No citable sources for selected options.)", ""];

  const ingredientsBlock = [
    "Ingredients",
    ...ingredientLines.map((line) => {
      if (!line.scalable) return `- ${line.label} — ${line.originalAmount} (not scalable; no structured quantity)`;
      return `- ${line.label} — ${line.originalAmount} → ${line.scaledAmount ?? line.originalAmount}`;
    }),
    "",
  ];

  const notesBlock = session.notes?.trim()
    ? ["Notes", session.notes.trim(), ""]
    : [];

  return [...header, ...selectedBlock, ...sourcesBlock, ...ingredientsBlock, ...notesBlock].join("\n");
};

export default function StudioPage({ navigate, db }: StudioPageProps) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<StudioSession | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const sessions = useMemo(() => loadStudioSessions(), [activeSessionId, session?.updatedAt]);

  const activeRecipe = useMemo(() => {
    if (!session) return null;
    return db.recipes.find((r) => r.id === session.recipeId) ?? null;
  }, [db.recipes, session]);

  useEffect(() => {
    const stored = getActiveStudioSessionId();
    if (!stored) {
      setActiveSessionId(null);
      setSession(null);
      return;
    }
    const loaded = sessions.find((s) => s.id === stored) ?? null;
    if (!loaded) {
      setActiveStudioSessionId(null);
      setActiveSessionId(null);
      setSession(null);
      return;
    }
    setActiveSessionId(loaded.id);
    setSession(loaded);
  }, [sessions]);

  const startSession = (recipeId: string) => {
    const created = createStudioSession({ recipeId, scale: 1, selectedOptions: {}, notes: "" });
    const saved = upsertStudioSession(created);
    setActiveStudioSessionId(saved.id);
    setActiveSessionId(saved.id);
    setSession(saved);
  };

  const clearActive = () => {
    setActiveStudioSessionId(null);
    setActiveSessionId(null);
    setSession(null);
  };

  const updateSession = (patch: Partial<StudioSession>) => {
    if (!session) return;
    const next = upsertStudioSession({ ...session, ...patch });
    setSession(next);
  };

  const ensureDefaults = () => {
    if (!session || !activeRecipe) return;
    const nextSelected = { ...session.selectedOptions };
    let changed = false;

    for (const item of activeRecipe.items) {
      if (item.type !== "ingredient") continue;
      const termId = item.transliteration ?? "";
      if (!termId) continue;
      const entry = studioCatalog.find((t) => t.termId === termId);
      if (!entry?.options?.length) continue;
      if (!nextSelected[termId]) {
        nextSelected[termId] = entry.options[0].id;
        changed = true;
      }
    }

    if (changed) updateSession({ selectedOptions: nextSelected });
  };

  useEffect(() => {
    ensureDefaults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRecipe?.id, session?.id]);

  const landingRecipe = db.recipes.find((r) => r.slug === "rose-perfume-dioscorides") ?? db.recipes[0];

  const selections = useMemo(() => {
    if (!session || !activeRecipe) return [];
    const selectionsList: Array<{
      termId: string;
      term: string;
      transliteration?: string;
      option: (typeof studioCatalog)[number]["options"][number];
    }> = [];

    for (const item of activeRecipe.items) {
      if (item.type !== "ingredient") continue;
      const termId = item.transliteration ?? "";
      if (!termId) continue;
      const entry = studioCatalog.find((t) => t.termId === termId);
      if (!entry) continue;
      const selectedId = session.selectedOptions[termId] ?? entry.options[0]?.id;
      const option = entry.options.find((o) => o.id === selectedId) ?? entry.options[0];
      if (!option) continue;
      selectionsList.push({
        termId,
        term: entry.term,
        transliteration: entry.transliteration,
        option,
      });
    }

    // Deduplicate by termId
    return selectionsList.filter((s, idx) => selectionsList.findIndex((x) => x.termId === s.termId) === idx);
  }, [activeRecipe, session]);

  const ingredientLines = useMemo(() => {
    if (!session || !activeRecipe) return [];
    const scale = session.scale;
    return activeRecipe.items
      .filter((i) => i.type === "ingredient")
      .map((ing) => {
        const scaled = formatScaledQuantities(ing, scale);
        const scalable = Boolean(ing.quantities?.length);
        const label = [ing.originalTerm, ing.transliteration ? `(${ing.transliteration})` : "", ing.displayTerm ? `— ${ing.displayTerm}` : ""]
          .filter(Boolean)
          .join(" ");
        return {
          label,
          originalAmount: ing.amount || ing.originalAmount || "—",
          scaledAmount: scaled,
          scalable,
        };
      });
  }, [activeRecipe, session]);

  const handleCopy = async () => {
    if (!session || !activeRecipe) return;
    const text = buildPracticalRecipeCard({
      recipe: activeRecipe,
      session,
      selections,
      ingredientLines,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Copied to clipboard.");
      window.setTimeout(() => setCopyStatus(null), 2000);
    } catch {
      setCopyStatus("Copy failed (clipboard permission).");
      window.setTimeout(() => setCopyStatus(null), 2500);
    }
  };

  const renderLanding = () => (
    <div className="page-container">
      <div className="archive-intro">
        <h1>
          THE STUDIO <span className="type-tag" style={{ marginLeft: "0.5rem" }}>Preview</span>
        </h1>
        <p style={{ maxWidth: 820 }}>
          A Phase 2 preview: a <strong>read-only</strong> composer over existing interpretations. No accounts, no editing, no new claims — sessions save only to this browser.
        </p>
      </div>

      <div className="section-block">
        <h2>START</h2>
        <button type="button" className="btn-primary" onClick={() => startSession(landingRecipe.id)}>
          Start with {landingRecipe.metadata.title} →
        </button>
      </div>

      <div className="section-block">
        <h2>RECENT SESSIONS</h2>
        {!sessions.length ? (
          <p style={{ color: "var(--color-stone)" }}>No sessions yet.</p>
        ) : (
          <div className="ingredients-table" style={{ borderTop: "none" }}>
            {sessions.slice(0, 8).map((s) => {
              const recipe = db.recipes.find((r) => r.id === s.recipeId);
              return (
                <div key={s.id} className="ing-row" style={{ gridTemplateColumns: "1.5fr 1fr auto", alignItems: "center" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {recipe?.metadata?.title ?? "Recipe"}
                    </div>
                    <div style={{ color: "var(--color-stone)", fontSize: "0.9rem" }}>Updated {new Date(s.updatedAt).toLocaleString()}</div>
                  </div>
                  <div style={{ color: "var(--color-stone)", fontSize: "0.9rem" }}>Scale {formatNumber(s.scale)}×</div>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setActiveStudioSessionId(s.id);
                      setActiveSessionId(s.id);
                      setSession(s);
                    }}
                  >
                    Resume
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderBuilder = () => {
    if (!session || !activeRecipe) {
      return (
        <div className="page-container">
          <div className="archive-intro">
            <h1>THE STUDIO</h1>
            <p style={{ color: "var(--color-stone)" }}>Session not found.</p>
          </div>
          <button type="button" className="btn-secondary" onClick={clearActive}>
            Back to Studio home
          </button>
        </div>
      );
    }

    return (
      <div className="page-container">
        <div className="back-link" onClick={clearActive}>
          ← Back to Studio home
        </div>

        <div className="recipe-header" style={{ paddingBottom: "1rem" }}>
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            Studio Builder <span className="type-tag">Preview</span>
          </h1>
          <div className="subtitle">{activeRecipe.metadata.title}</div>
          <div className="metadata-box source-box" style={{ marginTop: "1rem" }}>
            <div className="meta-row">
              <span className="urn">{activeRecipe.urn}</span>
              <div className="actions" style={{ display: "flex", gap: "0.75rem" }}>
                <button type="button" className="text-btn" onClick={() => navigate("recipe_rose")}>
                  [Back to recipe]
                </button>
                <button type="button" className="text-btn" onClick={handleCopy}>
                  [Copy practical recipe card]
                </button>
              </div>
            </div>
            {copyStatus ? <div className="meta-row" style={{ color: "var(--color-amber-dark)" }}>{copyStatus}</div> : null}
          </div>
        </div>

        <div className="section-block">
          <h2>SESSION</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", maxWidth: 900 }}>
            <div>
              <label style={{ display: "block", fontWeight: 700, marginBottom: "0.5rem" }}>Scale</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={session.scale}
                onChange={(e) => updateSession({ scale: Number(e.target.value) })}
                style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid var(--color-border-strong)" }}
              />
              <div style={{ marginTop: "0.5rem", color: "var(--color-stone)", fontSize: "0.9rem" }}>
                Scales only items with structured quantities; others remain unchanged and flagged.
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 700, marginBottom: "0.5rem" }}>Private session notes (local only)</label>
              <textarea
                value={session.notes}
                onChange={(e) => updateSession({ notes: e.target.value })}
                rows={4}
                style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid var(--color-border-strong)" }}
              />
            </div>
          </div>
        </div>

        <div className="section-block">
          <h2>INTERPRETATIONS</h2>
          {!selections.length ? (
            <p style={{ color: "var(--color-stone)" }}>No configurable terms for this recipe in the demo catalog.</p>
          ) : (
            <div style={{ display: "grid", gap: "1rem", maxWidth: 900 }}>
              {selections.map((s) => (
                <div key={s.termId} className="metadata-box" style={{ padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>
                        {s.term} {s.transliteration ? <span style={{ color: "var(--color-stone)", fontWeight: 600 }}>({s.transliteration})</span> : null}
                      </div>
                      <div style={{ marginTop: "0.35rem", color: "var(--color-stone)" }}>
                        Select among provided options only. No editing or creation.
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      {s.option.placeholder ? (
                        <span className="type-tag" style={{ background: "rgba(201,162,39,0.15)", color: "var(--color-amber-dark)" }}>
                          Demo placeholder
                        </span>
                      ) : null}
                      <span className={`confidence-badge ${s.option.confidence}`}>{s.option.confidence}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: "0.85rem", display: "grid", gap: "0.75rem" }}>
                    <label style={{ fontWeight: 700 }}>Option</label>
                    <select
                      value={session.selectedOptions[s.termId] ?? s.option.id}
                      onChange={(e) =>
                        updateSession({
                          selectedOptions: { ...session.selectedOptions, [s.termId]: e.target.value },
                        })
                      }
                      style={{ padding: "0.6rem", borderRadius: 8, border: "1px solid var(--color-border-strong)" }}
                    >
                      {studioCatalog
                        .find((t) => t.termId === s.termId)
                        ?.options.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                            {opt.placeholder ? " (demo placeholder)" : ""}
                          </option>
                        ))}
                    </select>

                    <div style={{ color: "var(--color-stone)", fontSize: "0.95rem" }}>
                      {s.option.source?.citation ? (
                        <>
                          <strong>Source:</strong> {s.option.source.citation}
                        </>
                      ) : (
                        <>
                          <strong>Source:</strong> (none)
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section-block">
          <h2>INGREDIENTS (SCALED)</h2>
          <div className="ingredients-table">
            {ingredientLines.map((line) => (
              <div key={line.label} className="ing-row" style={{ gridTemplateColumns: "2.5fr 1fr 1.25fr", gap: "1rem" }}>
                <span className="ing-name">{line.label}</span>
                <span className="ing-amt">{line.originalAmount}</span>
                <span className="ing-role" style={{ justifySelf: "end", color: line.scalable ? "inherit" : "var(--color-stone)" }}>
                  {line.scalable ? line.scaledAmount ?? line.originalAmount : "not scalable"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return activeSessionId && session ? renderBuilder() : renderLanding();
}

