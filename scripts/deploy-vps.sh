#!/bin/sh
# Runs on the VPS as the forced command of the GitHub deploy key (see docs/deploy-cd.md).
# Input: the commit to deploy (from GitHub Actions, via SSH_ORIGINAL_COMMAND or $1).
# Deploys that commit of main, waits for the site, and rolls back to the previous commit if it does not come up.
set -eu

APP_DIR="${APP_DIR:-$HOME/SWP391-team-4}"
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.server.yml"
LOG="$HOME/deploy.log"

COMMIT="${SSH_ORIGINAL_COMMAND:-${1:-}}"
case "$COMMIT" in
  *[!0-9a-f]*|"") echo "Refusing: expected a commit hash, got '$COMMIT'" >&2; exit 2 ;;
esac
[ ${#COMMIT} -eq 40 ] || { echo "Refusing: commit hash must be 40 characters" >&2; exit 2; }

exec >>"$LOG" 2>&1
echo "=== $(date '+%F %T') deploy $COMMIT ==="
cd "$APP_DIR"
DOMAIN=$(sed -n 's/^DOMAIN=//p' .env | tail -1)

git fetch --quiet origin main
git merge-base --is-ancestor "$COMMIT" origin/main || { echo "Refusing: $COMMIT is not on main"; exit 3; }
PREVIOUS=$(git rev-parse HEAD)

healthy() {
  i=0
  while [ $i -lt 40 ]; do
    if curl -fsS --max-time 5 -o /dev/null --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/api/guest/packages"; then return 0; fi
    i=$((i + 1)); sleep 6
  done
  return 1
}

git checkout --quiet -B main "$COMMIT"
if $COMPOSE up -d --build && healthy; then
  docker image prune -f >/dev/null
  echo "OK: now running $COMMIT"
  exit 0
fi

echo "FAILED: rolling back to $PREVIOUS"
git checkout --quiet -B main "$PREVIOUS"
$COMPOSE up -d --build
exit 1
