import React from "react";
import type { DatabaseState } from "../../types";

export const ProcessesPage = ({ navigate, db }: { navigate: (route: string) => void; db: DatabaseState }) => {
  const processes = [...(db.masterProcesses ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="page-container">
      <div className="archive-intro">
        <h1>PROCESSES</h1>
        <p>Techniques for extracting and compounding aromatics.</p>
      </div>
      <div className="workshop-grid">
        {processes.map((process) => (
          <div key={process.id} className="workshop-card" onClick={() => navigate(`workshop-process:${process.id}`)}>
            <div className="card-top">
              <h3>{process.name}</h3>
              <span className="type-tag">{process.type || "Process"}</span>
            </div>
            <div className="def">{process.description || "No description yet."}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
