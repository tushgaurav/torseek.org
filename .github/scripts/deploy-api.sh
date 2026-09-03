#!/usr/bin/env bash
# Runs on the VM over ssh from .github/workflows/deploy-api.yml.
# Expects IMAGE, DEPLOY_PATH, GHCR_USER and GHCR_TOKEN in the environment.
set -euo pipefail

cd "$DEPLOY_PATH"

if [ ! -f .env ]; then
  echo "::error::$DEPLOY_PATH/.env is missing. Create it with JACKETT_API_KEY and CORS_ORIGIN (see README)." >&2
  exit 1
fi

# Persist the tag so `docker compose` runs outside CI (reboots, manual
# restarts) keep using the deployed image instead of falling back to a build.
if grep -q '^API_IMAGE=' .env; then
  sed -i "s|^API_IMAGE=.*|API_IMAGE=$IMAGE|" .env
else
  printf '\nAPI_IMAGE=%s\n' "$IMAGE" >> .env
fi

echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
trap 'docker logout ghcr.io >/dev/null 2>&1 || true' EXIT

docker compose --profile prod pull api
docker compose --profile prod up -d --no-build api

# The image HEALTHCHECK runs every 30s, so allow a couple of intervals.
status=starting
for _ in $(seq 1 40); do
  status=$(docker inspect --format '{{.State.Health.Status}}' torseek-api 2>/dev/null || echo starting)
  case "$status" in
    healthy|unhealthy) break ;;
  esac
  sleep 3
done

if [ "$status" != healthy ]; then
  echo "::error::torseek-api is '$status' after deploy" >&2
  docker compose --profile prod logs --no-color --tail=100 api
  exit 1
fi

echo "torseek-api is healthy on $IMAGE"

# Drop superseded api images so per-commit tags don't fill the disk.
docker image prune -af --filter "label=torseek.service=api" >/dev/null || true
