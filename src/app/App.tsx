import React, { useEffect, useMemo, useState } from "react";
import { Footer } from "../components/layout/Footer";
import { GlobalStyles } from "../components/layout/GlobalStyles";
import { Header } from "../components/layout/Header";
import { PageNav } from "../components/layout/PageNav";
import { AboutPage } from "../pages/about/AboutPage";
import { NewsPage } from "../pages/about/NewsPage";
import { ProjectPage } from "../pages/about/ProjectPage";
import { AboutPeoplePage } from "../pages/about/AboutPeoplePage";
import { ImportPage } from "../pages/admin/ImportPage";
import { ArchivePage } from "../pages/library/ArchivePage";
import { LibraryPage } from "../pages/library/LibraryPage";
import { PeoplePage } from "../pages/library/PeoplePage";
import { PersonDetailPageDb } from "../pages/library/PersonDetailPageDb";
import { RecipePage } from "../pages/library/RecipePage";
import { WorkDetailPageDb } from "../pages/library/WorkDetailPageDb";
import { WorksPage } from "../pages/library/WorksPage";
import HomePage from "../pages/home/HomePage";
import SearchPage from "../pages/search/SearchPage";
import StudioPage from "../pages/studio/StudioPage";
import { IngredientsPage } from "../pages/workshop/IngredientsPage";
import { AncientTermDetailPage } from "../pages/workshop/AncientTermDetailPage";
import { IdentificationDetailPage } from "../pages/workshop/IdentificationDetailPage";
import { IngredientProductDetailPage } from "../pages/workshop/IngredientProductDetailPage";
import { MaterialSourceDetailPage } from "../pages/workshop/MaterialSourceDetailPage";
import { MaterialsDashboardPage } from "../pages/workshop/MaterialsDashboardPage";
import { ProcessesPage } from "../pages/workshop/ProcessesPage";
import { SourcesPage } from "../pages/workshop/SourcesPage";
import { TermsPage } from "../pages/workshop/TermsPage";
import { ToolsPage } from "../pages/workshop/ToolsPage";
import { ExperimentsPage } from "../pages/workshop/ExperimentsPage";
import { WorkshopEntityDetailPage } from "../pages/workshop/WorkshopEntityDetailPage";
import { WorkshopPage } from "../pages/workshop/WorkshopPage";
import { DocsPage } from "../pages/docs/DocsPage";
import {
  normalizeRoute,
  parseDocsRoute,
  parseInterpretationRoute,
  parsePersonRoute,
  parseRecipeRoute,
  parseWorkRoute,
  parseWorkshopEntityRoute,
  resolveLegacyRoute,
  routeToUrl,
  urlToRoute,
} from "./router";
import type { DatabaseState } from "../types";
import type { NavigateOptions, NavigationState } from "./router";
import { coerceNavigationState } from "./router/navigation";

type ThemeMode = "light" | "dark";

// --- Debugging / Error Handling ---
window.onerror = function (message, source, lineno, colno, error) {
  console.error("Global Error Caught:", message, error);
  const root = document.getElementById("root");
  if (root) {
    const errorDiv = document.createElement("div");
    errorDiv.innerHTML = `<div style="color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; margin: 20px; font-family: sans-serif; border-radius: 4px; position: fixed; top: 0; left: 0; width: 100%; z-index: 9999;">
      <h3 style="margin-top:0;">Application Error</h3>
      <p><strong>Message:</strong> ${message}</p>
      <p><strong>Source:</strong> ${source}:${lineno}</p>
    </div>`;
    document.body.appendChild(errorDiv);
  }
};

const App = ({
  db,
  theme,
  setTheme,
  datasetVersionInfo,
  datasetVersionLoaded,
}: {
  db: DatabaseState;
  theme: ThemeMode;
  setTheme: React.Dispatch<React.SetStateAction<ThemeMode>>;
  datasetVersionInfo: { datasetVersion: string; releasedAt: string; schemaVersion: string } | null;
  datasetVersionLoaded: boolean;
}) => {
  const [fontScale, setFontScale] = useState(() => {
    if (typeof window === "undefined") return 1.2;
    try {
      const stored = window.localStorage.getItem("AOS_FONT_SCALE");
      const parsed = stored ? Number.parseFloat(stored) : NaN;
      if ([1, 1.2, 1.4].includes(parsed)) return parsed;
    } catch {}
    return 1.2;
  });
  const [initialUrlState] = useState(() => {
    if (typeof window === "undefined") {
      return { route: "home", searchQuery: "", params: {} };
    }
    const parsed = urlToRoute(new URL(window.location.href));
    const resolved = resolveLegacyRoute(parsed.route, db) ?? parsed.route;
    const canonical = normalizeRoute(resolved);
    const isSearch = canonical === "search";
    return {
      route: canonical,
      searchQuery: isSearch ? parsed.searchQuery : "",
      params: isSearch ? parsed.params : {},
    };
  });
  const [route, setRoute] = useState(initialUrlState.route);
  const [searchQuery, setSearchQuery] = useState(initialUrlState.searchQuery);
  const [searchParams, setSearchParams] = useState<Record<string, string>>(initialUrlState.params);

  useEffect(() => {
    document.title = "Alchemies of Scent — The Laboratory";
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", String(fontScale));
    try {
      window.localStorage.setItem("AOS_FONT_SCALE", String(fontScale));
    } catch {}
  }, [fontScale]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canonicalUrl = routeToUrl(route, { searchQuery, params: searchParams });
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    const nextState: NavigationState = {
      route,
      searchQuery: route === "search" ? searchQuery : undefined,
      params: route === "search" && Object.keys(searchParams).length ? searchParams : undefined,
    };
    const existingState = coerceNavigationState(window.history.state);
    const needsStateUpdate =
      !existingState ||
      existingState.route !== nextState.route ||
      existingState.searchQuery !== nextState.searchQuery;
    if (canonicalUrl !== currentUrl || needsStateUpdate) {
      window.history.replaceState(nextState, "", canonicalUrl);
    }
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const parsed = urlToRoute(new URL(window.location.href));
      const resolved = resolveLegacyRoute(parsed.route, db) ?? parsed.route;
      const canonical = normalizeRoute(resolved);
      const isSearch = canonical === "search";
      const nextSearchQuery = isSearch ? parsed.searchQuery : "";
      const nextParams = isSearch ? parsed.params : {};

      const previousState = coerceNavigationState(event.state);
      const nextState: NavigationState = {
        route: canonical,
        searchQuery: isSearch ? nextSearchQuery : undefined,
        params: isSearch && Object.keys(nextParams).length ? nextParams : undefined,
        fromRoute: previousState?.fromRoute,
        fromQuery: previousState?.fromQuery,
        fromParams: previousState?.fromParams,
      };

      setRoute(canonical);
      setSearchQuery(nextSearchQuery);
      setSearchParams(nextParams);
      const canonicalUrl = routeToUrl(canonical, { searchQuery: nextSearchQuery, params: nextParams });
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (canonicalUrl !== currentUrl) {
        window.history.replaceState(nextState, "", canonicalUrl);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [db]);

  const navigate = useMemo(() => {
    return (nextRoute: string, options?: NavigateOptions) => {
      const resolved = resolveLegacyRoute(nextRoute, db) ?? nextRoute;
      const canonical = normalizeRoute(resolved);
      const isSearch = canonical === "search";
      const nextSearchQuery = options?.searchQuery ?? (isSearch ? searchQuery : "");
      const nextParams = options?.params ?? (isSearch ? searchParams : {});
      const nextState: NavigationState = {
        route: canonical,
        searchQuery: isSearch ? nextSearchQuery : undefined,
        params: isSearch && Object.keys(nextParams).length ? nextParams : undefined,
        fromRoute: undefined,
        fromQuery: undefined,
        fromParams: undefined,
      };

      const url = routeToUrl(canonical, { searchQuery: nextSearchQuery, params: nextParams });
      if (options?.replace) {
        window.history.replaceState(nextState, "", url);
      } else {
        window.history.pushState(nextState, "", url);
      }

      setRoute(canonical);
      setSearchQuery(isSearch ? nextSearchQuery : "");
      setSearchParams(isSearch ? nextParams : {});
    };
  }, [db, route, searchQuery, searchParams]);

  const updateSearchQuery = useMemo(() => {
    return (nextQuery: string, params?: Record<string, string>) => {
      const nextParams = params ?? searchParams;
      setSearchQuery(nextQuery);
      setSearchParams(nextParams);
      if (route !== "search") return;
      const baseState: NavigationState = { route };
      const nextState: NavigationState = {
        ...baseState,
        route,
        searchQuery: nextQuery,
        params: Object.keys(nextParams).length ? nextParams : undefined,
      };
      const url = routeToUrl(route, { searchQuery: nextQuery, params: nextParams });
      window.history.replaceState(nextState, "", url);
    };
  }, [route, searchParams]);

  const changeFontScale = useMemo(() => {
    const steps = [1, 1.2, 1.4];
    return (direction: "up" | "down") => {
      setFontScale((current) => {
        const currentRounded = Number(current.toFixed(2));
        const idx = steps.indexOf(currentRounded);
        if (idx === -1) return 1.2;
        if (direction === "up") return steps[Math.min(idx + 1, steps.length - 1)];
        return steps[Math.max(idx - 1, 0)];
      });
    };
  }, []);

  const renderPage = () => {
    const workshopEntityRoute = parseWorkshopEntityRoute(route);
    if (workshopEntityRoute) {
      return <WorkshopEntityDetailPage navigate={navigate} db={db} routeInfo={workshopEntityRoute} />;
    }

    const interpretationRoute = parseInterpretationRoute(route);
    if (interpretationRoute) {
      if (interpretationRoute.kind === "ancient-term") {
        return <AncientTermDetailPage navigate={navigate} db={db} termId={interpretationRoute.id} />;
      }
      if (interpretationRoute.kind === "identification") {
        return <IdentificationDetailPage navigate={navigate} db={db} identificationId={interpretationRoute.id} />;
      }
      if (interpretationRoute.kind === "ingredient-product") {
        return <IngredientProductDetailPage navigate={navigate} db={db} productId={interpretationRoute.id} />;
      }
      if (interpretationRoute.kind === "material-source") {
        return <MaterialSourceDetailPage navigate={navigate} db={db} sourceId={interpretationRoute.id} />;
      }
    }

    const recipeRoute = parseRecipeRoute(route);
    if (recipeRoute) {
      return <RecipePage navigate={navigate} db={db} recipeId={recipeRoute.id} />;
    }

    if (route === "docs") {
      return <DocsPage navigate={navigate} />;
    }

    const docsRoute = parseDocsRoute(route);
    if (docsRoute) {
      return <DocsPage navigate={navigate} slug={docsRoute.slug} />;
    }

    const personRoute = parsePersonRoute(route);
    if (personRoute) {
      return <PersonDetailPageDb navigate={navigate} db={db} personId={personRoute.id} />;
    }

    const workRoute = parseWorkRoute(route);
    if (workRoute) {
      return <WorkDetailPageDb navigate={navigate} db={db} workId={workRoute.id} />;
    }

    switch (route) {
      case "home":
        return <HomePage navigate={navigate} db={db} />;
      case "library":
        return <LibraryPage navigate={navigate} />;
      case "archive":
        return <ArchivePage navigate={navigate} db={db} />;
      case "works":
        return <WorksPage navigate={navigate} db={db} />;
      case "people":
        return <PeoplePage navigate={navigate} db={db} />;
      case "about":
        return <AboutPage navigate={navigate} />;
      case "project":
        return <ProjectPage db={db} />;
      case "about-people":
        return <AboutPeoplePage navigate={navigate} db={db} />;
      case "news":
        return <NewsPage />;
      case "import":
        return <ImportPage navigate={navigate} db={db} />;
      case "workshop":
        return <WorkshopPage navigate={navigate} db={db} />;
      case "materials":
        return <MaterialsDashboardPage navigate={navigate} />;
      case "terms":
        return <TermsPage navigate={navigate} db={db} />;
      case "ingredients":
        return <IngredientsPage navigate={navigate} db={db} />;
      case "sources":
        return <SourcesPage navigate={navigate} db={db} />;
      case "processes":
        return <ProcessesPage navigate={navigate} db={db} />;
      case "tools":
        return <ToolsPage navigate={navigate} db={db} />;
      case "experiments":
        return <ExperimentsPage />;
      case "search":
        return <SearchPage navigate={navigate} db={db} query={searchQuery} setQuery={updateSearchQuery} />;
      case "studio":
        return <StudioPage navigate={navigate} db={db} />;
      default:
        return <HomePage navigate={navigate} db={db} />;
    }
  };

  return (
    <>
      <GlobalStyles />
      <Header
        navigate={navigate}
        theme={theme}
        toggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        fontScale={fontScale}
        increaseFontScale={() => changeFontScale("up")}
        decreaseFontScale={() => changeFontScale("down")}
      />
      <main>
        <PageNav route={route} db={db} navigate={navigate} />
        {renderPage()}
      </main>
      <Footer navigate={navigate} datasetVersionInfo={datasetVersionInfo} datasetVersionLoaded={datasetVersionLoaded} />
    </>
  );
};

export default App;
