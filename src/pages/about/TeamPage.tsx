import React from "react";
import type { DatabaseState } from "../../types";

export const TeamPage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const team = [...(db.masterPeople ?? [])]
    .filter((p) => (p.categories ?? []).includes("team"))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="page-container">
      <h1 className="hero-title">The Team</h1>
      <div className="section-block">
        <div className="recipe-grid" style={{ marginTop: "2rem" }}>
          {team.map((person) => (
            <div
              key={person.id}
              className="recipe-card"
              onClick={() => navigate(`person:${person.id}`)}
              style={{ cursor: "pointer" }}
            >
              <h3>{person.role || "Team member"}</h3>
              <div className="card-sub">{person.name}</div>
              <p>{person.description}</p>
            </div>
          ))}
          {!team.length ? (
            <div className="metadata-box" style={{ width: "100%" }}>
              No team members in the database yet.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
