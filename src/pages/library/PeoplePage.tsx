import React from "react";
import type { DatabaseState } from "../../types";
import { Icons } from "../../components/Icons";

export const PeoplePage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const people = [...(db.masterPeople ?? [])]
    .filter((p) => !(p.categories ?? []).includes("team"))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate('library')}>
        <Icons.ArrowLeft /> Back to Library
      </div>

      <div className="archive-intro">
        <h1 className="hero-title">PEOPLE</h1>
        <p className="reading">The authors, perfumers, and botanical explorers of antiquity.</p>
      </div>

      <div className="recipe-grid">
        {people.map((person) => (
          <div className="recipe-card" key={person.id}>
            <h3>{person.name}</h3>
            <div className="card-sub">{[person.role, person.date].filter(Boolean).join(" • ")}</div>
            <p style={{ fontSize: "0.9rem", color: "var(--color-earth)", marginBottom: "1.5rem" }}>
              {person.description}
            </p>
            <button className="btn-secondary" onClick={() => navigate(`person:${person.id}`)}>
              View profile
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
