#!/usr/bin/env bash
# Run every dashboard test. Exit non-zero if any file fails.
#
# The unit tests eval functions out of current.html. The contract test loads
# the whole page in a real browser. Both matter: the unit tests say a function
# is right, the contract test says the page a person opens is not missing a
# card. Three production incidents this season were invisible to the first
# kind and obvious to the second.
set -uo pipefail
cd "$(dirname "$0")/.."

fail=0
for f in tests/*.test.js; do
  if node "$f" > /tmp/dash-test-out.$$ 2>&1; then
    printf 'pass  %-40s %s\n' "$f" "$(grep -oE '[0-9]+ passed' /tmp/dash-test-out.$$ | tail -1)"
  else
    fail=$((fail + 1))
    printf 'FAIL  %s\n' "$f"
    cat /tmp/dash-test-out.$$
  fi
  rm -f /tmp/dash-test-out.$$
done

if [ "$fail" -ne 0 ]; then
  echo ""
  echo "$fail test file(s) failed"
  exit 1
fi
echo ""
echo "all test files passed"
