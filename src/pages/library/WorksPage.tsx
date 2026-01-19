import React from "react";
import type { DatabaseState } from "../../types";
import { Icons } from "../../components/Icons";

export const WorksPage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const works = [...(db.masterWorks ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate('library')}>
        <Icons.ArrowLeft /> Back to Library
      </div>

      <div className="archive-intro">
        <h1 className="hero-title">WORKS</h1>
        <p className="reading">Key treatises on botany, pharmacology, and perfumery from the ancient world.</p>
      </div>

      <div className="recipe-grid">
        {works.map((work) => (
          <div className="recipe-card" key={work.id}>
            <h3>{work.name}</h3>
            <div className="card-sub">
              {[work.author, work.date].filter(Boolean).join(" • ")}
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--color-earth)", marginBottom: "1.5rem" }}>
              {work.description}
            </p>
            <div className="card-meta">
              <span className="urn">{work.urn}</span>
            </div>
            <button className="btn-primary" onClick={() => navigate(`work:${work.id}`)}>
              View work
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
