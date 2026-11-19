#!/usr/bin/env bash
# সোনারহরিণ (Sonarhorin) — macOS: double-click this file in Finder to start everything.
# (All logic lives in start.sh so the two never drift apart.)
cd "$(dirname "$0")" || exit 1
bash ./start.sh "$@"
status=$?
[ $status -ne 0 ] && read -r -p "Press Enter to close"
exit $status
