#!/bin/bash
# Deploy Loop Engineer cron jobs to Hermes Agent
# Run from: C:\Users\Organix\pequi

set -euo pipefail

LOOPS_FILE="loop-engineer/loops.json"
HERMES_CMD="hermes"

echo "📋 Reading loop config from $LOOPS_FILE..."

# Parse JSON and create cron jobs
jq -c '.loops[]' "$LOOPS_FILE" | while IFS= read -r loop; do
    name=$(echo "$loop" | jq -r '.name')
    schedule=$(echo "$loop" | jq -r '.schedule')
    prompt=$(echo "$loop" | jq -r '.prompt')
    skills=$(echo "$loop" | jq -c '.skills')
    toolsets=$(echo "$loop" | jq -c '.toolsets')
    workdir=$(echo "$loop" | jq -r '.workdir')

    echo "🔧 Creating cron job: $name ($schedule)"

    $HERMES_CMD cron create \
        --name "$name" \
        --schedule "$schedule" \
        --prompt "$prompt" \
        --skills "$skills" \
        --enabled-toolsets "$toolsets" \
        --workdir "$workdir" \
        --deliver origin

    echo "✅ Created: $name"
done

echo ""
echo "📋 Current cron jobs:"
$HERMES_CMD cron list

echo ""
echo "🎯 To run a loop manually:"
echo "  hermes cron run --name support-triage"
echo ""
echo "📊 To check artifacts after run:"
echo "  ls loop-engineer/artifacts/signals/"
echo "  ls loop-engineer/artifacts/tickets/"
echo "  ls loop-engineer/artifacts/tasks/"