import React from "react";
import type { NavigateFn } from "../../app/router";

export const Footer = ({
  navigate,
  datasetVersionInfo,
  datasetVersionLoaded,
}: {
  navigate: NavigateFn;
  datasetVersionInfo: { datasetVersion: string; releasedAt: string; schemaVersion: string } | null;
  datasetVersionLoaded: boolean;
}) => (
  <footer className="site-footer">
    <div className="footer-columns">
      <div className="col">
        <h4 style={{ cursor: "pointer" }} onClick={() => navigate("library")}>
          The Library
        </h4>
        <a style={{ cursor: "pointer" }} onClick={() => navigate("archive")}>
          Recipes
        </a>
        <a style={{ cursor: "pointer" }} onClick={() => navigate("works")}>
          Works
        </a>
        <a style={{ cursor: "pointer" }} onClick={() => navigate("people")}>
          People
        </a>
      </div>
      <div className="col">
        <h4 style={{ cursor: "pointer" }} onClick={() => navigate("workshop")}>
          The Workshop
        </h4>
        <a style={{ cursor: "pointer" }} onClick={() => navigate("materials")}>
          Materials
        </a>
        <a style={{ cursor: "pointer" }} onClick={() => navigate("processes")}>
          Processes
        </a>
        <a style={{ cursor: "pointer" }} onClick={() => navigate("tools")}>
          Tools
        </a>
        <a style={{ cursor: "pointer" }} onClick={() => navigate("experiments")}>
          Experiments
        </a>
      </div>
      <div className="col">
        <h4 style={{ cursor: "pointer" }} onClick={() => navigate("studio")}>
          The Studio <span className="type-tag" style={{ fontSize: "0.65rem", marginLeft: "0.4rem" }}>Preview</span>
        </h4>
        <a style={{ cursor: "pointer" }} onClick={() => navigate("studio")}>
          Studio (Preview)
        </a>
      </div>
      <div className="col">
        <h4 style={{ cursor: "pointer" }} onClick={() => navigate("about")}>
          About
        </h4>
        <a style={{ cursor: "pointer" }} onClick={() => navigate("project")}>
          Project
        </a>
        <a style={{ cursor: "pointer" }} onClick={() => navigate("about-people")}>
          People
        </a>
        <a style={{ cursor: "pointer" }} onClick={() => navigate("news")}>
          News
        </a>
      </div>
      <div className="col">
        <h4>For scholars</h4>
        <a style={{ cursor: "pointer" }} onClick={() => navigate("docs:architecture")}>
          Architecture overview
        </a>
        <a style={{ cursor: "pointer" }} onClick={() => navigate("docs:data-model")}>
          Data model
        </a>
        <a style={{ cursor: "pointer" }} onClick={() => navigate("docs:identifiers")}>
          Identifiers &amp; citation
        </a>
        <a style={{ cursor: "pointer" }} onClick={() => navigate("docs:exports")}>
          Exports
        </a>
        <a style={{ cursor: "pointer" }} onClick={() => navigate("docs:editorial-workflow")}>
          Editorial workflow
        </a>
      </div>
    </div>
    <div className="footer-bottom">
      {datasetVersionLoaded ? (
        <p>
          {datasetVersionInfo
            ? `Dataset v${datasetVersionInfo.datasetVersion} • Released ${datasetVersionInfo.releasedAt}`
            : "Dataset version unavailable"}
        </p>
      ) : null}
      <p>Content: CC-BY-4.0 • Data: CC0-1.0 • Code: GPL-3.0</p>
      <p>Institute of Philosophy, Czech Academy of Sciences</p>
    </div>
  </footer>
);
