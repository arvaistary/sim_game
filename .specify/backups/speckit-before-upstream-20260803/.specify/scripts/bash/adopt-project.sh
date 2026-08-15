#!/usr/bin/env bash

set -e

JSON_MODE=false
FORCE=false

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

usage() {
    echo "Usage: $0 [--json] [--force]"
    echo ""
    echo "Options:"
    echo "  --json      Output JSON summary"
    echo "  --force     Overwrite non-constitution files"
    echo "  --help, -h  Show help"
}

escape_json() {
    local value="$1"
    value="${value//\\/\\\\}"
    value="${value//\"/\\\"}"
    value="${value//$'\n'/\\n}"
    value="${value//$'\r'/\\r}"
    value="${value//$'\t'/\\t}"
    printf '%s' "$value"
}

while [ $# -gt 0 ]; do
    case "$1" in
        --json)
            JSON_MODE=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            echo "Error: Unknown option '$1'" >&2
            usage >&2
            exit 1
            ;;
    esac
done

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(find_repo_root "$SCRIPT_DIR")"
if [ -z "$REPO_ROOT" ]; then
    echo "Error: Could not determine repository root." >&2
    exit 1
fi
cd "$REPO_ROOT"

TEMPLATES_DIR="$REPO_ROOT/.specify/templates"
MEMORY_DIR="$REPO_ROOT/.specify/memory"
ARCH_DIR="$MEMORY_DIR/architecture"
ADR_DIR="$ARCH_DIR/adr"
DEV_DIR="$MEMORY_DIR/development"

mkdir -p "$MEMORY_DIR" "$ARCH_DIR" "$ADR_DIR" "$DEV_DIR"

declare -a FILES_CREATED=()
declare -a FILES_SKIPPED=()
CONSTITUTION_STATUS="preserved"

copy_template() {
    local source="$1"
    local target="$2"
    local rel="$3"
    local force_allowed="$4"

    if [ ! -f "$source" ]; then
        echo "Error: Missing template file: $source" >&2
        exit 1
    fi

    if [ -f "$target" ]; then
        if [ "$force_allowed" = "true" ] && [ "$FORCE" = true ]; then
            cp "$source" "$target"
            FILES_CREATED+=("$rel")
        else
            FILES_SKIPPED+=("$rel")
        fi
    else
        cp "$source" "$target"
        FILES_CREATED+=("$rel")
    fi
}

copy_template "$TEMPLATES_DIR/memory-context.md" "$MEMORY_DIR/context.md" "context.md" "true"
copy_template "$TEMPLATES_DIR/memory-architecture.md" "$ARCH_DIR/overview.md" "architecture/overview.md" "true"
copy_template "$TEMPLATES_DIR/memory-tech-stack.md" "$ARCH_DIR/tech-stack.md" "architecture/tech-stack.md" "true"
copy_template "$TEMPLATES_DIR/memory-data-flow.md" "$ARCH_DIR/data-flow.md" "architecture/data-flow.md" "true"
copy_template "$TEMPLATES_DIR/memory-adr-readme.md" "$ADR_DIR/README.md" "architecture/adr/README.md" "true"
copy_template "$TEMPLATES_DIR/memory-code-style.md" "$DEV_DIR/code-style.md" "development/code-style.md" "true"

CONSTITUTION_TEMPLATE="$TEMPLATES_DIR/constitution-template.md"
CONSTITUTION_TARGET="$MEMORY_DIR/constitution.md"
if [ -f "$CONSTITUTION_TARGET" ]; then
    FILES_SKIPPED+=("constitution.md")
    CONSTITUTION_STATUS="preserved"
else
    if [ ! -f "$CONSTITUTION_TEMPLATE" ]; then
        echo "Error: Missing constitution template file: $CONSTITUTION_TEMPLATE" >&2
        exit 1
    fi
    cp "$CONSTITUTION_TEMPLATE" "$CONSTITUTION_TARGET"
    FILES_CREATED+=("constitution.md")
    CONSTITUTION_STATUS="created"
fi

if $JSON_MODE; then
    created_json=""
    for file in "${FILES_CREATED[@]}"; do
        created_json="${created_json}\"$(escape_json "$file")\","
    done
    created_json="[${created_json%,}]"
    if [ "$created_json" = "[]" ]; then
        created_json="[]"
    fi

    skipped_json=""
    for file in "${FILES_SKIPPED[@]}"; do
        skipped_json="${skipped_json}\"$(escape_json "$file")\","
    done
    skipped_json="[${skipped_json%,}]"
    if [ "$skipped_json" = "[]" ]; then
        skipped_json="[]"
    fi

    printf '{"REPO_ROOT":"%s","FILES_CREATED":%s,"FILES_SKIPPED":%s,"CONSTITUTION_STATUS":"%s"}\n' \
        "$(escape_json "$REPO_ROOT")" "$created_json" "$skipped_json" "$(escape_json "$CONSTITUTION_STATUS")"
else
    echo "REPO_ROOT: $REPO_ROOT"
    echo "FILES_CREATED:"
    if [ ${#FILES_CREATED[@]} -eq 0 ]; then
        echo "  (none)"
    else
        for file in "${FILES_CREATED[@]}"; do
            echo "  - $file"
        done
    fi
    echo "FILES_SKIPPED:"
    if [ ${#FILES_SKIPPED[@]} -eq 0 ]; then
        echo "  (none)"
    else
        for file in "${FILES_SKIPPED[@]}"; do
            echo "  - $file"
        done
    fi
    echo "CONSTITUTION_STATUS: $CONSTITUTION_STATUS"
fi
