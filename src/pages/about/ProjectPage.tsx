import React from "react";
import type { ContentBlock, DatabaseState } from "../../types";

const renderBlocks = (blocks: ContentBlock[]) => {
  return blocks.map((block, idx) => {
    if (block.type === "heading") {
      return (
        <h2 key={`${block.text}-${idx}`} style={{ marginTop: idx === 0 ? 0 : "2rem" }}>
          {block.text}
        </h2>
      );
    }
    return (
      <p key={`${block.text}-${idx}`} className="reading" style={{ marginBottom: "1rem" }}>
        {block.text}
      </p>
    );
  });
};

export const ProjectPage = ({ db }: { db: DatabaseState }) => {
  const project = db.siteContent?.project;
  return (
    <div className="page-container">
      <h1 className="hero-title">{project?.title || "About the Project"}</h1>
      <div className="section-block">
        {project?.intro ? (
          <p className="reading" style={{ fontSize: "1.25rem", marginBottom: "2rem" }}>
            {project.intro}
          </p>
        ) : (
          <p className="reading" style={{ fontSize: "1.25rem", marginBottom: "2rem" }}>
            Alchemies of Scent reconstructs the sensory past of antiquity through the interdisciplinary study of perfumery.
          </p>
        )}
        {project?.blocks?.length ? (
          renderBlocks(project.blocks)
        ) : (
          <p className="reading">
            Combining historical analysis, linguistic studies, and experimental archaeology, we aim to understand how ancient
            civilizations created, used, and understood scent.
          </p>
        )}
      </div>
    </div>
  );
};
