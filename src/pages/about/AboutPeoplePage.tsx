import React from "react";
import type { DatabaseState, MasterEntity } from "../../types";
import {
  getPersonDisplayName,
  getPersonRoles,
  getPersonSortKey,
  getPersonShortBlurb,
  isCollaboratorPerson,
  resolvePersonImageSrc,
  isTeamPerson,
} from "../../lib/people";

const renderCards = (people: MasterEntity[], navigate: (route: string) => void) => {
  if (!people.length) {
    return (
      <div className="metadata-box" style={{ width: "100%" }}>
        No people in the database yet.
      </div>
    );
  }

  return people.map((person) => {
    const roles = getPersonRoles(person);
    const shortBlurb = getPersonShortBlurb(person, 170);
    const imageSrc = resolvePersonImageSrc(person.image?.src);
    const imageAlt = person.image?.alt ?? getPersonDisplayName(person);
    return (
      <div
        key={person.id}
        className="recipe-card person-card"
        onClick={() => navigate(`person:${person.id}`)}
        style={{ cursor: "pointer" }}
      >
        {imageSrc ? (
          <img className="person-portrait-image" src={imageSrc} alt={imageAlt} />
        ) : (
          <div className="person-portrait-placeholder">[portrait placeholder]</div>
        )}
        <h3>{getPersonDisplayName(person)}</h3>
        {roles.length ? <div className="card-sub">{roles[0]}</div> : null}
        {shortBlurb ? <p className="person-card-blurb">{shortBlurb}</p> : null}
        <button
          className="btn-secondary"
          onClick={(event) => {
            event.stopPropagation();
            navigate(`person:${person.id}`);
          }}
        >
          View profile
        </button>
      </div>
    );
  });
};

export const AboutPeoplePage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const team = [...(db.masterPeople ?? [])]
    .filter((person) => isTeamPerson(person) && !(person.categories ?? []).includes("alumni"))
    .sort((a, b) => getPersonSortKey(a).localeCompare(getPersonSortKey(b)));

  const collaborators = [...(db.masterPeople ?? [])]
    .filter((person) => isCollaboratorPerson(person) && !(person.categories ?? []).includes("alumni"))
    .sort((a, b) => getPersonSortKey(a).localeCompare(getPersonSortKey(b)));

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
