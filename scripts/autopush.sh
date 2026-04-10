#!/usr/bin/env bash
set -u

INTERVAL="${1:-600}"
BRANCH="$(git branch --show-current)"

while true; do
  git add -A
  if ! git diff --cached --quiet; then
    git commit -m "hackathon autosave $(date '+%Y-%m-%d %H:%M:%S')"
    git push origin "$BRANCH"
  fi
  sleep "$INTERVAL"
done
