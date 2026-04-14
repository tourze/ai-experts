#!/usr/bin/env bash
# Brutal Honesty Test Assessment Script (Ramsay Mode)

set -euo pipefail

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "👨‍🍳 BRUTAL HONESTY TEST ASSESSMENT (Ramsay Mode)"
echo "=================================================="
echo ""

# Check if test directory argument provided
if [ "${1:-}" = "" ]; then
    echo "Usage: $0 <test-directory>"
    exit 1
fi

TEST_DIR="$1"

# Check if test directory exists
if [ ! -d "$TEST_DIR" ]; then
    echo -e "${RED}🔴 FAILING: Test directory '$TEST_DIR' doesn't exist${NC}"
    echo "   → Where are the tests? Did you even write any?"
    exit 1
fi

resolve_path() {
    local target="$1"
    (cd "$target" && pwd)
}

find_project_root() {
    local current="$1"

    while true; do
        for marker in package.json pnpm-lock.yaml yarn.lock package-lock.json; do
            if [ -f "$current/$marker" ]; then
                printf '%s\n' "$current"
                return
            fi
        done

        if [ "$current" = "/" ]; then
            printf '%s\n' "$(pwd)"
            return
        fi

        current="$(dirname "$current")"
    done
}

TEST_PATH="$(resolve_path "$TEST_DIR")"
PROJECT_ROOT="$(find_project_root "$TEST_PATH")"

extract_first_percent() {
    python3 -c 'import re, sys; text = sys.stdin.read(); match = re.search(r"(\d+(?:\.\d+)?)%", text); print(match.group(1) if match else "")'
}

# Function to assess coverage
assess_coverage() {
    echo "📊 COVERAGE CHECK"
    echo "----------------"

    # Run coverage if npm test with coverage exists
    if [ -f "$PROJECT_ROOT/package.json" ] && grep -q "\"test:coverage\"" "$PROJECT_ROOT/package.json"; then
        echo "Running coverage analysis..."
        coverage_output="$(cd "$PROJECT_ROOT" && npm run test:coverage 2>&1 || true)"
        coverage="$(printf '%s\n' "$coverage_output" | extract_first_percent)"
        if [ -z "$coverage" ]; then
            coverage="0"
        fi

        if awk -v coverage="$coverage" 'BEGIN { exit !(coverage < 50) }'; then
            echo -e "${RED}🔴 RAW: ${coverage}% coverage${NC}"
            echo "   → This is embarrassing. You're barely testing anything."
        elif awk -v coverage="$coverage" 'BEGIN { exit !(coverage < 80) }'; then
            echo -e "${YELLOW}🟡 ACCEPTABLE: ${coverage}% coverage${NC}"
            echo "   → Minimum is 80%. You're not there yet."
        else
            echo -e "${GREEN}🟢 MICHELIN STAR: ${coverage}% coverage${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  No coverage command found${NC}"
        echo "   → Add 'test:coverage' script to package.json"
    fi
}

# Function to assess edge cases
assess_edge_cases() {
    echo ""
    echo "🎯 EDGE CASE CHECK"
    echo "-----------------"

    # Check for common edge case patterns
    edge_case_patterns=(
        "null"
        "undefined"
        "empty"
        "zero"
        "negative"
        "max"
        "min"
        "overflow"
        "boundary"
    )

    found_count=0
    for pattern in "${edge_case_patterns[@]}"; do
        if grep -R -i "$pattern" "$TEST_PATH" > /dev/null 2>&1; then
            found_count=$((found_count + 1))
        fi
    done

    if [ "$found_count" -eq 0 ]; then
        echo -e "${RED}🔴 RAW: No edge cases tested${NC}"
        echo "   → You're only testing the happy path. That's not testing."
    elif [ "$found_count" -lt 3 ]; then
        echo -e "${YELLOW}🟡 ACCEPTABLE: Found $found_count edge case patterns${NC}"
        echo "   → Test more: null, empty, boundaries, overflow"
    else
        echo -e "${GREEN}🟢 MICHELIN STAR: Found $found_count edge case patterns${NC}"
    fi
}

# Function to assess test clarity
assess_clarity() {
    echo ""
    echo "📖 CLARITY CHECK"
    echo "---------------"

    # Check for descriptive test names
    unclear_tests=$( (grep -R "test('test" "$TEST_PATH" 2>/dev/null || true) | wc -l | tr -d ' ' )
    if [ "$unclear_tests" -gt 0 ]; then
        echo -e "${RED}🔴 RAW: Found $unclear_tests unclear test names${NC}"
        echo "   → 'test1', 'test2' - What are you testing? Use descriptive names."
    fi

    # Check for describe/it blocks
    if grep -R -E "describe|it|test" "$TEST_PATH" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Tests have structure${NC}"
    else
        echo -e "${YELLOW}⚠️  No test framework patterns detected${NC}"
    fi
}

# Function to assess test speed
assess_speed() {
    echo ""
    echo "⚡ SPEED CHECK"
    echo "-------------"

    echo "Running tests..."
    start_time=$(date +%s)

    # Run tests (suppress output)
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        echo -e "${YELLOW}⚠️  No package.json found near $TEST_DIR${NC}"
        echo "   → Skipping speed check."
        return
    fi

    if (cd "$PROJECT_ROOT" && npm test > /dev/null 2>&1); then
        end_time=$(date +%s)
        duration=$((end_time - start_time))

        if [ "$duration" -gt 60 ]; then
            echo -e "${RED}🔴 RAW: Tests took ${duration}s${NC}"
            echo "   → Unit tests should run in seconds, not minutes."
            echo "   → Are you calling real databases/networks?"
        elif [ "$duration" -gt 10 ]; then
            echo -e "${YELLOW}🟡 ACCEPTABLE: Tests took ${duration}s${NC}"
            echo "   → Aim for <10s. Use mocks and in-memory operations."
        else
            echo -e "${GREEN}🟢 MICHELIN STAR: Tests took ${duration}s${NC}"
        fi
    else
        echo -e "${RED}🔴 FAILING: Tests don't even pass${NC}"
        echo "   → Fix your broken tests before worrying about speed."
    fi
}

# Function to assess stability
assess_stability() {
    echo ""
    echo "🎲 STABILITY CHECK"
    echo "-----------------"

    # Check for flaky patterns
    if grep -R -i -E "setTimeout|sleep|wait" "$TEST_PATH" > /dev/null 2>&1; then
        echo -e "${RED}🔴 RAW: Timing-based tests detected${NC}"
        echo "   → You're creating flaky tests. Use proper async/await."
    fi

    # Run tests multiple times to detect flakes
    echo "Running tests 3x to detect flakes..."
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        echo -e "${YELLOW}⚠️  No package.json found near $TEST_DIR${NC}"
        echo "   → Skipping flake check."
        return
    fi

    failures=0
    for i in 1 2 3; do
        if ! (cd "$PROJECT_ROOT" && npm test > /dev/null 2>&1); then
            failures=$((failures + 1))
        fi
    done

    if [ "$failures" -gt 0 ]; then
        echo -e "${RED}🔴 RAW: Tests failed $failures/3 times${NC}"
        echo "   → FLAKY TESTS. These are worse than no tests."
        echo "   → Fix the non-determinism before merging."
    else
        echo -e "${GREEN}🟢 MICHELIN STAR: Tests are stable${NC}"
    fi
}

# Function to assess isolation
assess_isolation() {
    echo ""
    echo "🏝️  ISOLATION CHECK"
    echo "------------------"

    # Check for shared state patterns
    if grep -R -i -E "global|beforeAll|shared" "$TEST_PATH" > /dev/null 2>&1; then
        echo -e "${YELLOW}🟡 WARNING: Shared state patterns detected${NC}"
        echo "   → Are your tests independent? Can they run in any order?"
    fi

    # Check for test order dependencies
    if grep -R -E "\\.only|\\.skip" "$TEST_PATH" > /dev/null 2>&1; then
        echo -e "${YELLOW}🟡 WARNING: .only or .skip found${NC}"
        echo "   → Don't commit tests with .only or .skip"
    fi

    echo -e "${GREEN}✓ Review test isolation manually${NC}"
}

# Run all assessments
assess_coverage
assess_edge_cases
assess_clarity
assess_speed
assess_stability
assess_isolation

# Final verdict
echo ""
echo "=================================================="
echo "🎯 FINAL VERDICT"
echo "=================================================="
echo ""
echo "Look at the results above. If you see multiple 🔴 RAW marks,"
echo "these tests are NOT production-ready."
echo ""
echo "Expected standards:"
echo "  - 80%+ branch coverage"
echo "  - Edge cases tested (null, empty, boundaries)"
echo "  - Clear test names"
echo "  - <10s to run"
echo "  - 0% flaky"
echo "  - Independent tests"
echo ""
echo "You know what good tests look like. Why aren't you writing them?"
