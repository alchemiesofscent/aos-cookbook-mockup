import React from "react";
import type { DatabaseState } from "../../types";
import { getPersonDisplayName, getPersonShortBlurb, getPersonRoles, getPersonSortKey } from "../../lib/people";

export const PeoplePage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const people = [...(db.masterPeople ?? [])]
    .filter((p) => (p.categories ?? []).includes("historical"))
    .filter((p) => !(p.categories ?? []).some((c) => c === "team" || c === "collaborator" || c === "alumni"))
    .sort((a, b) => getPersonSortKey(a).localeCompare(getPersonSortKey(b)));

  return (
    <div className="page-container">
      <div className="archive-intro">
        <h1 className="hero-title">PEOPLE</h1>
        <p className="reading">The authors, perfumers, and botanical explorers of antiquity.</p>
      </div>

      <div className="recipe-grid">
        {people.map((person) => {
          const shortBlurb = getPersonShortBlurb(person, 180);
          return (
            <div className="recipe-card" key={person.id}>
              <h3>{getPersonDisplayName(person)}</h3>
              <div className="card-sub">{[...getPersonRoles(person), person.date].filter(Boolean).join(" • ")}</div>
              {shortBlurb ? <p className="person-card-blurb">{shortBlurb}</p> : null}
              <button className="btn-secondary" onClick={() => navigate(`person:${person.id}`)}>
                View profile
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
