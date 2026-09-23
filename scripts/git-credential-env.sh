#!/usr/bin/env bash
# Git credential helper that reads the token from $GIT_TOKEN.
# The token is never written to .git/config and never appears in argv.
#
#   export GIT_TOKEN=ghp_...
#   git -c credential.helper="$PWD/scripts/git-credential-env.sh" push
case "$1" in
  get)
    if [[ -z "${GIT_TOKEN:-}" ]]; then
      echo "git-credential-env: GIT_TOKEN is not set" >&2
      exit 1
    fi
    echo "username=x-access-token"
    echo "password=$GIT_TOKEN"
    ;;
  store|erase) ;;   # deliberately a no-op — never persist credentials
esac
