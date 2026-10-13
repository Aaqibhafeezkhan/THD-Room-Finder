#!/usr/bin/env bash
# Build the upload bundle for the "THD Room Finder Design System" project on
# claude.ai/design from this repository. See design/system/README-SYNC.md.
#
#   bash design/build-ds-bundle.sh OUT_DIR
#
# The bundle is the design system (design/system/ minus repo-only files) plus
# the brief under brief/. Claude Design regenerates _ds_bundle.js,
# _ds_manifest.json and _adherence.oxlintrc.json itself, so they are never
# uploaded.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:?usage: build-ds-bundle.sh OUT_DIR}"

rm -rf "$OUT" && mkdir -p "$OUT"

(cd "$ROOT/design/system" && tar cf - \
  --exclude=README-SYNC.md \
  --exclude=_ds_bundle.js --exclude=_ds_manifest.json --exclude=_adherence.oxlintrc.json \
  .) | (cd "$OUT" && tar xf -)

mkdir -p "$OUT/brief"
cp "$ROOT"/design/brief/*.md "$OUT/brief/"

# Guard: preview-injected scripts must never be round-tripped back.
if grep -rl 'data-omelette-injected' "$OUT" >/dev/null 2>&1; then
  echo "error: preview-injected markup found in the bundle; strip it from design/system first" >&2
  exit 1
fi

find "$OUT" -type f | wc -l | xargs echo "files:"
du -sh "$OUT" | cut -f1 | xargs echo "size:"
