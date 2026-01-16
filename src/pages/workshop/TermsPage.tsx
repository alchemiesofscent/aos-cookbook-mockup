import React, { useMemo, useState } from "react";
import type { DatabaseState } from "../../types";
import { DemoBadge } from "../../components/DemoBadge";
import { Icons } from "../../components/Icons";
import { MaterialsSubNav } from "../../components/MaterialsSubNav";

export const TermsPage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = db.ancientIngredients ?? [];
    if (!q) return [...items].sort((a, b) => a.term.localeCompare(b.term));
    return items
      .filter((item) => {
        return (
          item.term.toLowerCase().includes(q) ||
          (item.transliteration ?? "").toLowerCase().includes(q) ||
          (item.description ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [db.ancientIngredients, query]);

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate("workshop")}>
        <Icons.ArrowLeft /> Back to Workshop
      </div>

      <div className="archive-intro">
        <h1>ANCIENT TERMS</h1>
        <MaterialsSubNav navigate={navigate} active="terms" />
        <p>Recipes link to ancient terms only. These pages are a demo scaffold for the interpretation chain.</p>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search terms…"
            style={{ padding: "0.6rem 0.75rem", borderRadius: "10px", border: "1px solid var(--color-border)" }}
          />
        </div>
        <div className="filter-meta">
          <button className="text-btn" onClick={() => setQuery("")}>
            Clear
          </button>
          <span>Showing {filtered.length} terms</span>
        </div>
      </div>

      <div className="workshop-grid">
        {filtered.map((item) => (
          <div className="workshop-card" key={item.id} onClick={() => navigate(`ancient-term:${item.id}`)}>
            <div className="card-top">
              <h3>{item.term}</h3>
              <DemoBadge placeholder={item.placeholder} />
            </div>
            {item.transliteration && <div className="translit">{item.transliteration}</div>}
            <div className="def">{item.description ?? "Demo term record."}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

