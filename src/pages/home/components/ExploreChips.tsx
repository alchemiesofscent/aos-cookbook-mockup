import React from "react";
import { homepageContent } from "../../../content/homepage";

export function ExploreChips({
  tabs,
  onSelect,
}: {
  tabs: typeof homepageContent.exploreTabs;
  onSelect: (route: string) => void;
}) {
  return (
    <div className="homeLanding-explore">
      <div className="homeLanding-chipBar">
        {tabs.map((tab) => (
          <details key={tab.label} className="homeLanding-chip">
            <summary>
              {tab.label} <span style={{ color: "var(--color-stone)" }}>▾</span>
            </summary>
            <div className="homeLanding-chipMenu">
              {tab.items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={(e) => {
                    if (item.route) onSelect(item.route);
                    const parent = (e.currentTarget as HTMLButtonElement).closest("details");
                    if (parent) parent.open = false;
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

