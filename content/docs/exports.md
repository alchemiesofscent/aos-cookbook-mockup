---
title: Exports
---

## Seed export
The canonical dataset ships in `public/data/seed.json`. This file is the primary export target for static hosting.

## Local export
The app stores data in `localStorage`. If you need a local snapshot, use the in-app export workflow (Admin import page) or export the localStorage keys starting with `AOS_`.

## People pipeline
Project people are authored as YAML in `data/people/` and compiled into `seed.json` via:
- `npm run compile:people`

Historical people remain in `seed.json` and are preserved by the compile step.
