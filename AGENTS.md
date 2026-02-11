# Repository Guidelines

## Project Structure & Module Organization
- Source: `src/` (React + TypeScript).
- Static data: `public/data/seed.json` plus `public/data/version.json`.
- Docs: `docs/` (planning, roadmap, engineering notes).
- Scripts: `scripts/` (dataset validation tooling).
- Styles: colocated with pages/components, e.g. `src/pages/admin/import.css`.

Routing is query‑based via `/?r=route`. App bootstrap and local storage handling live in `src/app/bootstrap/` and `src/storage.ts`.

## Build, Test, and Development Commands
- `npm run dev` runs the Vite dev server.
- `npm run build` builds the production bundle.
- `npm run preview` serves the production build locally.
- `npm run validate:seed` validates dataset integrity for `public/data/seed.json`.

## Coding Style & Naming Conventions
- Indentation: 2 spaces, no tabs.
- TypeScript + React function components; use PascalCase for components and camelCase for functions/variables.
- Prefer named exports for page components (e.g. `export const TeamPage = …`).
- Keep CSS file names lowercase and colocated with the component/page.
- No enforced formatter or linter in the repo—match existing style.

## Testing Guidelines
There is no test framework configured. Use `npm run validate:seed` for data integrity checks. If you add tests, document the runner and naming convention in this file.

## Commit & Pull Request Guidelines
Commit messages are short, imperative, and often prefixed with a scope (examples from history: `docs: …`, `chore: …`, `ci: …`). Follow this pattern when possible.

PRs should include:
- A concise summary of changes.
- Any updated commands or data migrations.
- Screenshots for UI changes.
- Links to related issues or tasks when applicable.

## Configuration & Data Notes
- The app reads `public/data/seed.json` on first load and persists edits to local storage.
- Content imports (Squarespace XML) are client‑side only; see `docs/engineering/content-importer.md` for details.
