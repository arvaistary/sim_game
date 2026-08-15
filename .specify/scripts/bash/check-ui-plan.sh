#!/usr/bin/env bash
# Section-A check of the ui-plan.md gate. Output: status + list of errors (or JSON with --json).
# Deterministic part of the gate only: cross-references of IDs + non-empty "Source" column.
# Semantic checks (derivation rule is truly deterministic, reference is truly a link) stay with the LLM/analyze.
set -euo pipefail

usage() {
  echo "usage: check-ui-plan.sh <ui-plan.md> [--json]" >&2
}

JSON=false
FILE=""
for arg in "$@"; do
  case "$arg" in
    --json) JSON=true ;;
    -h|--help) usage; exit 0 ;;
    *)
      if [[ -z "$FILE" ]]; then
        FILE="$arg"
      else
        usage
        exit 2
      fi
      ;;
  esac
done
[[ -n "$FILE" ]] || { usage; exit 2; }
[[ -f "$FILE" ]] || { echo "Error: file not found: $FILE" >&2; exit 2; }
ERRORS=()

ids()     { grep -oE "$1" "$FILE" | sort -u; }
json_escape() {
  local value=$1
  value=${value//\\/\\\\}
  value=${value//\"/\\\"}
  value=${value//$'\n'/\\n}
  value=${value//$'\r'/\\r}
  value=${value//$'\t'/\\t}
  printf '%s' "$value"
}
# Text of every section whose heading contains $1, up to the next heading of the SAME
# or higher level. Level-aware so a per-region "#### Region:" sub-heading (composite
# screens) does NOT prematurely close a "###" section — the whole region block is kept.
section() {
  awk -v h="$1" '
  {
    if ($0 ~ /^#+ /) {
      lvl = 0
      while (substr($0, lvl + 1, 1) == "#") lvl++
      if (on && lvl <= start) on = 0
      if (!on && $0 ~ ("^#+ .*" h)) { on = 1; start = lvl }
    }
    if (on) print
  }' "$FILE"
}

# 1. Each SCR-### from "Screen Overview" has a "## SCR-###:" section
for scr in $(section "Screen Overview" | grep -oE 'SCR-[0-9]{3}' | sort -u); do
  grep -qE "^## $scr:" "$FILE" || ERRORS+=("no section for $scr")
done
# 1b. Reverse: each "## SCR-###:" section is declared in "Screen Overview"
overview_scrs=$(section "Screen Overview" | grep -oE 'SCR-[0-9]{3}' | sort -u || true)
for scr in $(grep -oE '^## SCR-[0-9]{3}' "$FILE" | grep -oE 'SCR-[0-9]{3}' | sort -u); do
  printf '%s\n' "$overview_scrs" | grep -qx "$scr" || ERRORS+=("$scr: section not declared in Screen Overview")
done
# 2-5. Each ST-### appears in the component tree, test matrix, state model, design reference
for st in $(ids 'ST-[0-9]{3}'); do
  section "Component Tree"   | grep -q "$st" || ERRORS+=("$st: no branch in the component tree")
  section "Test Matrix"      | grep -q "$st" || ERRORS+=("$st: not in the test matrix")
  section "State Model"      | grep -q "$st" || ERRORS+=("$st: not derived from the state model")
  section "Design Reference" | grep -q "$st" || ERRORS+=("$st: no design reference")
done
# Each IX-### is in the test matrix
for ix in $(ids 'IX-[0-9]{3}'); do
  section "Test Matrix" | grep -q "$ix" || ERRORS+=("$ix: not in the test matrix")
done
# 6. Traceability: each ST-### definition row has a non-empty "Source" column
#    (3rd visible: | ID | State | Source | …). Reference validity is for the LLM/analyze.
while IFS= read -r line; do
  st=$(printf '%s' "$line" | grep -oE 'ST-[0-9]{3}')
  src=$(printf '%s' "$line" | awk -F'|' '{gsub(/^[ \t]+|[ \t]+$/,"",$4); print $4}')
  [[ -z "$src" || "$src" == "[...]" ]] && ERRORS+=("$st: empty Source")
done < <(grep -E '^\| ST-[0-9]{3} ' "$FILE")
# 7. No unresolved `[NEEDS CLARIFICATION` marker left ("Deferred Clarifications" must be empty).
#    Match the bracketed marker, not the bare words — so the template's own self-check line
#    ("design reference (link or NEEDS CLARIFICATION)") does not trip the gate on a faithful fill.
grep -qE '\[NEEDS CLARIFICATION' "$FILE" && ERRORS+=("NEEDS CLARIFICATION remains")
# Sequential uniqueness: an ST is DEFINED once (a repeated ST DEFINITION row in two
# state tables is caught as a duplicate among "| ST-###" definition rows)
while IFS= read -r dup; do
  [[ -n "$dup" ]] && ERRORS+=("duplicate definition: ${dup#| }")
done < <(grep -oE '^\| ST-[0-9]{3}' "$FILE" | sort | uniq -d || true)

if $JSON; then
  printf '{"STATUS":"%s","ERRORS":[' "$([[ ${#ERRORS[@]} -eq 0 ]] && echo PASS || echo FAIL)"
  for i in "${!ERRORS[@]}"; do [[ $i -gt 0 ]] && printf ','; printf '"%s"' "$(json_escape "${ERRORS[$i]}")"; done
  printf ']}\n'
else
  [[ ${#ERRORS[@]} -eq 0 ]] && echo "PASS" || { printf 'FAIL\n%s\n' "${ERRORS[@]/#/- }"; }
fi
[[ ${#ERRORS[@]} -eq 0 ]]
