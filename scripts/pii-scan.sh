#!/usr/bin/env bash
# pii-scan — fails if this PUBLIC repo contains identity, infrastructure or
# credential material that must never be published.
#
# Why: the 2026-06-20 security sweep logged its own result by quoting the
# removed server IP verbatim, re-publishing it in this repo. A cleanup you
# describe is not a cleanup; a gate is.
#
# Scope: TRACKED files only (what a reader can clone), not .git internals.
# The scanner excludes itself and its workflow — a pattern searcher always
# matches its own literals.
#
# Usage: scripts/pii-scan.sh          exit 0 = clean, 1 = findings

set -uo pipefail

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT" || exit 1

SELF="scripts/pii-scan.sh"
WORKFLOW=".github/workflows/pii-guard.yml"

# Patterns are assembled from fragments so this file does not contain the very
# strings it forbids (otherwise it flags itself and the gate always fails).
PATTERNS=(
  'aldo728''@gmail\.com'                       # operator's personal address
  'tuta''mail\.com'                            # personal mailbox used in old commits
  'ghp_''[A-Za-z0-9]{20,}'                     # GitHub classic token
  'github_pat_''[A-Za-z0-9_]{20,}'             # GitHub fine-grained token
  'sk-''[A-Za-z0-9]{20,}'                      # OpenAI-style key
  'eyJ''[A-Za-z0-9_-]{30,}\.'                  # JWT-shaped secret
  'postgres(ql)?''://[^[:space:]"'"'"']+:[^[:space:]"'"'"']+@'   # DSN with credentials
  '100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])''\.[0-9]{1,3}\.[0-9]{1,3}'  # tailnet
  '161\.35\.''6\.94'                           # retired droplet IP
  'C:\\+''Users\\+[A-Za-z]'                    # local machine paths
)

FAIL=0
for pat in "${PATTERNS[@]}"; do
  hits=$(git grep -InE "$pat" -- . ":(exclude)$SELF" ":(exclude)$WORKFLOW" 2>/dev/null)
  if [ -n "$hits" ]; then
    echo "FAIL  pattern: $pat"
    printf '%s\n' "$hits" | head -5 | sed 's/^/      /'
    FAIL=1
  fi
done

# Commit identities: informational. History is immutable without a force-push,
# so a legacy address must not block every PR — but it should be visible.
echo "--- commit authors in history ---"
git log --all --format='%ae' | sort | uniq -c | sort -rn | sed 's/^/      /'

if [ "$FAIL" -ne 0 ]; then
  echo
  echo "PII/secret scan FAILED. Remove the material above before merging."
  exit 1
fi

echo
echo "PII/secret scan clean."
