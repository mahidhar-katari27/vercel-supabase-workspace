#!/usr/bin/env bash
# Push to origin using $GIT_TOKEN without ever storing it on disk.
#
#   export GIT_TOKEN=ghp_...      (or put it in .env.local and source it)
#   bash scripts/git-push.sh [git push args...]
#
# Runs the staged-secret scan first and refuses to push if it fails.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

[[ -f .env.local ]] && set -a && source .env.local && set +a
: "${GIT_TOKEN:?set GIT_TOKEN (a GitHub PAT with repo scope) before pushing}"

if [[ -n "$(git diff --cached --name-only)" ]]; then
  echo "→ staged changes detected, scanning for secrets first"
  node scripts/scan-staged-secrets.mjs || { echo "refusing to push"; exit 1; }
fi

exec git -c credential.helper="$ROOT/scripts/git-credential-env.sh" push "${@:--u origin main}"
