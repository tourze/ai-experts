#!/usr/bin/env bash
# Brutal Honesty Code Assessment Script (Linus Mode)

set -euo pipefail

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "🔥 BRUTAL HONESTY CODE ASSESSMENT (Linus Mode)"
echo "================================================"
echo ""

# Check if file argument provided
if [ "${1:-}" = "" ]; then
    echo "Usage: $0 <file-or-directory>"
    exit 1
fi

TARGET="$1"

if [ ! -e "$TARGET" ]; then
    echo -e "${RED}🔴 FAILING: Target '$TARGET' does not exist${NC}"
    exit 1
fi

resolve_path() {
    local target="$1"
    if [ -d "$target" ]; then
        (cd "$target" && pwd)
    else
        (cd "$(dirname "$target")" && printf '%s/%s\n' "$(pwd)" "$(basename "$target")")
    fi
}

find_project_root() {
    local current="$1"

    if [ -f "$current" ]; then
        current="$(dirname "$current")"
    fi

    while true; do
        for marker in package.json pyproject.toml go.mod Cargo.toml composer.json Gemfile; do
            if [ -f "$current/$marker" ]; then
                printf '%s\n' "$current"
                return
            fi
        done

        if [ -d "$current/tests" ] || [ -d "$current/test" ] || [ -d "$current/__tests__" ]; then
            printf '%s\n' "$current"
            return
        fi

        if [ "$current" = "/" ]; then
            printf '%s\n' "$(pwd)"
            return
        fi

        current="$(dirname "$current")"
    done
}

TARGET_PATH="$(resolve_path "$TARGET")"
PROJECT_ROOT="$(find_project_root "$TARGET_PATH")"

# Function to assess correctness
assess_correctness() {
    echo "📊 CORRECTNESS CHECK"
    echo "-------------------"

    # Check for common bug patterns
    if grep -R -E "TODO|FIXME|BUG|HACK" "$TARGET_PATH" 2>/dev/null; then
        echo -e "${RED}🔴 FAILING: Found TODO/FIXME/BUG/HACK comments${NC}"
        echo "   → This code admits it's broken. Fix it before review."
        return 0
    fi

    # Check for error-prone patterns
    if grep -R -E "null|undefined" "$TARGET_PATH" 2>/dev/null | grep -v "!== null" | grep -v "!== undefined" > /dev/null; then
        echo -e "${YELLOW}🟡 WARNING: Potential null/undefined issues${NC}"
        echo "   → Are you handling null cases properly?"
    fi

    echo -e "${GREEN}✓ No obvious correctness issues${NC}"
}

# Function to assess performance
assess_performance() {
    echo ""
    echo "⚡ PERFORMANCE CHECK"
    echo "-------------------"

    # Check for nested loops (potential O(n²))
    nested_loops=$( (grep -R -E "for[[:space:]]*\\(.*\\)[[:space:]]*\\{|for[[:space:]]+.*in[[:space:]]|for[[:space:]]+.*of[[:space:]]" "$TARGET_PATH" 2>/dev/null || true) | wc -l | tr -d ' ' )
    if [ "$nested_loops" -gt 5 ]; then
        echo -e "${RED}🔴 FAILING: Found $nested_loops loops${NC}"
        echo "   → Are you creating O(n²) complexity where O(n) exists?"
        echo "   → Use hash maps, sets, or better algorithms."
    fi

    # Check for synchronous I/O in hot paths
    if grep -R -E "readFileSync|writeFileSync" "$TARGET_PATH" 2>/dev/null; then
        echo -e "${RED}🔴 FAILING: Synchronous file I/O detected${NC}"
        echo "   → You're blocking the event loop. Use async operations."
    fi

    echo -e "${GREEN}✓ No obvious performance issues${NC}"
}

# Function to assess error handling
assess_error_handling() {
    echo ""
    echo "🛡️  ERROR HANDLING CHECK"
    echo "----------------------"

    # Check for try/catch usage
    try_count=$( (grep -R -E "try|catch" "$TARGET_PATH" 2>/dev/null || true) | wc -l | tr -d ' ' )
    if [ "$try_count" -eq 0 ]; then
        echo -e "${RED}🔴 FAILING: No error handling found${NC}"
        echo "   → What happens when this code fails? It crashes."
    else
        echo -e "${GREEN}✓ Found error handling (verify it's sufficient)${NC}"
    fi

    # Check for empty catch blocks
    if grep -R -E "catch[[:space:]]*\\([^)]*\\)[[:space:]]*\\{[[:space:]]*\\}" "$TARGET_PATH" 2>/dev/null > /dev/null; then
        echo -e "${RED}🔴 FAILING: Empty catch blocks detected${NC}"
        echo "   → Swallowing errors silently is worse than crashing."
    fi
}

# Function to assess concurrency
assess_concurrency() {
    echo ""
    echo "🔀 CONCURRENCY CHECK"
    echo "-------------------"

    # Check for global state mutations
    if grep -R -E "global\\.|window\\." "$TARGET_PATH" 2>/dev/null; then
        echo -e "${YELLOW}🟡 WARNING: Global state mutations detected${NC}"
        echo "   → Are you handling concurrent access safely?"
    fi

    # Check for race condition patterns
    if grep -R -E "setTimeout|setInterval" "$TARGET_PATH" 2>/dev/null; then
        echo -e "${YELLOW}🟡 WARNING: Timing-based code detected${NC}"
        echo "   → Are you creating race conditions?"
    fi

    echo -e "${GREEN}✓ Review concurrency manually${NC}"
}

# Function to assess testability
assess_testability() {
    echo ""
    echo "🧪 TESTABILITY CHECK"
    echo "-------------------"

    # Check if tests exist
    if [ -d "$PROJECT_ROOT/tests" ] || [ -d "$PROJECT_ROOT/test" ] || [ -d "$PROJECT_ROOT/__tests__" ]; then
        echo -e "${GREEN}✓ Test directory exists${NC}"
    else
        echo -e "${RED}🔴 FAILING: No test directory found${NC}"
        echo "   → Where are the tests? Did you even test this?"
    fi

    # Check for dependency injection
    if grep -R -E "new[[:space:]]+[A-Za-z_][A-Za-z0-9_]*\\(" "$TARGET_PATH" 2>/dev/null | grep -v "Error" | grep -v "Date" > /dev/null; then
        echo -e "${YELLOW}🟡 WARNING: Hard-coded dependencies detected${NC}"
        echo "   → Use dependency injection for testability."
    fi
}

# Function to assess maintainability
assess_maintainability() {
    echo ""
    echo "🔧 MAINTAINABILITY CHECK"
    echo "-----------------------"

    # Check function length (should be <50 lines)
    if [ -f "$TARGET_PATH" ]; then
        long_functions=$(awk '
            /^[[:space:]]*(async[[:space:]]+)?function[[:space:]]+[A-Za-z0-9_]+/ {
                start=NR
            }
            /^[[:space:]]*const[[:space:]]+[A-Za-z0-9_]+[[:space:]]*=[[:space:]]*(async[[:space:]]*)?\([^)]*\)[[:space:]]*=>/ {
                start=NR
            }
            /^[[:space:]]*}/ && start {
                if (NR - start > 50) count++
                start=0
            }
            END { print count + 0 }
        ' "$TARGET_PATH")
        if [ "$long_functions" -gt 0 ]; then
            echo -e "${YELLOW}🟡 WARNING: Found $long_functions functions >50 lines${NC}"
            echo "   → Break down complex functions."
        fi
    fi

    # Check for magic numbers
    if grep -R -E "[[:space:]][0-9]{3,}" "$TARGET_PATH" 2>/dev/null | grep -v "1000" | grep -v "2000" > /dev/null; then
        echo -e "${YELLOW}🟡 WARNING: Magic numbers detected${NC}"
        echo "   → Use named constants."
    fi

    echo -e "${GREEN}✓ Review code clarity manually${NC}"
}

# Run all assessments
assess_correctness
assess_performance
assess_error_handling
assess_concurrency
assess_testability
assess_maintainability

# Final verdict
echo ""
echo "================================================"
echo "🎯 FINAL VERDICT"
echo "================================================"
echo ""
echo "Review the findings above. If you see multiple 🔴 FAILING marks,"
echo "this code is NOT ready for review."
echo ""
echo "Expected standards:"
echo "  - All error paths handled"
echo "  - No obvious performance issues"
echo "  - Tests exist and pass"
echo "  - Code is clear and maintainable"
echo ""
echo "If you wouldn't deploy this to production, don't submit it for review."
