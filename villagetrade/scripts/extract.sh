#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Extract VillageTrade into its own repository.
#
# While VillageTrade lives inside the Wiser Generations repository, a Next
# build run from here walks UP and compiles the parent's middleware into
# VillageTrade's edge bundle. `middleware.ts` exists only to shadow that.
# Extraction removes the cause, so this script deletes the shim.
#
#   bash scripts/extract.sh ~/villagetrade
#
# Then, once: create an EMPTY private repo on GitHub and
#   cd ~/villagetrade
#   git remote add origin git@github.com:<owner>/villagetrade.git
#   git push -u origin main
# ---------------------------------------------------------------------------
set -euo pipefail

DEST="${1:?usage: extract.sh <destination-path>}"
SRC="$(cd "$(dirname "$0")/.." && pwd)"

[ -e "$DEST" ] && { echo "refusing: $DEST already exists"; exit 1; }

mkdir -p "$DEST"
cp -r "$SRC"/. "$DEST"/
cd "$DEST"

rm -rf .next node_modules
# The cohabitation shim. Unnecessary once this is its own repository, and a
# build here proves it: the middleware manifest comes out empty.
rm -f middleware.ts scripts/extract.sh
rmdir scripts 2>/dev/null || true

git init -q -b main
git add -A
git commit -q -m "VillageTrade — initial import

Extracted from the Wiser Generations repository, where it was developed in a
subdirectory during Phase 2A. Nothing here imports from that project."

echo "Extracted to $DEST"
echo
echo "Verify independence:"
echo "  cd $DEST && npm install && npx vitest run && npx next build"
echo
echo "Expect: 66 tests passing, and \"middleware\": {} in"
echo "  .next/server/middleware-manifest.json"
