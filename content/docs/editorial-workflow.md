---
title: Editorial workflow
---

## People
1. Run the WXR importer to generate drafts:
   - `npm run import:wxr -- tmp/Squarespace-Wordpress-Export-02-11-2026.xml`
2. Review drafts in `data/import/people_draft/` and copy confirmed people into `data/people/`.
3. Compile into the dataset:
   - `npm run compile:people`
4. Validate the dataset:
   - `npm run validate:seed`

## News
1. Drafts from the importer land in `content/news/_draft/`.
2. Promote final items into `content/news/`.
3. News renders from markdown with frontmatter (`title`, `date`, optional `summary`).

## Docs
Docs live in `content/docs/` as markdown with frontmatter (`title`).
Add or update pages there; they render at `/docs:{slug}`.
