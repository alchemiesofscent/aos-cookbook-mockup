import React from "react";

export function PrimaryCard({
  title,
  kicker,
  body,
  cta,
  tint,
  onClick,
}: {
  title: string;
  kicker: string;
  body: string;
  cta: string;
  tint: "indigo" | "emerald";
  onClick: () => void;
}) {
  return (
    <div className="homeLanding-card">
      <div className="homeLanding-kicker">{kicker}</div>
      <h3 className="homeLanding-cardTitle">{title}</h3>
      <p className="homeLanding-cardBody">{body}</p>
      <div className="homeLanding-cardCtaRow">
        <button type="button" className={`homeLanding-cardBtn homeLanding-cardBtn--${tint}`} onClick={onClick}>
          {cta}
        </button>
      </div>
    </div>
  );
}

