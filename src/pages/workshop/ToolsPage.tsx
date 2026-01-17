import React from "react";
import type { DatabaseState } from "../../types";
import { Icons } from "../../components/Icons";

export const ToolsPage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const tools = [...(db.masterTools ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="page-container">
      <div className="back-link" onClick={() => navigate("workshop")}>
        <Icons.ArrowLeft /> Back to Workshop
      </div>
      <div className="archive-intro">
        <h1>TOOLS</h1>
        <p>The equipment of the ancient laboratory.</p>
      </div>
      <div className="workshop-grid">
        {tools.map((tool) => (
          <div key={tool.id} className="workshop-card" onClick={() => navigate(`workshop-tool:${tool.id}`)}>
            <div className="card-top">
              <h3>{tool.name}</h3>
              <span className="type-tag">{tool.type || "Tool"}</span>
            </div>
            <div className="def">{tool.description || "No description yet."}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

