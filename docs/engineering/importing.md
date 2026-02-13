# Importing People and News

This project uses a YAML-driven people pipeline and an optional WXR importer.

## Quick start
1. Place the WordPress export XML at `tmp/Squarespace-Wordpress-Export-02-11-2026.xml`.
2. Run the importer to generate drafts:
   - `npm run import:wxr -- tmp/Squarespace-Wordpress-Export-02-11-2026.xml`
3. Review drafts in `data/import/people_draft/` and copy confirmed people into `data/people/`.
4. Compile the canonical dataset:
   - `npm run compile:people`
5. Validate invariants:
   - `npm run validate:seed`

## Scripts
- `npm run import:wxr`
  - Parses WXR XML and writes draft people YAML to `data/import/people_draft/`.
  - Writes draft news markdown to `content/news/_draft/` for `wp:post_type == post`.
  - Writes legacy redirect mappings to `public/legacy/redirects.json`.

- `npm run compile:people`
  - Compiles `data/people/*.yaml` into `public/data/seed.json` under `masterPeople`.
  - Preserves historical people and replaces project people (team/collaborator/alumni).
  - Enforces project category consistency (project profiles cannot be both team and collaborator).

- `npm run validate:seed`
  - Validates IDs, URNs, and allowed categories.
  - Rejects deprecated demo IDs (`p-team-chemist`, `p-team-research-associate`).

## People YAML fields
Required:
- `id`, `urn`, `slug`, `displayName`

Common optional fields:
- `sortName`, `roles`, `bio`, `shortBlurb`
- `affiliations` (string array) and/or `affiliationsDetailed` (structured array)
- `publications` (link array)
- `image`, `links`, `categories`

Categories allowed:
- `historical`, `team`, `collaborator`, `alumni`

Category policy:
- Historical people use `historical`.
- Project people must use exactly one of `team` or `collaborator`.
- `alumni` is optional metadata and does not replace the required project role marker.

Image handling:
- Prefer site-relative image paths for long-term stability on GitHub Pages, e.g. `/img/people/<slug>.jpg`.
- If external image URLs are used temporarily, ensure they are migrated to local assets before release.
