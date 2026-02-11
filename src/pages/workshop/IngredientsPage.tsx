import React, { useMemo, useState } from "react";
import type { DatabaseState, IngredientProduct } from "../../types";
import { DemoBadge } from "../../components/DemoBadge";
import { Icons } from "../../components/Icons";
import { MaterialsSubNav } from "../../components/MaterialsSubNav";

export const IngredientsPage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = db.ingredientProducts ?? [];
    const next = !q
      ? [...items]
      : items.filter((item) => {
          return (
            item.label.toLowerCase().includes(q) || (item.description ?? "").toLowerCase().includes(q)
          );
        });
    next.sort((a, b) => a.label.localeCompare(b.label));
    return next;
  }, [db.ingredientProducts, query]);

  const azList = useMemo(() => {
    const grouped: Record<string, IngredientProduct[]> = {};
    for (const item of filtered) {
      const letter = (item.label[0] ?? "#").toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(item);
    }
    return grouped;
  }, [filtered]);

  return (
    <div className="page-container">
      <div className="archive-intro">
        <h1>INGREDIENTS</h1>
        <MaterialsSubNav navigate={navigate} active="ingredients" />
        <p>Ingredient Products are the modern interpretive targets linked from Ancient Terms via Identifications (demo scaffold).</p>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ingredient products…"
            style={{ padding: "0.6rem 0.75rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}
          />
        </div>

        <div className="filter-meta" style={{ gap: "1rem" }}>
          <div className="view-toggles" style={{ margin: 0 }}>
            <button
              className={`icon-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="A-Z List View"
            >
              A-Z
            </button>
            <button
              className={`icon-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              <Icons.Grid />
            </button>
          </div>
          <button className="text-btn" onClick={() => setQuery("")}>
            Clear
          </button>
          <span>{filtered.length} items</span>
        </div>
      </div>

      {viewMode === "list" && (
        <div className="az-container">
          <div className="az-nav">
            {["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"].map((char) => (
              <a key={char} href={`#az-${char}`} className={!azList[char] ? "disabled" : ""}>
                {char}
              </a>
            ))}
          </div>
          <div className="az-content">
            {Object.keys(azList)
              .sort()
              .map((char) => (
                <div key={char} id={`az-${char}`} className="az-group">
                  <h2>{char}</h2>
                  <div className="az-list">
                    {azList[char].map((item) => (
                      <div key={item.id} className="az-card">
                        <div className="az-card-header" style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                          <h3>{item.label}</h3>
                          <DemoBadge placeholder={item.placeholder} />
                        </div>
                        <p>{item.description ?? "Demo product record."}</p>
                        <div className="az-actions">
                          <button className="text-btn" onClick={() => navigate(`ingredient-product:${item.id}`)}>
                            [View product →]
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {viewMode === "grid" && (
        <div className="workshop-grid">
          {filtered.map((item) => (
            <div className="workshop-card" key={item.id} onClick={() => navigate(`ingredient-product:${item.id}`)}>
              <div className="card-top">
                <h3>{item.label}</h3>
                <DemoBadge placeholder={item.placeholder} />
              </div>
              <div className="def">{item.description ?? "Demo product record."}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
