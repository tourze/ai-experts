#!/usr/bin/env bash
set -euo pipefail

# Web Quality Audit Script
# Analyzes HTML files for common quality issues

usage() {
  echo "Usage: $0 <file_or_directory>" >&2
  echo "Analyzes HTML files for web quality issues." >&2
  exit 1
}

if [ -z "$1" ]; then
  usage
fi

TARGET="$1"
ISSUES=()
WARNINGS=()

count_imgs_without_alt() {
  python3 - "$1" <<'PY'
import re
import sys
from pathlib import Path

content = Path(sys.argv[1]).read_text(encoding="utf-8", errors="ignore")
matches = re.findall(r"<img\b(?![^>]*\balt=)[^>]*>", content, flags=re.IGNORECASE)
print(len(matches))
PY
}

analyze_html() {
  local file="$1"
  echo "Analyzing: $file" >&2

  # Check for doctype
  if ! grep -qi "<!doctype html>" "$file"; then
    ISSUES+=("$file: Missing HTML5 doctype")
  fi

  # Check for charset
  if ! grep -qi 'charset.*utf-8' "$file"; then
    WARNINGS+=("$file: Missing or non-UTF-8 charset declaration")
  fi

  # Check for viewport
  if ! grep -qi 'name="viewport"' "$file"; then
    ISSUES+=("$file: Missing viewport meta tag")
  fi

  # Check for lang attribute
  if ! grep -qi '<html.*lang=' "$file"; then
    ISSUES+=("$file: Missing lang attribute on <html>")
  fi

  # Check for images without alt
  local missing_alt_count
  missing_alt_count="$(count_imgs_without_alt "$file")"
  if [ "$missing_alt_count" -gt 0 ]; then
    WARNINGS+=("$file: Found $missing_alt_count image(s) without alt text")
  fi

  # Check for title tag
  if ! grep -qi '<title>' "$file"; then
    ISSUES+=("$file: Missing <title> tag")
  fi

  # Check for HTTPS in links
  if grep -qE 'http://' "$file"; then
    WARNINGS+=("$file: Contains non-HTTPS URLs")
  fi
}

# Process files
if [ -d "$TARGET" ]; then
  mapfile -t HTML_FILES < <(find "$TARGET" -type f \( -name "*.html" -o -name "*.htm" \) | sort)
  for file in "${HTML_FILES[@]}"; do
    analyze_html "$file"
  done
elif [ -f "$TARGET" ]; then
  analyze_html "$TARGET"
else
  echo "Error: $TARGET is not a valid file or directory" >&2
  exit 1
fi

python3 - "${#ISSUES[@]}" "${#WARNINGS[@]}" "${ISSUES[@]}" -- "${WARNINGS[@]}" <<'PY'
import json
import sys

issue_count = int(sys.argv[1])
warning_count = int(sys.argv[2])
separator = sys.argv.index("--")
issues = sys.argv[3:separator]
warnings = sys.argv[separator + 1 :]

print(json.dumps({
    "issues": issues,
    "warnings": warnings,
    "issueCount": issue_count,
    "warningCount": warning_count,
}, ensure_ascii=False, indent=2))
PY
