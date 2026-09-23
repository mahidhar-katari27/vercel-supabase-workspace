#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Vercel deploy helper  ·  account: mahidharkatari2709-7801 (Hobby)
#
#   ./deploy.sh                     preview deploy of the current dir
#   ./deploy.sh --prod              production deploy
#   ./deploy.sh --prod ./app        production deploy of the ./app subdir
#   ./deploy.sh whoami              verify the token still works
#   ./deploy.sh projects            list existing Vercel projects
#   ./deploy.sh deploys             list recent deployments
#   ./deploy.sh link [project]      link cwd to a project (creates if new)
#   ./deploy.sh logs <url>          tail runtime logs of a deployment
#   ./deploy.sh inspect <url>       inspect a deployment
#   ./deploy.sh remove <url>        delete a deployment
#   ./deploy.sh raw <anything>      pass args straight through to the CLI
#   ./deploy.sh help                this text
#
# Token is read from ./.env.local  (VERCEL_TOKEN=...)
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$ROOT/.env.local"

# --- load token -------------------------------------------------------------
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "error: no VERCEL_TOKEN found." >&2
  echo "       create $ENV_FILE containing:  VERCEL_TOKEN=vcp_..." >&2
  exit 1
fi

# VERCEL_ORG_ID is a reserved CLI var: setting it without VERCEL_PROJECT_ID
# makes *every* command fail ("you forgot to specify VERCEL_PROJECT_ID").
# Drop it unless the pair is complete (i.e. deliberate CI-style pinning).
if [[ -n "${VERCEL_ORG_ID:-}" && -z "${VERCEL_PROJECT_ID:-}" ]]; then
  unset VERCEL_ORG_ID
fi

# --- make sure the CLI exists (node_modules is not persisted) ---------------
VERCEL_BIN="$ROOT/node_modules/.bin/vercel"
if [[ ! -x "$VERCEL_BIN" ]]; then
  echo "→ Vercel CLI missing, installing locally (one-time)..." >&2
  [[ -f "$ROOT/package.json" ]] || ( cd "$ROOT" && npm init -y >/dev/null )
  ( cd "$ROOT" && npm install vercel --silent --no-audit --no-fund )
fi
[[ -x "$VERCEL_BIN" ]] || { echo "error: failed to install vercel CLI" >&2; exit 1; }

export VERCEL_CLI_DISABLE_TELEMETRY=1

# Global flags must come AFTER the subcommand, otherwise `vercel whoami`
# is parsed as a deploy path.
vc() {
  local sub="$1"; shift
  local extra=()
  case "$sub" in
    deploy|link|remove|rm|pull) extra=(--yes) ;;
  esac
  "$VERCEL_BIN" "$sub" "${extra[@]}" "$@" --token "$VERCEL_TOKEN"
}

show_help() { sed -n '3,18p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; }

# --- dispatch ---------------------------------------------------------------
cmd="${1:-deploy}"

case "$cmd" in
  help|-h|--help)          show_help ;;
  whoami)                  shift; vc whoami "$@" ;;
  projects|list-projects)  shift; vc projects ls "$@" ;;
  deploys|deployments|ls)  shift; vc ls "$@" ;;
  link)                    shift; vc link "$@" ;;
  logs)                    shift; vc logs "$@" ;;
  inspect)                 shift; vc inspect "$@" ;;
  remove|rm)               shift; vc remove "$@" ;;
  env)                     shift; vc env "$@" ;;
  domains)                 shift; vc domains "$@" ;;
  raw)                     shift; vc "$@" ;;
  deploy|"")
    shift || true
    args=(); DEPLOY_DIR=""
    while [[ $# -gt 0 ]]; do
      case "$1" in
        -*) args+=("$1"); shift ;;
        *)  DEPLOY_DIR="$1"; shift ;;
      esac
    done
    target="${DEPLOY_DIR:-$(pwd)}"
    echo "→ deploying $target  [${args[*]:-preview}]"
    vc deploy "${args[@]}" ${DEPLOY_DIR:+"$DEPLOY_DIR"}
    ;;
  *)
    echo "→ passthrough: vercel $cmd $*"
    vc "$cmd" "$@"
    ;;
esac
