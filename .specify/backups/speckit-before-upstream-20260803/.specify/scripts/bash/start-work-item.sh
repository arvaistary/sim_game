#!/usr/bin/env bash

set -e

JSON_MODE=false
MODE="lite"
SHORT_NAME=""
WORK_ITEM_NUMBER=""
ARGS=()

escape_json() {
    local value="$1"
    value="${value//\\/\\\\}"
    value="${value//\"/\\\"}"
    value="${value//$'\n'/\\n}"
    value="${value//$'\r'/\\r}"
    value="${value//$'\t'/\\t}"
    printf '%s' "$value"
}

clean_branch_name() {
    local name="$1"
    echo "$name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\+/-/g' | sed 's/^-//' | sed 's/-$//'
}

get_highest_from_specs() {
    local specs_dir="$1"
    local highest=0

    if [ -d "$specs_dir" ]; then
        for dir in "$specs_dir"/*; do
            [ -d "$dir" ] || continue
            dirname=$(basename "$dir")
            number=$(echo "$dirname" | sed -n 's/^\([0-9][0-9]*\).*/\1/p')
            [ -n "$number" ] || continue
            number=$((10#$number))
            if [ "$number" -gt "$highest" ]; then
                highest=$number
            fi
        done
    fi

    echo "$highest"
}

generate_branch_name() {
    local description="$1"
    local stop_words="^(i|a|an|the|to|for|of|in|on|at|by|with|from|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|should|could|can|may|might|must|shall|this|that|these|those|my|your|our|their|want|need|add|get|set)$"
    local clean_name
    clean_name=$(echo "$description" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/ /g')
    local meaningful_words=()

    for word in $clean_name; do
        [ -z "$word" ] && continue
        if ! echo "$word" | grep -qiE "$stop_words"; then
            if [ ${#word} -ge 3 ]; then
                meaningful_words+=("$word")
            elif echo "$description" | grep -q "\b${word^^}\b"; then
                meaningful_words+=("$word")
            fi
        fi
    done

    if [ ${#meaningful_words[@]} -gt 0 ]; then
        local max_words=3
        if [ ${#meaningful_words[@]} -eq 4 ]; then max_words=4; fi

        local result=""
        local count=0
        for word in "${meaningful_words[@]}"; do
            if [ $count -ge $max_words ]; then break; fi
            if [ -n "$result" ]; then result="$result-"; fi
            result="${result}${word}"
            count=$((count + 1))
        done
        echo "$result"
    else
        local cleaned
        cleaned=$(clean_branch_name "$description")
        echo "$cleaned" | tr '-' '\n' | sed '/^$/d' | head -3 | tr '\n' '-' | sed 's/-$//'
    fi
}

find_repo_root() {
    local dir="$1"
    while [ "$dir" != "/" ]; do
        if [ -d "$dir/.git" ] || [ -d "$dir/.specify" ]; then
            echo "$dir"
            return 0
        fi
        dir="$(dirname "$dir")"
    done
    return 1
}

i=1
while [ $i -le $# ]; do
    arg="${!i}"
    case "$arg" in
        --json)
            JSON_MODE=true
            ;;
        --mode)
            if [ $((i + 1)) -gt $# ]; then
                echo 'Error: --mode requires a value' >&2
                exit 1
            fi
            i=$((i + 1))
            MODE="${!i}"
            ;;
        --short-name)
            if [ $((i + 1)) -gt $# ]; then
                echo 'Error: --short-name requires a value' >&2
                exit 1
            fi
            i=$((i + 1))
            SHORT_NAME="${!i}"
            ;;
        --number)
            if [ $((i + 1)) -gt $# ]; then
                echo 'Error: --number requires a value' >&2
                exit 1
            fi
            i=$((i + 1))
            WORK_ITEM_NUMBER="${!i}"
            ;;
        --help|-h)
            echo "Usage: $0 [--json] [--mode <lite|full>] [--short-name <name>] [--number N] <description>"
            echo ""
            echo "Options:"
            echo "  --json              Output in JSON format"
            echo "  --mode <mode>       Workflow mode: lite (default) or full"
            echo "  --short-name <name> Provide a custom short name"
            echo "  --number <N>        Specify work-item number manually"
            echo "  --help, -h          Show this help message"
            exit 0
            ;;
        *)
            ARGS+=("$arg")
            ;;
    esac
    i=$((i + 1))
done

DESCRIPTION="${ARGS[*]}"
if [ -z "$DESCRIPTION" ]; then
    echo "Usage: $0 [--json] [--mode <lite|full>] [--short-name <name>] [--number N] <description>" >&2
    exit 1
fi

if [ "$MODE" != "lite" ] && [ "$MODE" != "full" ]; then
    echo "Error: --mode must be either 'lite' or 'full'" >&2
    exit 1
fi

if [ -n "$WORK_ITEM_NUMBER" ] && ! [[ "$WORK_ITEM_NUMBER" =~ ^[0-9]+$ ]]; then
    echo "Error: --number must be a positive integer" >&2
    exit 1
fi

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(find_repo_root "$SCRIPT_DIR")"
if [ -z "$REPO_ROOT" ]; then
    echo "Error: Could not determine repository root." >&2
    exit 1
fi
cd "$REPO_ROOT"

SPECS_DIR="$REPO_ROOT/specs"
mkdir -p "$SPECS_DIR"

if [ -n "$SHORT_NAME" ]; then
    SUFFIX=$(clean_branch_name "$SHORT_NAME")
else
    SUFFIX=$(generate_branch_name "$DESCRIPTION")
fi

if [ -z "$SUFFIX" ]; then
    echo "Error: Could not generate a valid short name." >&2
    exit 1
fi

if [ -z "$WORK_ITEM_NUMBER" ]; then
    HIGHEST=$(get_highest_from_specs "$SPECS_DIR")
    WORK_ITEM_NUMBER=$((HIGHEST + 1))
fi

FEATURE_NUM=$(printf "%03d" "$((10#$WORK_ITEM_NUMBER))")
WORK_ITEM_NAME="${FEATURE_NUM}-${SUFFIX}"
WORK_ITEM_DIR="$SPECS_DIR/$WORK_ITEM_NAME"
mkdir -p "$WORK_ITEM_DIR"

if [ "$MODE" = "full" ]; then
    TEMPLATE="$REPO_ROOT/.specify/templates/spec-template.md"
    SPEC_FILE="$WORK_ITEM_DIR/spec.md"
    if [ -f "$TEMPLATE" ]; then
        cp "$TEMPLATE" "$SPEC_FILE"
    elif [ ! -f "$SPEC_FILE" ]; then
        touch "$SPEC_FILE"
    fi
fi

ACTIVE_STATE_FILE="$REPO_ROOT/.specify/.active-work-item.json"
CREATED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
RELATIVE_PATH="specs/$WORK_ITEM_NAME/"
mkdir -p "$(dirname "$ACTIVE_STATE_FILE")"

cat > "$ACTIVE_STATE_FILE" <<EOF
{
  "name": "$(escape_json "$WORK_ITEM_NAME")",
  "path": "$(escape_json "$RELATIVE_PATH")",
  "mode": "$(escape_json "$MODE")",
  "description": "$(escape_json "$DESCRIPTION")",
  "created": "$(escape_json "$CREATED_AT")"
}
EOF

if $JSON_MODE; then
    printf '{"WORK_ITEM_NAME":"%s","WORK_ITEM_DIR":"%s","MODE":"%s"}\n' \
        "$WORK_ITEM_NAME" "$WORK_ITEM_DIR" "$MODE"
else
    echo "WORK_ITEM_NAME: $WORK_ITEM_NAME"
    echo "WORK_ITEM_DIR: $WORK_ITEM_DIR"
    echo "MODE: $MODE"
    echo "ACTIVE_STATE: $ACTIVE_STATE_FILE"
fi
