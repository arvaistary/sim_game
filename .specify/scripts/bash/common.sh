#!/usr/bin/env bash
# Common functions and variables for all scripts

# Get repository root, with fallback for non-git repositories
get_repo_root() {
    if git rev-parse --show-toplevel >/dev/null 2>&1; then
        git rev-parse --show-toplevel
    else
        # Fall back to script location for non-git repos
        local script_dir="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
        (cd "$script_dir/../../.." && pwd)
    fi
}

# Get current branch, with fallback for non-git repositories
get_current_branch() {
    # First check if SPECIFY_FEATURE environment variable is set
    if [[ -n "${SPECIFY_FEATURE:-}" ]]; then
        echo "$SPECIFY_FEATURE"
        return
    fi

    # Then check git if available
    if git rev-parse --abbrev-ref HEAD >/dev/null 2>&1; then
        git rev-parse --abbrev-ref HEAD
        return
    fi

    # For non-git repos, try to find the latest feature directory
    local repo_root=$(get_repo_root)
    local specs_dir="$repo_root/specs"

    if [[ -d "$specs_dir" ]]; then
        local latest_feature=""
        local highest=0

        for dir in "$specs_dir"/*; do
            if [[ -d "$dir" ]]; then
                local dirname=$(basename "$dir")
                if [[ "$dirname" =~ ^([0-9]{3})- ]]; then
                    local number=${BASH_REMATCH[1]}
                    number=$((10#$number))
                    if [[ "$number" -gt "$highest" ]]; then
                        highest=$number
                        latest_feature=$dirname
                    fi
                fi
            fi
        done

        if [[ -n "$latest_feature" ]]; then
            echo "$latest_feature"
            return
        fi
    fi

    echo "main"  # Final fallback
}

# Check if we have git available
has_git() {
    git rev-parse --show-toplevel >/dev/null 2>&1
}

check_feature_branch() {
    local branch="$1"
    local has_git_repo="$2"

    # Branch naming is not enforced in this fork - any branch name is accepted.
    # Emit an informational note when the branch doesn't follow the NNN- convention
    # so users are aware, but never block execution.
    if [[ "$has_git_repo" == "true" && ! "$branch" =~ ^[0-9]{3}- ]]; then
        echo "[specify] Note: Branch '$branch' does not follow the NNN-feature-name convention; continuing anyway." >&2
    fi

    return 0
}

get_feature_dir() { echo "$1/specs/$2"; }

get_active_state_file() {
    local repo_root="$1"
    echo "$repo_root/.specify/.active-work-item.json"
}

emit_feature_path_exports() {
    local repo_root="$1"
    local current_branch="$2"
    local has_git_repo="$3"
    local feature_dir="$4"

    cat <<EOF
REPO_ROOT='$repo_root'
CURRENT_BRANCH='$current_branch'
HAS_GIT='$has_git_repo'
FEATURE_DIR='$feature_dir'
FEATURE_SPEC='$feature_dir/spec.md'
IMPL_PLAN='$feature_dir/plan.md'
TASKS='$feature_dir/tasks.md'
RESEARCH='$feature_dir/research.md'
DATA_MODEL='$feature_dir/data-model.md'
QUICKSTART='$feature_dir/quickstart.md'
CONTRACTS_DIR='$feature_dir/contracts'
EOF
}

warn_active_work_item_fallback() {
    local reason="$1"
    echo "[specify] Warning: Active work-item state $reason; falling back to branch-based resolution." >&2
}

active_work_item_is_suitable() {
    local current_branch="$1"
    local active_name="$2"
    local feature_dir="$3"

    # This fork may extend suitability checks in the future. The default behavior
    # accepts any existing active work item so setup-plan can prefer durable state.
    [[ -n "$feature_dir" ]] || return 1
    return 0
}

get_active_feature_paths() {
    local repo_root=$(get_repo_root)
    local current_branch=$(get_current_branch)
    local has_git_repo="false"
    local active_state_file
    local active_name=""
    local active_path=""
    local feature_dir=""

    if has_git; then
        has_git_repo="true"
    fi

    active_state_file=$(get_active_state_file "$repo_root")

    if [[ ! -f "$active_state_file" ]]; then
        warn_active_work_item_fallback "was not found at $active_state_file"
        return 1
    fi

    active_name=$(sed -n 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$active_state_file" | head -1)
    active_path=$(sed -n 's/.*"path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$active_state_file" | head -1)

    if [[ -n "$active_path" ]]; then
        active_path=$(printf '%s' "$active_path" | sed 's:/*$::')

        if [[ "$active_path" = /* ]]; then
            warn_active_work_item_fallback "contains an absolute path"
            return 1
        fi

        feature_dir="$repo_root/$active_path"
    elif [[ -n "$active_name" ]]; then
        feature_dir="$repo_root/specs/$active_name"
    else
        warn_active_work_item_fallback "is malformed"
        return 1
    fi

    if [[ ! -d "$feature_dir" ]]; then
        warn_active_work_item_fallback "points to a nonexistent directory ($feature_dir)"
        return 1
    fi

    if ! active_work_item_is_suitable "$current_branch" "$active_name" "$feature_dir"; then
        warn_active_work_item_fallback "is not suitable for the current task"
        return 1
    fi

    emit_feature_path_exports "$repo_root" "$current_branch" "$has_git_repo" "$feature_dir"
}

# Find feature directory by numeric prefix instead of exact branch match
# This allows multiple branches to work on the same spec (e.g., 004-fix-bug, 004-add-feature)
find_feature_dir_by_prefix() {
    local repo_root="$1"
    local branch_name="$2"
    local specs_dir="$repo_root/specs"

    # Extract numeric prefix from branch (e.g., "004" from "004-whatever")
    if [[ ! "$branch_name" =~ ^([0-9]{3})- ]]; then
        # If branch doesn't have numeric prefix, fall back to exact match
        echo "$specs_dir/$branch_name"
        return
    fi

    local prefix="${BASH_REMATCH[1]}"

    # Search for directories in specs/ that start with this prefix
    local matches=()
    if [[ -d "$specs_dir" ]]; then
        for dir in "$specs_dir"/"$prefix"-*; do
            if [[ -d "$dir" ]]; then
                matches+=("$(basename "$dir")")
            fi
        done
    fi

    # Handle results
    if [[ ${#matches[@]} -eq 0 ]]; then
        # No match found - return the branch name path (will fail later with clear error)
        echo "$specs_dir/$branch_name"
    elif [[ ${#matches[@]} -eq 1 ]]; then
        # Exactly one match - perfect!
        echo "$specs_dir/${matches[0]}"
    else
        # Multiple matches - this shouldn't happen with proper naming convention
        echo "ERROR: Multiple spec directories found with prefix '$prefix': ${matches[*]}" >&2
        echo "Please ensure only one spec directory exists per numeric prefix." >&2
        echo "$specs_dir/$branch_name"  # Return something to avoid breaking the script
    fi
}

get_feature_paths() {
    local repo_root=$(get_repo_root)
    local current_branch=$(get_current_branch)
    local has_git_repo="false"

    if has_git; then
        has_git_repo="true"
    fi

    # Use prefix-based lookup to support multiple branches per spec
    local feature_dir=$(find_feature_dir_by_prefix "$repo_root" "$current_branch")

    emit_feature_path_exports "$repo_root" "$current_branch" "$has_git_repo" "$feature_dir"
}

check_file() { [[ -f "$1" ]] && echo "  ✓ $2" || echo "  ✗ $2"; }
check_dir() { [[ -d "$1" && -n $(ls -A "$1" 2>/dev/null) ]] && echo "  ✓ $2" || echo "  ✗ $2"; }
