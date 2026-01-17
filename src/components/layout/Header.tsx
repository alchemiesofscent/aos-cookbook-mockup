import React from "react";
import { Icons } from "../Icons";

type ThemeMode = "light" | "dark";

export const Header = ({
  navigate,
  theme,
  toggleTheme,
}: {
  navigate: (route: string) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
}) => {
  return (
    <header className="site-header">
      <div className="logo-section" onClick={() => navigate("home")}>
        <div className="logo-title">ALCHEMIES OF SCENT</div>
        <div className="logo-subtitle">The Laboratory</div>
      </div>
      <nav className="main-nav">
        <div className="nav-item">
          <span onClick={() => navigate("library")}>The Library</span> <Icons.ChevronDown />
          <div className="dropdown">
            <div onClick={() => navigate("archive")}>Recipes</div>
            <div onClick={() => navigate("works")}>Works</div>
            <div onClick={() => navigate("people")}>People</div>
          </div>
        </div>
        <div className="nav-item">
          <span onClick={() => navigate("workshop")}>The Workshop</span> <Icons.ChevronDown />
          <div className="dropdown">
            <div onClick={() => navigate("materials")}>Materials</div>
            <div onClick={() => navigate("processes")}>Processes</div>
            <div onClick={() => navigate("tools")}>Tools</div>
            <div onClick={() => navigate("experiments")}>Experiments</div>
          </div>
        </div>
        <div
          className="nav-item"
          onClick={() => navigate("studio")}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <span>Studio</span>
          <span className="type-tag" style={{ fontSize: "0.65rem" }}>
            Preview
          </span>
        </div>
        <div className="nav-item">
          <span onClick={() => navigate("about")}>About</span> <Icons.ChevronDown />
          <div className="dropdown">
            <div onClick={() => navigate("project")}>Project</div>
            <div onClick={() => navigate("team")}>Team</div>
            <div onClick={() => navigate("news")}>News</div>
          </div>
        </div>
        <div className="nav-item search-icon" onClick={() => navigate("search")} title="Search">
          <Icons.Search />
        </div>
        <button
          type="button"
          className="icon-btn theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to day mode" : "Switch to night mode"}
          title={theme === "dark" ? "Day mode" : "Night mode"}
        >
          {theme === "dark" ? <Icons.Sun /> : <Icons.Moon />}
        </button>
      </nav>
    </header>
  );
};
