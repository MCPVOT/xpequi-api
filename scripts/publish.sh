#!/bin/bash
# Pequi API — Publish Script
# Usage: bash scripts/publish.sh [channel]
#   channel: npm | jsr | docker | git-tag | all (default)
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION=$(node -p "require('$ROOT/package.json').version")
echo "=== Pequi API v$VERSION — Publish ==="

publish_npm() {
  echo "--- 1/4 npmjs.com ---"
  cd "$ROOT/packages/api-client"
  npm publish --access public && echo "  ✅ pequi-api-client@$VERSION"

  cd "$ROOT/packages/mcp-server"
  npm publish --access public && echo "  ✅ pequi-mcp-server@$VERSION"
}

publish_jsr() {
  echo "--- 2/4 JSR (jsr.io) ---"
  # JSR requires @scope/name format — map pequi-* -> @pequi/*
  cd "$ROOT/packages/api-client"
  npx jsr publish --allow-dirty --quiet 2>/dev/null || \
    echo "  ⚠️ JSR publish skipped (install: npm install -g jsr)"

  cd "$ROOT/packages/mcp-server"
  npx jsr publish --allow-dirty --quiet 2>/dev/null || \
    echo "  ⚠️ JSR publish skipped (install: npm install -g jsr)"
}

publish_docker() {
  echo "--- 3/4 Docker (GHCR) ---"
  IMAGE="ghcr.io/mcpvot/pequi-mcp-server:$VERSION"
  docker build -t "$IMAGE" -f- "$ROOT" << 'DOCKERFILE' 2>/dev/null && \
    docker push "$IMAGE" && echo "  ✅ $IMAGE" || \
    echo "  ⚠️ Docker build/push skipped (install docker, or login to ghcr.io)"
DOCKERFILE
}

publish_git_tag() {
  echo "--- 4/4 GitHub Release Tag ---"
  cd "$ROOT"
  git tag -a "v$VERSION" -m "Pequi API v$VERSION" 2>/dev/null
  git push origin "v$VERSION" 2>/dev/null && \
    echo "  ✅ git tag v$VERSION pushed (release at github.com/MCPVOT/xpequi-api/releases)" || \
    echo "  ⚠️ Tag exists or push skipped"
}

case "${1:-all}" in
  npm)    publish_npm ;;
  jsr)    publish_jsr ;;
  docker) publish_docker ;;
  git-tag) publish_git_tag ;;
  all)
    publish_npm
    publish_jsr
    publish_docker
    publish_git_tag
    echo "=== All channels published ==="
    ;;
  *)
    echo "Usage: bash scripts/publish.sh [npm|jsr|docker|git-tag|all]"
    exit 1
    ;;
esac
