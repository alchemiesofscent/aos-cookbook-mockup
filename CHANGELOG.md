# Changelog

All notable changes to the dataset and site should be documented here.

This project follows Semantic Versioning for the dataset: see `docs/engineering/versioning.md`.

## Unreleased

### Dataset
- Added project profiles for Diana Míčková, Heike Wilde, Laura Juliana Prieto Pabón, Victor Golubev, and Julie Tomsová.
- Removed deprecated demo profiles `p-team-chemist` and `p-team-research-associate`.
- Added local portrait assets under `public/img/people/` and updated people records to use site-relative image paths.
- Extended people schema usage with `shortBlurb`, `affiliationsDetailed`, and `publications`.
- Enforced project category policy: project people must be exactly one of `team` or `collaborator`.

### Site
- Updated About People cards and person detail pages to use clean project profile layouts with short blurbs, affiliation blocks, and publications sections.
- Removed bottom recipe links for project people (historical people still show Works/Recipes).
- Updated person breadcrumbs to route project people under `Home > About > People > [Person]`.
- Standardized people ordering by last name (`sortName` when present; fallback to derived surname key).
- Added runtime pruning of deprecated demo people from localStorage-backed state.
- Fixed GitHub Pages media handling:
  - person images resolve against `BASE_URL`,
  - homepage/studio hero video now uses MP4 source,
  - Pages workflow transcodes source MOV to web-safe MP4 during build.

## 0.1.0

### Dataset
- Initial public wireframe dataset scaffolding (recipes, works, people, interpretation chain placeholders).

### Site
- Initial public wireframe UX for Library/Workshop/Studio with data-driven navigation.
