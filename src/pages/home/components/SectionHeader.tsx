import React from "react";

export function SectionHeader({
  title,
  rightLinkLabel,
  onRightLinkClick,
}: {
  title: string;
  rightLinkLabel?: string;
  onRightLinkClick?: () => void;
}) {
  return (
    <div className="homeLanding-sectionHeader">
      <h2 className="homeLanding-sectionTitle">{title}</h2>
      {rightLinkLabel ? (
        <button type="button" className="homeLanding-sectionLink" onClick={onRightLinkClick}>
          {rightLinkLabel} →
        </button>
      ) : null}
    </div>
  );
}

