---
title: Identifiers & citation
---

## Identifiers
Each master entity uses three stable identifiers:
- `id`: internal unique id (e.g. `p-sean-coughlin`)
- `slug`: URL-safe stable slug (e.g. `sean-coughlin`)
- `urn`: stable URN (e.g. `urn:aos:person:sean-coughlin`)

Once published, ids and urns must not be regenerated.

## Routes
Canonical internal routes are strings such as:
- `recipe:{id}`
- `work:{id}`
- `person:{id}`

For static hosting, the route is serialized into the URL via query params:
- `/?r=person:p-sean-coughlin`

Legacy routes are accepted and normalized on load.

## Citation
When possible, cite the URN alongside the display name and source work to make references stable across versions.
