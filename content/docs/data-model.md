---
title: Data model
---

## DatabaseState
The root data structure is `DatabaseState` in `src/types.ts`. It contains core collections for recipes, works, people, workshop entities, and site content.

Key collections:
- `recipes`
- `masterWorks`
- `masterPeople`
- `masterIngredients`, `masterTools`, `masterProcesses`
- `ancientIngredients`, `ingredientProducts`, `materialSources`, `identifications`
- `siteContent` (project + news)

## People
`masterPeople` is a mixed collection of historical people and project people.

Required fields (baseline):
- `id`, `urn`, `slug`, `displayName` (or `name` for legacy)

Common optional fields:
- `sortName`, `roles`, `bio`, `shortBlurb`
- `affiliations` and `affiliationsDetailed`
- `publications`
- `image`, `links`
- `categories` (see below)

Categories (allowed):
- `historical` (scholarly / historical figures)
- `team` (project staff)
- `collaborator` (associated faculty / visiting members)
- `alumni` (optional; excluded from Team)

## Notes
- The UI tolerates missing optional fields.
- People cards and details prefer `displayName` and `shortBlurb` (fallback: truncated bio).
- Project people are expected to have exactly one of `team` or `collaborator`.
- About/People sorting uses `sortName` when present, then a last-name fallback.
