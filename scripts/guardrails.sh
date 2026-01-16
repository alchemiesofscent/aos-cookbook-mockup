#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "guardrails: $1" >&2
  exit 1
}

# 1) Bundled seed must not reappear.
if [[ -f "src/seed.json" ]]; then
  fail "src/seed.json exists (bundled seed is disallowed; runtime seed must be public/data/seed.json)"
fi

if grep -R -n -- "@seed.json" src tsconfig.json vite.config.ts >/dev/null 2>&1; then
  fail "@seed.json alias/import found (bundled seed is disallowed)"
fi

# 2) No backups under public/.
if [[ -d "public/data/backup" ]]; then
  fail "public/data/backup exists (public backups are disallowed)"
fi

if find public -path "*/data/backup*" -print -quit | grep -q .; then
  fail "a public data backup directory exists under public/ (disallowed)"
fi

echo "guardrails: OK"

