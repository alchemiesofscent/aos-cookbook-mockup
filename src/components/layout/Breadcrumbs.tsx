import React from "react";
import type { NavigateFn } from "../../app/router";
import type { BreadcrumbItem } from "../../app/router/breadcrumbs";

export const Breadcrumbs = ({ items, navigate }: { items: BreadcrumbItem[]; navigate: NavigateFn }) => {
  if (!items.length) return null;
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumbs-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          if (item.route && !isLast) {
            return (
              <li key={`${item.label}-${index}`}>
                <button type="button" className="breadcrumb-link" onClick={() => navigate(item.route!)}>
                  {item.label}
                </button>
              </li>
            );
          }
          return (
            <li key={`${item.label}-${index}`}>
              <span className="breadcrumb-current" aria-current={isLast ? "page" : undefined}>
                {item.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
