# Versioning Policy

This repo contains two coupled artifacts:

- **The site** (React/TypeScript application)
- **The dataset** (public, citable corpus + interpretation chain)

We use **Semantic Versioning**: `MAJOR.MINOR.PATCH`.

## What We Version

### Dataset Version (primary)

The dataset is the scholarly object. The dataset version governs:

- IDs + URNs stability
- Schema stability
- Link graph stability (no dangling references)
- Public exports (e.g. JSON/JSON-LD) and their contracts

### Site Version (secondary)

The site version may track the dataset version 1:1 for simplicity. If separated later:

- Site version reflects UI/UX + implementation changes
- Dataset version reflects scholarly data + schema changes

For the static-site MVP, the only published version surface is the dataset version in `public/data/version.json`.

## Version Meaning (Dataset)

### MAJOR (1.0.0, 2.0.0…): breaking scholarly compatibility

Bump **MAJOR** when changes break downstream consumers or invalidate stable citations, including:

- Changing, removing, or reassigning any canonical `id`
- Changing URN formats or semantics
- Renaming/removing required fields in the schema
- Changing the meaning of an existing field in a way that would change interpretation for consumers
- Changing route/URL schemes **only** if they are used as stable identifiers (they should not be)

Rule of thumb: if a consumer must change code to keep ingesting the dataset correctly, it’s a MAJOR bump.

### MINOR (1.1.0, 1.2.0…): backward compatible additions

Bump **MINOR** when adding capability or content without breaking existing consumers:

- Adding new recipes / terms / identifications / products / sources
- Adding new optional fields
- Adding new export files or new JSON-LD contexts while keeping existing ones valid
- Adding new external links to third-party corpora

### PATCH (1.0.1, 1.0.2…): fixes only

Bump **PATCH** for corrections that do not break consumers:

- Typos, metadata corrections, copy edits
- Fixing wrong links/references **without changing IDs**
- Bug fixes in UI that don’t alter dataset schema/contracts

## “1.0” Release Criteria

Call the dataset **1.0.0** when all are true:

- **Stable identifiers:** `id` and `urn` policies are documented and enforced (“never recycle IDs”).
- **Schema documented:** required/optional fields and semantics are written down.
- **Validation:** automated checks pass (no dangling IDs, no invalid references, required fields present).
- **Public export:** at least one stable, versioned dataset export is published.
- **Licensing:** explicit open licenses for data and text/translations are stated.
- **Citation UX:** core pages show a consistent “Cite this” block (URN + version + suggested citation).

## DOI Policy (Recommended)

Mint DOIs for **MAJOR** and **MINOR** releases (e.g. `1.0.0`, `1.1.0`), not for every PATCH.

- **DOI releases:** durable scholarly snapshots
- **Patch tags:** quick fixes, rolled up into the next DOI release
