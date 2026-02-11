import React, { useMemo, useState } from "react";
import type { DatabaseState } from "../../types";
import { DemoBadge } from "../../components/DemoBadge";
import { MaterialsSubNav } from "../../components/MaterialsSubNav";

export const SourcesPage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = db.materialSources ?? [];
    const next = !q
      ? [...items]
      : items.filter((item) => {
          return item.label.toLowerCase().includes(q) || (item.description ?? "").toLowerCase().includes(q);
        });
    next.sort((a, b) => a.label.localeCompare(b.label));
    return next;
  }, [db.materialSources, query]);

  return (
    <div className="page-container">
      <div className="archive-intro">
        <h1>MATERIAL SOURCES</h1>
        <MaterialsSubNav navigate={navigate} active="sources" />
        <p>Material Sources are the (placeholder) foundations for Ingredient Products in the interpretation chain.</p>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sources…"
            style={{ padding: "0.6rem 0.75rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}
          />
        </div>
        <div className="filter-meta">
          <button className="text-btn" onClick={() => setQuery("")}>
            Clear
          </button>
          <span>Showing {filtered.length} sources</span>
        </div>
      </div>

      <div className="workshop-grid">
        {filtered.map((item) => (
          <div className="workshop-card" key={item.id} onClick={() => navigate(`material-source:${item.id}`)}>
            <div className="card-top">
              <h3>{item.label}</h3>
              <DemoBadge placeholder={item.placeholder} />
            </div>
            <div className="def">{item.description ?? "Demo source record."}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
