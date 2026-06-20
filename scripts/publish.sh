#!/bin/bash
# Pequi API — Publish Script (Multi-Channel)
# Usage: bash scripts/publish.sh [channel]
#   channel: npm | jsr | docker | ipfs | git-tag | all (default)
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION=$(node -p "require('$ROOT/package.json').version")
echo "=== Pequi API v$VERSION — Publish ==="

publish_npm() {
  echo "--- 1/5 npmjs.com ---"
  cd "$ROOT/packages/api-client"
  npm publish --access public && echo "  ✅ pequi-api-client@$VERSION"

  cd "$ROOT/packages/mcp-server"
  npm publish --access public && echo "  ✅ pequi-mcp-server@$VERSION"
}

publish_jsr() {
  echo "--- 2/5 JSR (jsr.io) ---"
  cd "$ROOT/packages/api-client"
  npx jsr publish --allow-dirty --quiet 2>/dev/null || echo "  ⚠️ Install: npm install -g jsr"
  cd "$ROOT/packages/mcp-server"
  npx jsr publish --allow-dirty --quiet 2>/dev/null || echo "  ⚠️ Install: npm install -g jsr"
}

publish_docker() {
  echo "--- 3/5 Docker (GHCR) ---"
  IMAGE="ghcr.io/mcpvot/pequi-mcp-server:$VERSION"
  docker build -t "$IMAGE" "$ROOT" 2>/dev/null && docker push "$IMAGE" && echo "  ✅ $IMAGE" || \
    echo "  ⚠️ Docker build/push skipped"
}

publish_ipfs() {
  echo "--- 4/5 IPFS (backup) ---"
  local TAR="/tmp/pequi-mcp-server-v$VERSION.tar.gz"
  cd "$ROOT/packages/mcp-server"
  tar czf "$TAR" dist/ package.json README.md 2>/dev/null || { echo "  ⚠️ Build dist/ first"; return; }
  CID=$(ipfs add -q "$TAR" 2>/dev/null | tail -1)
  if [ -n "$CID" ]; then
    ipfs pin add "$CID" 2>/dev/null
    echo "  ✅ IPFS CID: $CID"
    echo "  📦 ipfs.io: https://ipfs.io/ipfs/$CID"
    echo "  📦 cloudflare: https://cloudflare-ipfs.com/ipfs/$CID"
  else
    echo "  ⚠️ IPFS add failed"
  fi
  rm -f "$TAR"
}

publish_git_tag() {
  echo "--- 5/5 GitHub Release Tag ---"
  cd "$ROOT"
  git tag -a "v$VERSION" -m "Pequi API v$VERSION" 2>/dev/null
  git push origin "v$VERSION" 2>/dev/null && echo "  ✅ v$VERSION pushed" || echo "  ⚠️ Tag exists"
}

case "${1:-all}" in
  npm)     publish_npm ;;
  jsr)     publish_jsr ;;
  docker)  publish_docker ;;
  ipfs)    publish_ipfs ;;
  git-tag) publish_git_tag ;;
  all)
    publish_npm
    publish_jsr
    publish_docker
    publish_ipfs
    publish_git_tag
    echo "=== All channels published ==="
    ;;
  *)
    echo "Usage: bash scripts/publish.sh [npm|jsr|docker|ipfs|git-tag|all]"
    exit 1
    ;;
esac
