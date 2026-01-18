# Release Process

This project is a published corpus. Releases are about **scholarly stability** (IDs, schema, provenance, and exports).

## Files to Maintain

- `CHANGELOG.md` (human-readable release notes)
- `versioning.md` (version rules)

If/when you add explicit dataset exports, also maintain:

- `public/data/aos-dataset.json` (or similar stable export path)
- `public/data/aos-dataset.version.json` (machine-readable version metadata)

## Release Types

- **PATCH (`x.y.z`)**: corrections and bug fixes; no DOI
- **MINOR (`x.y.0`)**: new content and backward-compatible schema additions; DOI recommended
- **MAJOR (`x.0.0`)**: breaking changes; DOI strongly recommended

## Release Checklist

1. **Decide version bump**
   - Use `versioning.md` rules.

2. **Run validation**
   - `npm run build`
   - Ensure no dangling references in dataset (add/extend validation scripts as they appear).

3. **Update `CHANGELOG.md`**
   - Add a new section for the version with date.
   - Summarize dataset changes first (content/schema/IDs), then UI changes.

4. **Tag the release**
   - Use `vX.Y.Z` tags (e.g. `v1.0.0`).
   - Keep tags immutable once published.

5. **Publish**
   - GitHub Release notes can mirror the changelog section.

## DOI Minting (Zenodo)

Recommended: mint DOIs for **MAJOR/MINOR** releases only.

High-level flow:

1. Connect GitHub repo to Zenodo (one-time).
2. Create a GitHub release for `vX.Y.Z`.
3. Zenodo archives the release and mints a DOI.
4. Record the DOI in the GitHub release notes and (optionally) in a dataset version metadata file.

## Dataset Version Metadata (Recommended)

If you want machine-readable version info, keep a small JSON file like:

```json
{
  "datasetVersion": "1.0.0",
  "siteVersion": "1.0.0",
  "releasedAt": "2026-03-01",
  "doi": null,
  "license": "CC-BY-4.0",
  "sourceRepo": "https://github.com/<org>/<repo>"
}
```

The DOI can be `null` for patch releases.
