# Navigation Enhancements WBS

## Locked Decisions
1. Query-param routing for MVP static hosting: `${import.meta.env.BASE_URL}?r=${encodeURIComponent(routeString)}` with additional params as needed.
1. Canonical internal route strings serialize losslessly into URLs for deep links.
1. Prefer `popstate` + `history.pushState`/`history.replaceState`; avoid path-based routing and host rewrites.
1. Legacy routes are accepted and canonicalized; new navigation must never emit legacy routes.
1. On load and on `popstate`: parse URL → routeString → `resolveLegacyRoute(db)` → set app route; canonicalize URL via `replaceState` when needed.
1. Search/filter state must be in the URL. Encode at least `q` (and filters) alongside `r`. Browser-back restores prior search state.
1. Breadcrumbs are IA-based (not history-based): Home → Library (Recipes/Works/People) / Workshop (Ancient Terms/Materials/Identifications/Processes/Tools) / About / Search.
1. Breadcrumb entity labels use db fields only (e.g., `recipe.title`, `person.displayName`, `work.title`); no disambiguation/provisional text.
1. Breadcrumbs replace generic “Back to X index” links. No separate back-to-results control.
1. Add `routeToUrl`/`urlToRoute` helpers and a single `navigate(route, { replace? })` that updates state + URL; subscribe to `popstate` once with no feedback loop.

## Work Breakdown Structure
1. Routing + History
   - Add `routeToUrl`/`urlToRoute` helpers for query-param routing and canonicalization.
   - Normalize routes and resolve legacy routes on load and `popstate`.
   - Implement `navigate(route, options)` with `history.pushState`/`replaceState` and avoid `popstate` feedback loops.
   - Persist search/filter state in URL (`q` + filters).
1. Breadcrumbs + Back Link Policy
   - Build IA-based breadcrumb mapping and labels from db fields.
   - Add Breadcrumbs and PageNav layout components.
   - Remove per-page back links now replaced by breadcrumbs.
   - Keep navigation bar aligned with breadcrumbs-only layout.
1. Styling + Layout
   - Add global styles for breadcrumb bar and back link reset.
1. Validation
   - Manual navigation check for deep links, back/forward, search query persistence, and breadcrumb accuracy.
