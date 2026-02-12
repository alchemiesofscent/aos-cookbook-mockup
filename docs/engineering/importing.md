# Importing People and News

This project uses a YAML-driven people pipeline and optional WXR import.

## Scripts

- `npm run import:wxr`  
  Parses a WordPress export XML file and writes draft people YAML to `data/import/people_draft/` and news markdown drafts to `content/news/_draft/`.
  - Default input: `Squarespace-Wordpress-Export-02-11-2026.xml` at repo root.
  - Optional: pass a custom path as the first argument.

- `npm run compile:people`  
  Compiles canonical YAML in `data/people/` into `public/data/seed.json` under `masterPeople`. Historical people are preserved; project people (team/collaborator/alumni) are replaced.

- `npm run validate:seed`  
  Validates dataset invariants including required fields and allowed categories for `masterPeople`.
