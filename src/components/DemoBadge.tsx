import React from "react";

export const DemoBadge = ({ placeholder }: { placeholder?: boolean }) => {
  if (!placeholder) return null;
  return <span className="type-tag">Demo data</span>;
};

