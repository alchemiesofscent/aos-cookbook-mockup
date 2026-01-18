import React, { useEffect, useState } from "react";
import { assertRecipeAnnotationInvariants } from "../../invariants";
import { loadState, StorageAdapter } from "../../storage";
import type { DatabaseState } from "../../types";
import App from "../App";

type ThemeMode = "light" | "dark";
const THEME_STORAGE_KEY = "AOS_THEME";

type DatasetVersionInfo = {
  datasetVersion: string;
  releasedAt: string;
  schemaVersion: string;
};

const Bootstrap = () => {
  const [db, setDb] = useState<DatabaseState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [datasetVersionInfo, setDatasetVersionInfo] = useState<DatasetVersionInfo | null>(null);
  const [datasetVersionLoaded, setDatasetVersionLoaded] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark") return stored;
    } catch {}
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    let isMounted = true;

    const loadDatasetVersionInfo = async () => {
      try {
        const base = import.meta.env.BASE_URL || "/";
        const normalizedBase = base.endsWith("/") ? base : `${base}/`;
        const versionUrl = `${normalizedBase}data/version.json`;
        const response = await fetch(versionUrl, { cache: "no-cache" });
        if (!response.ok) return;
        const parsed = (await response.json()) as DatasetVersionInfo;
        if (!parsed?.datasetVersion || !parsed?.releasedAt || !parsed?.schemaVersion) return;
        if (!isMounted) return;
        setDatasetVersionInfo(parsed);
      } catch {
      } finally {
        if (!isMounted) return;
        setDatasetVersionLoaded(true);
      }
    };

    loadDatasetVersionInfo();

    loadState()
      .then((loaded) => {
        if (!isMounted) return;
        if (import.meta.env.DEV) {
          for (const recipe of loaded.recipes ?? []) {
            const segments = recipe.text?.combinedSegments ?? [];
            assertRecipeAnnotationInvariants({
              recipeId: recipe.id,
              segments,
              annotations: recipe.annotations,
            });
          }
        }
        setDb(loaded);
      })
      .catch((e) => {
        console.error("Failed to initialize database state:", e);
        setError("Failed to initialize application state.");
        setDb(StorageAdapter.load());
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!db) {
    return (
      <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
        <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Loading…</div>
        <div style={{ color: "#666" }}>Initializing local data.</div>
        {error && <div style={{ marginTop: "1rem", color: "#b00020" }}>{error}</div>}
      </div>
    );
  }

  return (
    <App
      db={db}
      theme={theme}
      setTheme={setTheme}
      datasetVersionInfo={datasetVersionInfo}
      datasetVersionLoaded={datasetVersionLoaded}
    />
  );
};

export default Bootstrap;
