import React from "react";
import type { DatabaseState } from "../../types";
import { Icons } from "../../components/Icons";
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

  const authoredWorks = (db.masterWorks ?? []).filter((w) => w.authorId === personId);
  const authoredWorkIds = new Set(authoredWorks.map((w) => w.id));
  const recipesByPerson = (db.recipes ?? []).filter((r) => authoredWorkIds.has(r.metadata?.sourceWorkId));

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate(isTeam ? "team" : "people")}>
        <Icons.ArrowLeft /> Back to {isTeam ? "Team" : "People"}
      </div>

      <div
        className="product-section"
        style={{ paddingBottom: "3rem", borderBottom: "1px solid var(--color-border-strong)" }}
      >
        <div style={{ display: "flex", gap: "3rem" }}>
          <div style={{ flex: 2 }}>
            <h1 className="hero-title" style={{ fontSize: "2.5rem", marginBottom: "0.25rem", marginTop: 0 }}>
              {person?.name ?? "Person"}
            </h1>
            <div style={{ fontSize: "1.25rem", color: "var(--color-charcoal)", marginBottom: "0.5rem" }}>
              {person?.role ?? (isTeam ? "Team member" : "")}
            </div>
            <div style={{ fontSize: "1rem", color: "var(--color-stone)", marginBottom: "1.5rem" }}>
              {person?.date ? <div>{isTeam ? "Period" : "Floruit"}: {person.date}</div> : null}
              {person?.place ? <div>{isTeam ? "Affiliation" : "Associated place"}: {person.place}</div> : null}
              {person?.categories?.length ? <div>Categories: {person.categories.join(", ")}</div> : null}
            </div>
            {person?.urn ? <div className="urn" style={{ display: "inline-block", marginBottom: "1rem" }}>{person.urn}</div> : null}
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
          {person?.description ?? "No description yet."}
        </p>
      </div>

      {!isTeam && (
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
