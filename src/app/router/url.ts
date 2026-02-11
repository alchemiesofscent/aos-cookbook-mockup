import {
  parseInterpretationRoute,
  parsePersonRoute,
  parseRecipeRoute,
  parseWorkRoute,
  parseWorkshopEntityRoute,
} from "./parse";

export const ROUTE_QUERY_PARAM = "r";
export const SEARCH_QUERY_PARAM = "q";

const STATIC_ROUTES = new Set([
  "home",
  "library",
  "archive",
  "works",
  "people",
  "about",
  "project",
  "team",
  "news",
  "import",
  "workshop",
  "materials",
  "terms",
  "ingredients",
  "sources",
  "processes",
  "tools",
  "experiments",
  "search",
  "studio",
]);

export type UrlRouteState = {
  route: string;
  searchQuery: string;
  params: Record<string, string>;
};

export const normalizeRoute = (route: string): string => {
  const trimmed = (route ?? "").trim();
  if (!trimmed) return "home";
  if (STATIC_ROUTES.has(trimmed)) return trimmed;
  if (parseWorkshopEntityRoute(trimmed)) return trimmed;
  if (parseInterpretationRoute(trimmed)) return trimmed;
  if (parseRecipeRoute(trimmed)) return trimmed;
  if (parsePersonRoute(trimmed)) return trimmed;
  if (parseWorkRoute(trimmed)) return trimmed;
  return "home";
};

export const urlToRoute = (url: URL): UrlRouteState => {
  const params = url.searchParams;
  const rawRoute = params.get(ROUTE_QUERY_PARAM);
  const route = rawRoute && rawRoute.trim() ? rawRoute : "home";
  const searchQuery = params.get(SEARCH_QUERY_PARAM) ?? "";
  const extraParams: Record<string, string> = {};

  params.forEach((value, key) => {
    if (key === ROUTE_QUERY_PARAM || key === SEARCH_QUERY_PARAM) return;
    extraParams[key] = value;
  });

  return { route, searchQuery, params: extraParams };
};

export const routeToUrl = (
  route: string,
  options?: { searchQuery?: string; params?: Record<string, string>; baseUrl?: string },
): string => {
  const { searchQuery = "", params = {}, baseUrl = import.meta.env.BASE_URL } = options ?? {};
  const normalizedBase = baseUrl && baseUrl.endsWith("/") ? baseUrl : `${baseUrl || "/"}/`;
  const pathname = normalizedBase.startsWith("/") ? normalizedBase : `/${normalizedBase}`;
  const encodeRoute = (value: string) => encodeURIComponent(value).replace(/%3A/gi, ":");
  const encodeParam = (value: string) => encodeURIComponent(value);

  const pairs: string[] = [];
  pairs.push(`${ROUTE_QUERY_PARAM}=${encodeRoute(route)}`);
  if (route === "search") {
    pairs.push(`${SEARCH_QUERY_PARAM}=${encodeParam(searchQuery)}`);
    Object.entries(params).forEach(([key, value]) => {
      if (!key || key === ROUTE_QUERY_PARAM || key === SEARCH_QUERY_PARAM) return;
      pairs.push(`${encodeParam(key)}=${encodeParam(value)}`);
    });
  }

  return `${pathname}?${pairs.join("&")}`;
};
