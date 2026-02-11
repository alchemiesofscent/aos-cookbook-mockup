import React from "react";
import type { DatabaseState } from "../../types";
import type { NavigateFn } from "../../app/router";
import { buildBreadcrumbs } from "../../app/router/breadcrumbs";
import { Breadcrumbs } from "./Breadcrumbs";

export const PageNav = ({
  route,
  db,
  navigate,
}: {
  route: string;
  db: DatabaseState;
  navigate: NavigateFn;
}) => {
  const crumbs = buildBreadcrumbs(route, db);
  return (
    <div className="page-nav">
      <div className="page-nav-inner">
        <div className="page-nav-left">
          <Breadcrumbs items={crumbs} navigate={navigate} />
        </div>
      </div>
    </div>
  );
};
