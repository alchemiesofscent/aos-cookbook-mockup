import React from "react";
import type { DatabaseState, MasterEntity } from "../../types";

const getDisplayName = (person: MasterEntity) => person.displayName ?? person.name;
const emailRe = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const getBio = (person: MasterEntity) => (person.bio ?? person.description ?? "").replace(emailRe, "").trim();

const renderCards = (people: MasterEntity[], navigate: (route: string) => void) => {
  if (!people.length) {
    return (
      <div className="metadata-box" style={{ width: "100%" }}>
        No people in the database yet.
      </div>
    );
  }

  return people.map((person) => {
    const image = person.image?.src;
    return (
      <div
        key={person.id}
        className="recipe-card"
        onClick={() => navigate(`person:${person.id}`)}
        style={{ cursor: "pointer" }}
      >
        {image ? (
          <img
            src={image}
            alt={person.image?.alt ?? getDisplayName(person)}
            style={{
              width: "100%",
              height: "180px",
              objectFit: "cover",
              objectPosition: "top center",
              borderRadius: "8px",
              marginBottom: "1rem",
            }}
          />
        ) : null}
        <h3>{getDisplayName(person)}</h3>
        {person.roles?.length ? <div className="card-sub">{person.roles[0]}</div> : person.role ? <div className="card-sub">{person.role}</div> : null}
        {getBio(person) ? (
          <p style={{ fontSize: "0.9rem", color: "var(--color-earth)", marginBottom: "1.5rem" }}>{getBio(person)}</p>
        ) : null}
        <button className="btn-secondary" onClick={() => navigate(`person:${person.id}`)}>
          View profile
        </button>
      </div>
    );
  });
};

export const AboutPeoplePage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const team = [...(db.masterPeople ?? [])]
    .filter((person) => (person.categories ?? []).includes("team") && !(person.categories ?? []).includes("alumni"))
    .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));

  const collaborators = [...(db.masterPeople ?? [])]
    .filter((person) => (person.categories ?? []).includes("collaborator"))
    .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));

  return (
    <div className="page-container">
      <div className="archive-intro">
        <h1 className="hero-title">People</h1>
        <p className="reading">The people building and collaborating on the Alchemies of Scent project.</p>
      </div>

      <div className="section-block">
        <h2 style={{ marginBottom: "1rem" }}>Team</h2>
        <div className="recipe-grid" style={{ marginTop: "1rem" }}>
          {renderCards(team, navigate)}
        </div>
      </div>

      <div className="section-block" style={{ borderBottom: "none" }}>
        <h2 style={{ marginBottom: "1rem" }}>Collaborators</h2>
        <div className="recipe-grid" style={{ marginTop: "1rem" }}>
          {renderCards(collaborators, navigate)}
        </div>
      </div>
    </div>
  );
};
