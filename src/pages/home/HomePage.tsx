import React, { useMemo, useState } from "react";
import type { DatabaseState } from "../../types";
import type { NavigateFn } from "../../app/router";
import { homepageContent } from "../../content/homepage";
import { ContentCard } from "./components/ContentCard";
import { ExploreChips } from "./components/ExploreChips";
import { PrimaryCard } from "./components/PrimaryCard";
import { SectionHeader } from "./components/SectionHeader";
import "./home.css";

type HomePageProps = {
  navigate: NavigateFn;
  db: DatabaseState;
};

export default function HomePage({ navigate, db }: HomePageProps) {
  const [query, setQuery] = useState("");
  const [heroVideoEnabled, setHeroVideoEnabled] = useState(true);
  const heroVideoSrc = useMemo(() => {
    const base = import.meta.env.BASE_URL || "/";
    const normalizedBase = base.endsWith("/") ? base : `${base}/`;
    return `${normalizedBase}img/20250625_073847000_iOS.mp4`;
  }, []);

  const featured = useMemo(() => {
    const recipe = db.recipes.find((r) => r.slug === homepageContent.feature.recipeSlug) ?? db.recipes[0];
    const sourceWork = recipe?.metadata?.sourceWorkId
      ? db.masterWorks.find((w) => w.id === recipe.metadata.sourceWorkId)
      : undefined;
    return { recipe, sourceWork };
  }, [db]);

  const featuredSubtitle =
    featured.recipe?.metadata?.title && (featured.recipe?.metadata?.author || featured.sourceWork?.name)
      ? [featured.recipe?.metadata?.author, featured.sourceWork?.name].filter(Boolean).join(", ")
      : homepageContent.feature.subtitleFallback;

  const submitSearch = (value: string) => {
    navigate("search", { searchQuery: value });
  };

  return (
    <div className="homeLanding">
      <section className="homeLanding-hero">
        <h1 className="homeLanding-heroTitle hero-title">{homepageContent.hero.title}</h1>
        <p className="homeLanding-heroSubtitle">{homepageContent.hero.subtitle}</p>

        <form
          className="homeLanding-searchForm"
          onSubmit={(e) => {
            e.preventDefault();
            submitSearch(query.trim());
          }}
        >
          <div className="homeLanding-searchField">
            <input
              className="homeLanding-searchInput"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={homepageContent.search.placeholder}
            />
            <button type="submit" className="homeLanding-searchBtn" aria-label="Search">
              ⌕
            </button>
          </div>
          <div className="homeLanding-searchHint">
            Try:{" "}
            {homepageContent.search.examples.map((ex, idx) => (
              <React.Fragment key={ex}>
                <button
                  type="button"
                  onClick={() => {
                    setQuery(ex);
                    submitSearch(ex);
                  }}
                >
                  “{ex}”
                </button>
                {idx < homepageContent.search.examples.length - 1 ? ", " : null}
              </React.Fragment>
            ))}
          </div>
        </form>
      </section>

      <section className="homeLanding-section">
        <div className="homeLanding-primaryGrid">
          {homepageContent.primaryCards.map((card) => (
            <div key={card.title}>
              <PrimaryCard
                title={card.title}
                kicker={card.kicker}
                body={card.body}
                cta={card.cta}
                tint={card.tint}
                onClick={() => navigate(card.route)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="homeLanding-section">
        <SectionHeader title="Start here" />
        <div className="homeLanding-section" style={{ marginTop: "1rem" }}>
          <div className="homeLanding-feature">
            <div className="homeLanding-featureBody">
              <h3 className="homeLanding-featureTitle">{homepageContent.feature.title}</h3>
              <div className="homeLanding-featureSub">{featuredSubtitle}</div>
              <p className="homeLanding-featureBlurb">{homepageContent.feature.blurb}</p>
              <div className="homeLanding-featureActions">
                <button type="button" className="homeLanding-btnSolid" onClick={() => navigate(homepageContent.feature.primaryCta.route)}>
                  {homepageContent.feature.primaryCta.label}
                </button>
                <button type="button" className="homeLanding-btnOutline" onClick={() => navigate(homepageContent.feature.secondaryCta.route)}>
                  {homepageContent.feature.secondaryCta.label}
                </button>
              </div>
            </div>
            <div className="homeLanding-featureMedia" aria-hidden="true">
              {heroVideoEnabled ? (
                <video
                  className="homeLanding-featureVideo"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onError={() => setHeroVideoEnabled(false)}
                >
                  <source src={heroVideoSrc} type="video/mp4" />
                </video>
              ) : null}
              <div className="homeLanding-featureMediaLabel">Featured recipe</div>
            </div>
          </div>
        </div>
      </section>

      <section className="homeLanding-section">
        <SectionHeader title="Explore by" />
        <div style={{ marginTop: "1rem" }}>
          <ExploreChips tabs={homepageContent.exploreTabs} onSelect={navigate} />
        </div>
      </section>

      <section className="homeLanding-section">
        <SectionHeader title="Experiments" rightLinkLabel="All experiments" onRightLinkClick={() => navigate("experiments")} />
        <div className="homeLanding-contentGrid">
          {homepageContent.experiments.map((card) => (
            <div key={card.title}>
              <ContentCard
                title={card.title}
                subtitle={card.subtitle}
                tag={card.tag}
                accent={card.accent}
                onClick={() => navigate(card.route)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="homeLanding-section">
        <SectionHeader title="Updates" rightLinkLabel="All news" onRightLinkClick={() => navigate("news")} />
        <div className="homeLanding-updates">
          <ul className="homeLanding-updatesList">
            {homepageContent.updates.map((u) => (
              <li key={u.title} className="homeLanding-updateRow">
                <div style={{ minWidth: 0 }}>
                  <p className="homeLanding-updateTitle">{u.title}</p>
                  <p className="homeLanding-updateMeta">{u.meta}</p>
                </div>
                <button type="button" className="homeLanding-updateBtn" onClick={() => navigate(u.route)}>
                  Read
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
