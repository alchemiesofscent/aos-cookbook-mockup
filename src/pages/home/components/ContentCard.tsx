import React from "react";

export function ContentCard({
  title,
  subtitle,
  tag,
  accent,
  onClick,
}: {
  title: string;
  subtitle: string;
  tag: string;
  accent: "rose" | "resin" | "methods";
  onClick: () => void;
}) {
  return (
    <button type="button" className="homeLanding-contentCard" onClick={onClick}>
      <div className={`homeLanding-contentMedia homeLanding-contentMedia--${accent}`}>
        <div className="homeLanding-contentTag">{tag}</div>
      </div>
      <div className="homeLanding-contentBody">
        <p className="homeLanding-contentTitle">{title}</p>
        <p className="homeLanding-contentSub">{subtitle}</p>
      </div>
    </button>
  );
}

