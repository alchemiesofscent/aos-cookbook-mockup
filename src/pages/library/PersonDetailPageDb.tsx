import React from "react";
import type { DatabaseState } from "../../types";
import { RecipeLinkCards } from "../../components/RecipeLinkCards";
import {
  getPersonAffiliations,
  getPersonBio,
  getPersonDisplayName,
  getPersonPublications,
  getPersonRoles,
  isProjectPerson,
  splitBioParagraphs,
} from "../../lib/people";

export const PersonDetailPageDb = ({
  navigate,
  db,
  personId,
}: {
  navigate: (route: string) => void;
  db: DatabaseState;
  personId: string;
}) => {
  const person = (db.masterPeople ?? []).find((p) => p.id === personId) ?? null;
  const isProject = isProjectPerson(person);
  const displayName = getPersonDisplayName(person);
  const roles = getPersonRoles(person);
  const roleLabel = roles.length ? roles.join(" • ") : "";
  const affiliations = getPersonAffiliations(person);
  const bio = getPersonBio(person);
  const bioParagraphs = splitBioParagraphs(bio);
  const publications = isProject ? getPersonPublications(person) : [];
  const links =
    person?.links?.length
      ? person.links
      : person?.externalLinks?.length
        ? person.externalLinks
        : [];
  const safeLinks = links.filter((link) => link.url && !link.url.startsWith("mailto:"));
  const publicationUrlSet = new Set(publications.map((link) => link.url));
  const profileLinks = safeLinks.filter((link) => !publicationUrlSet.has(link.url));
  const imageSrc = person?.image?.src;
  const imageAlt = person?.image?.alt ?? displayName;

  const authoredWorks = (db.masterWorks ?? []).filter((w) => w.authorId === personId);
  const authoredWorkIds = new Set(authoredWorks.map((w) => w.id));
  const recipesByPerson = (db.recipes ?? []).filter((r) => authoredWorkIds.has(r.metadata?.sourceWorkId));

  return (
    <div className="page-container">
      <div
        className="product-section"
        style={{ paddingBottom: "3rem", borderBottom: "1px solid var(--color-border-strong)" }}
      >
        <div className="person-detail-hero">
          <div className="person-detail-main">
            <h1 className="hero-title" style={{ fontSize: "2.5rem", marginBottom: "0.25rem", marginTop: 0 }}>
              {displayName}
            </h1>
            <div style={{ fontSize: "1.25rem", color: "var(--color-charcoal)", marginBottom: "0.5rem" }}>
              {roleLabel || (isProject ? "Team member" : "")}
            </div>
            <div className="person-meta-list">
              {person?.date ? <div>{isProject ? "Period" : "Floruit"}: {person.date}</div> : null}
            </div>
            {person?.urn ? <div className="urn" style={{ display: "inline-block", marginBottom: "1rem" }}>{person.urn}</div> : null}
            {profileLinks.length ? (
              <div className="person-link-row">
                {profileLinks.map((link) => (
                  <a key={`${link.url}-${link.label}`} href={link.url} className="text-btn" target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          <div className="person-detail-aside">
            {imageSrc ? (
              <img className="person-portrait-image person-portrait-large-image" src={imageSrc} alt={imageAlt} />
            ) : (
              <div className="product-image-placeholder person-portrait-large">[portrait placeholder]</div>
            )}
          </div>
        </div>
        {affiliations.length ? (
          <div className="person-affiliation-list">
            {affiliations.map((affiliation, idx) => (
              <div className="person-affiliation-item" key={`${affiliation.institution}-${idx}`}>
                {affiliation.url ? (
                  <a className="text-btn" href={affiliation.url} target="_blank" rel="noreferrer">
                    {affiliation.institution}
                  </a>
                ) : (
                  <div className="person-affiliation-title">{affiliation.institution}</div>
                )}
                {affiliation.department || affiliation.location ? (
                  <div className="person-affiliation-detail">
                    {[affiliation.department, affiliation.location].filter(Boolean).join(" • ")}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="product-section">
        <h2>BIOGRAPHY</h2>
        {!bioParagraphs.length ? (
          <p className="reading person-bio-paragraph">No description yet.</p>
        ) : (
          bioParagraphs.map((paragraph, idx) => (
            <p key={`bio-${idx}`} className="reading person-bio-paragraph">
              {paragraph}
            </p>
          ))
        )}
      </div>

      {isProject ? (
        <div className="product-section">
          <h2>PUBLICATIONS</h2>
          {!publications.length ? (
            <p style={{ color: "var(--color-stone)" }}>No publications linked yet.</p>
          ) : (
            <ul className="person-publication-list">
              {publications.map((publication) => (
                <li key={`${publication.url}-${publication.label}`}>
                  <a href={publication.url} className="text-btn" target="_blank" rel="noreferrer">
                    {publication.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          <div className="product-section">
            <h2>WORKS</h2>
            {!authoredWorks.length ? (
              <p style={{ color: "var(--color-stone)" }}>No works linked yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {authoredWorks.map((work) => (
                  <li key={work.id} style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
                    <span className="text-btn" style={{ fontSize: "1.1rem", cursor: "pointer" }} onClick={() => navigate(`work:${work.id}`)}>
                      {work.name} →
                    </span>
                    {work.description ? (
                      <div style={{ fontSize: "0.9rem", color: "var(--color-stone)", marginTop: "0.2rem", paddingLeft: "1rem" }}>
                        {work.description}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="product-section" style={{ borderBottom: "none" }}>
            <h2>RECIPES</h2>
            {!recipesByPerson.length ? (
              <p style={{ color: "var(--color-stone)" }}>No recipes linked yet.</p>
            ) : (
              <RecipeLinkCards recipes={recipesByPerson} db={db} navigate={navigate} />
            )}
          </div>
        </>
      )}
    </div>
  );
};
