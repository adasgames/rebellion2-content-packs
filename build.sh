#!/usr/bin/env bash
set -euo pipefail

command_name="${1:-all}"
if [[ "$command_name" != "all" && "$command_name" != "lint" && "$command_name" != "test" ]]; then
  echo "Usage: ./build.sh [all|lint|test]" >&2
  exit 1
fi

run_tests() {
  npm test
}

run_lint() {
  git lfs fsck --pointers
  npm run lint

  find Content -type f -name '*.xml' -print0 | xargs -0 xmllint --noout

  oversized=0
  while IFS= read -r -d '' entry; do
    metadata="${entry%%$'\t'*}"
    tracked_path="${entry#*$'\t'}"
    blob_size="${metadata##* }"
    if [[ "$blob_size" -gt 1048576 ]]; then
      lfs_filter="$(git check-attr filter -- "$tracked_path")"
      if [[ "${lfs_filter##*: }" != "lfs" ]]; then
        echo "FAIL: $tracked_path is a $blob_size-byte Git blob and is not managed by LFS." >&2
        oversized=1
      fi
    fi
  done < <(git ls-tree -r -l -z HEAD)
  [[ "$oversized" -eq 0 ]]
}

if [[ "$command_name" == "all" || "$command_name" == "test" ]]; then run_tests; fi
if [[ "$command_name" == "all" || "$command_name" == "lint" ]]; then run_lint; fi
