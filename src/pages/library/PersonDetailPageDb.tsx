import React from "react";
import type { DatabaseState } from "../../types";
import { RecipeLinkCards } from "../../components/RecipeLinkCards";

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
  const isTeam = (person?.categories ?? []).includes("team");
  const isCollaborator = (person?.categories ?? []).includes("collaborator");
  const isProjectPerson = isTeam || isCollaborator;
  const emailRe = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const displayName = person?.displayName ?? person?.name ?? "Person";
  const roles = person?.roles?.length ? person.roles : person?.role ? [person.role] : [];
  const roleLabel = roles.length ? roles.join(" • ") : "";
  const affiliations = person?.affiliations?.length ? person.affiliations : [];
  const bio = (person?.bio ?? person?.description ?? "").replace(emailRe, "").trim();
  const links =
    person?.links?.length
      ? person.links
      : person?.externalLinks?.length
        ? person.externalLinks
        : [];
  const safeLinks = links.filter((link) => link.url && !link.url.startsWith("mailto:"));

  const authoredWorks = (db.masterWorks ?? []).filter((w) => w.authorId === personId);
  const authoredWorkIds = new Set(authoredWorks.map((w) => w.id));
  const recipesByPerson = (db.recipes ?? []).filter((r) => authoredWorkIds.has(r.metadata?.sourceWorkId));

  return (
    <div className="page-container">
      <div
        className="product-section"
        style={{ paddingBottom: "3rem", borderBottom: "1px solid var(--color-border-strong)" }}
      >
        <div style={{ display: "flex", gap: "3rem" }}>
          <div style={{ flex: 2 }}>
            <h1 className="hero-title" style={{ fontSize: "2.5rem", marginBottom: "0.25rem", marginTop: 0 }}>
              {displayName}
            </h1>
            <div style={{ fontSize: "1.25rem", color: "var(--color-charcoal)", marginBottom: "0.5rem" }}>
              {roleLabel || (isProjectPerson ? "Team member" : "")}
            </div>
            <div style={{ fontSize: "1rem", color: "var(--color-stone)", marginBottom: "1.5rem" }}>
              {person?.date ? <div>{isProjectPerson ? "Period" : "Floruit"}: {person.date}</div> : null}
              {affiliations.length ? (
                <div>{isProjectPerson ? "Affiliation" : "Associated place"}: {affiliations.join(", ")}</div>
              ) : person?.place ? (
                <div>{isProjectPerson ? "Affiliation" : "Associated place"}: {person.place}</div>
              ) : null}
              {person?.categories?.length ? <div>Categories: {person.categories.join(", ")}</div> : null}
            </div>
            {person?.urn ? <div className="urn" style={{ display: "inline-block", marginBottom: "1rem" }}>{person.urn}</div> : null}
            {safeLinks.length ? (
              <div style={{ marginBottom: "1rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                {safeLinks.map((link) => (
                  <a key={`${link.url}-${link.label}`} href={link.url} className="text-btn" target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          <div style={{ flex: 1 }}>
            <div
              className="product-image-placeholder"
              style={{
                background: "#F0F0F0",
                border: "1px solid #ccc",
                height: "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-sans)",
                color: "#666",
              }}
            >
              [Portrait placeholder]
            </div>
          </div>
        </div>
      </div>

      <div className="product-section">
        <p className="reading" style={{ fontSize: "1.1rem", lineHeight: "1.65", maxWidth: "800px" }}>
          {bio || "No description yet."}
        </p>
      </div>

      {!isProjectPerson && (
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
      )}

      <div className="product-section" style={{ borderBottom: "none" }}>
        <h2>RECIPES</h2>
        {!recipesByPerson.length ? (
          <p style={{ color: "var(--color-stone)" }}>No recipes linked yet.</p>
        ) : (
          <RecipeLinkCards recipes={recipesByPerson} db={db} navigate={navigate} />
        )}
      </div>
    </div>
  );
};
