#!/usr/bin/env bash
# Restores git configuration for this workspace.
#
# WHY THIS EXISTS: .git/config is excluded from the workspace snapshot, so the
# remote URL, user identity and hooks path are all lost between sessions even
# though the rest of .git/ survives. Run this after a fresh session:
#
#     bash scripts/git-setup.sh
#
# Credentials are deliberately NOT stored in .git/config. Pushing uses an
# env-based credential helper so the token never lands on disk or in argv.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REPO_URL="https://github.com/mahidhar-katari27/vercel-supabase-workspace.git"
GIT_NAME="mahidhar-katari27"
GIT_EMAIL="mahidharkatari2709@gmail.com"

if [[ ! -d .git ]]; then
  echo "→ no repository yet, initialising on branch main"
  git init -q -b main
fi

git config user.name  "$GIT_NAME"
git config user.email "$GIT_EMAIL"
git config core.autocrlf false

# Keep hooks inside the tracked tree so they survive a session boundary.
git config core.hooksPath scripts/githooks
chmod +x scripts/githooks/* 2>/dev/null || true

if git remote get-url origin >/dev/null 2>&1; then
  cur="$(git remote get-url origin)"
  [[ "$cur" == "$REPO_URL" ]] || git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

echo "  user   : $(git config user.name) <$(git config user.email)>"
echo "  remote : $(git remote get-url origin)"
echo "  hooks  : $(git config core.hooksPath)"
echo
echo "  ok. To push without storing the token:"
echo "    export GIT_TOKEN=ghp_..."
echo "    git -c credential.helper='\$ROOT/scripts/git-credential-env.sh' push"
echo "  or simply:  bash scripts/git-push.sh"
