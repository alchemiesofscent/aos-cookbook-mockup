import React, { useEffect, useState } from "react";
import { Footer } from "../components/layout/Footer";
import { GlobalStyles } from "../components/layout/GlobalStyles";
import { Header } from "../components/layout/Header";
import { AboutPage } from "../pages/about/AboutPage";
import { NewsPage } from "../pages/about/NewsPage";
import { ProjectPage } from "../pages/about/ProjectPage";
import { TeamPage } from "../pages/about/TeamPage";
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
import {
  parseInterpretationRoute,
  parsePersonRoute,
  parseRecipeRoute,
  parseWorkRoute,
  parseWorkshopEntityRoute,
  resolveLegacyRoute,
} from "./router";
import type { DatabaseState } from "../types";

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
  const [route, setRoute] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const effectiveRoute = resolveLegacyRoute(route, db) ?? route;

  useEffect(() => {
    document.title = "Alchemies of Scent — The Laboratory";
  }, []);

  useEffect(() => {
    if (effectiveRoute !== route) setRoute(effectiveRoute);
  }, [effectiveRoute, route]);

  const renderPage = () => {
    const workshopEntityRoute = parseWorkshopEntityRoute(effectiveRoute);
    if (workshopEntityRoute) {
      return <WorkshopEntityDetailPage navigate={setRoute} db={db} routeInfo={workshopEntityRoute} />;
    }

    const interpretationRoute = parseInterpretationRoute(effectiveRoute);
    if (interpretationRoute) {
      if (interpretationRoute.kind === "ancient-term") {
        return <AncientTermDetailPage navigate={setRoute} db={db} termId={interpretationRoute.id} />;
      }
      if (interpretationRoute.kind === "identification") {
        return <IdentificationDetailPage navigate={setRoute} db={db} identificationId={interpretationRoute.id} />;
      }
      if (interpretationRoute.kind === "ingredient-product") {
        return <IngredientProductDetailPage navigate={setRoute} db={db} productId={interpretationRoute.id} />;
      }
      if (interpretationRoute.kind === "material-source") {
        return <MaterialSourceDetailPage navigate={setRoute} db={db} sourceId={interpretationRoute.id} />;
      }
    }

    const recipeRoute = parseRecipeRoute(effectiveRoute);
    if (recipeRoute) {
      return <RecipePage navigate={setRoute} db={db} recipeId={recipeRoute.id} />;
    }

    const personRoute = parsePersonRoute(effectiveRoute);
    if (personRoute) {
      return <PersonDetailPageDb navigate={setRoute} db={db} personId={personRoute.id} />;
    }

    const workRoute = parseWorkRoute(effectiveRoute);
    if (workRoute) {
      return <WorkDetailPageDb navigate={setRoute} db={db} workId={workRoute.id} />;
    }

    switch (effectiveRoute) {
      case "home":
        return <HomePage navigate={setRoute} db={db} setSearchQuery={setSearchQuery} />;
      case "library":
        return <LibraryPage navigate={setRoute} />;
      case "archive":
        return <ArchivePage navigate={setRoute} db={db} />;
      case "works":
        return <WorksPage navigate={setRoute} db={db} />;
      case "people":
        return <PeoplePage navigate={setRoute} db={db} />;
      case "about":
        return <AboutPage navigate={setRoute} />;
      case "project":
        return <ProjectPage navigate={setRoute} />;
      case "team":
        return <TeamPage navigate={setRoute} db={db} />;
      case "news":
        return <NewsPage navigate={setRoute} />;
      case "workshop":
        return <WorkshopPage navigate={setRoute} db={db} />;
      case "materials":
        return <MaterialsDashboardPage navigate={setRoute} />;
      case "terms":
        return <TermsPage navigate={setRoute} db={db} />;
      case "ingredients":
        return <IngredientsPage navigate={setRoute} db={db} />;
      case "sources":
        return <SourcesPage navigate={setRoute} db={db} />;
      case "processes":
        return <ProcessesPage navigate={setRoute} db={db} />;
      case "tools":
        return <ToolsPage navigate={setRoute} db={db} />;
      case "experiments":
        return <ExperimentsPage navigate={setRoute} />;
      case "search":
        return <SearchPage navigate={setRoute} db={db} query={searchQuery} setQuery={setSearchQuery} />;
      case "studio":
        return <StudioPage navigate={setRoute} db={db} />;
      default:
        return <HomePage navigate={setRoute} db={db} setSearchQuery={setSearchQuery} />;
    }
  };

  return (
    <>
      <GlobalStyles />
      <Header
        navigate={setRoute}
        theme={theme}
        toggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
      />
      <main>{renderPage()}</main>
      <Footer navigate={setRoute} datasetVersionInfo={datasetVersionInfo} datasetVersionLoaded={datasetVersionLoaded} />
    </>
  );
};

export default App;
