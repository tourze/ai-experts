#!/usr/bin/env python3
"""CSO (Claude Search Optimization) audit for SKILL.md descriptions.

Scans all SKILL.md files and detects description patterns that cause
Claude to take shortcuts instead of reading the full skill content.

Usage:
    python3 cso_audit.py                          # scan default plugins/
    python3 cso_audit.py --plugins-dir /path       # custom plugins dir
    python3 cso_audit.py --json                    # JSON output
    python3 cso_audit.py --severity critical       # filter by severity
"""

import argparse
import json
import re
import sys
from pathlib import Path

# ── violation definitions ────────────────────────────────────────────

VIOLATIONS = {
    "workflow_leak": {
        "severity": "critical",
        "label": "工作流泄露",
        "why": "Claude 会按 description 走捷径，跳过 SKILL.md 完整流程",
    },
    "output_leak": {
        "severity": "critical",
        "label": "输出产物泄露",
        "why": "description 包含输出格式/产物，属于 SKILL.md 内容",
    },
    "missing_trigger": {
        "severity": "high",
        "label": "缺少触发条件",
        "why": "缺少 '当...时使用' 格式，Claude 难以判断何时触发",
    },
    "tool_leak": {
        "severity": "medium",
        "label": "工具名泄露",
        "why": "具体工具名过早缩小触发范围",
    },
    "too_long": {
        "severity": "medium",
        "label": "过长 (>200字符)",
        "why": "浪费 token 且可能含非触发信息",
    },
    "too_short": {
        "severity": "low",
        "label": "过短 (<20字符)",
        "why": "触发关键词覆盖不足",
    },
    "missing_desc": {
        "severity": "critical",
        "label": "缺少 description",
        "why": "无法触发 skill",
    },
}

# ── detection patterns ───────────────────────────────────────────────

WORKFLOW_PATTERNS = [
    # "触发词包括" is valid; "自包含" (self-contained) is valid; "覆盖率" is a trigger keyword
    (r"(?<!触发词)(?<!英文触发词)(?<!自)(?:覆盖(?!率)|包括|包含)(?!.*触发词)", "workflow_leak", "列举了覆盖范围"),
    (r"按.*(?:步|阶段|流程|维度).*推进", "workflow_leak", "描述了执行步骤"),
    (r"输出.*(?:评分|清单|文档|报告|蓝图|画像|摘要)", "output_leak", "包含输出产物"),
    # "若重点是...改用" is routing guidance (valid); only flag standalone "重点输出/覆盖"
    (r"(?<!若)重点(?:输出|覆盖)", "output_leak", "描述了重点输出"),
    (r"强调.*(?:先|再|然后)", "workflow_leak", "描述了工作流顺序"),
    (r"(?:106)\s*(?:条|个)", "workflow_leak", "泄露了具体数量"),
]

# Tool names in trigger context (e.g. "当要用 pytest 写测试时") are valid trigger keywords.
# Methodology acronyms (RAII, SOLID, SUCCESs, INVEST, DACI, RAPID) are domain concepts
# that serve as legitimate trigger keywords, not "tools" — do not flag them.
TOOL_PATTERNS = []

TRIGGER_RE = re.compile(r"(当.*时(?:候)?使用|在.*时(?:候)?使用|Use when|适用于|用于)")


# ── helpers ──────────────────────────────────────────────────────────

def extract_description(path: Path) -> tuple[str, str]:
    """Return (name, description) from SKILL.md frontmatter."""
    try:
        text = path.read_text(encoding="utf-8")
    except Exception:
        return "", ""
    m = re.match(r"^---\s*\n(.*?)\n---", text, re.DOTALL)
    if not m:
        return "", ""
    fm = m.group(1)
    name_m = re.search(r"^name:\s*(.+)", fm, re.M)
    desc_m = re.search(r"^description:\s*(.+)", fm, re.M)
    name = name_m.group(1).strip().strip("\"'") if name_m else ""
    desc = desc_m.group(1).strip().strip("\"'") if desc_m else ""
    return name, desc


def audit_description(desc: str) -> list[dict]:
    """Return list of {type, detail} violations."""
    if not desc:
        return [{"type": "missing_desc", "detail": "no description field"}]

    hits = []
    seen_types = set()

    # length
    if len(desc) > 200:
        hits.append({"type": "too_long", "detail": f"len={len(desc)}"})
        seen_types.add("too_long")
    if len(desc) < 20:
        hits.append({"type": "too_short", "detail": f"len={len(desc)}"})
        seen_types.add("too_short")

    # trigger format
    if not TRIGGER_RE.search(desc):
        hits.append({"type": "missing_trigger", "detail": "缺少触发条件句式"})
        seen_types.add("missing_trigger")

    # pattern matching
    for pattern, vtype, reason in WORKFLOW_PATTERNS + TOOL_PATTERNS:
        if vtype not in seen_types and re.search(pattern, desc):
            hits.append({"type": vtype, "detail": reason})
            seen_types.add(vtype)

    return hits


# ── main ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="CSO audit for SKILL.md descriptions")
    parser.add_argument("--plugins-dir", type=Path, default=None,
                        help="Root plugins directory (default: auto-detect)")
    parser.add_argument("--json", action="store_true", help="JSON output")
    parser.add_argument("--severity", choices=["critical", "high", "medium", "low"],
                        help="Filter by minimum severity")
    args = parser.parse_args()

    # auto-detect plugins dir
    plugins_dir = args.plugins_dir
    if not plugins_dir:
        here = Path(__file__).resolve().parent
        for ancestor in [here] + list(here.parents):
            candidate = ancestor / "plugins"
            if candidate.is_dir():
                plugins_dir = candidate
                break
    if not plugins_dir or not plugins_dir.is_dir():
        print("Error: cannot find plugins/ directory", file=sys.stderr)
        sys.exit(1)

    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    min_severity = severity_order.get(args.severity, 3)

    all_skills = sorted(plugins_dir.glob("*/skills/*/SKILL.md"))
    results = []
    pass_count = 0
    violation_counts = {k: 0 for k in VIOLATIONS}

    for path in all_skills:
        plugin = path.parts[-4]
        skill = path.parts[-2]
        rel = f"{plugin}/{skill}"
        name, desc = extract_description(path)
        hits = audit_description(desc)

        # filter by severity
        if args.severity:
            hits = [h for h in hits
                    if severity_order[VIOLATIONS[h["type"]]["severity"]] <= min_severity]

        if not hits:
            pass_count += 1
            continue

        for h in hits:
            violation_counts[h["type"]] += 1

        results.append({
            "skill": rel,
            "description": desc[:150] + ("..." if len(desc) > 150 else ""),
            "violations": hits,
        })

    total = len(all_skills)

    if args.json:
        report = {
            "total": total,
            "pass_count": pass_count,
            "violation_count": len(results),
            "pass_rate": f"{100 * pass_count // total}%" if total else "N/A",
            "breakdown": violation_counts,
            "violations": results,
        }
        json.dump(report, sys.stdout, ensure_ascii=False, indent=2)
        return

    # human-readable output
    print(f"{'=' * 60}")
    print(f"CSO AUDIT — {total} skills scanned")
    print(f"{'=' * 60}")
    print(f"  PASS: {pass_count}/{total} ({100 * pass_count // total}%)")
    print(f"  FAIL: {len(results)}/{total}")
    print()

    print("Violation breakdown:")
    for vtype, count in sorted(violation_counts.items(), key=lambda x: -x[1]):
        if count > 0:
            meta = VIOLATIONS[vtype]
            print(f"  [{meta['severity']:>8}] {vtype:20s} {count:3d}  — {meta['label']}")
    print()

    # group by severity
    for sev in ["critical", "high", "medium", "low"]:
        group = [r for r in results
                 if any(VIOLATIONS[h["type"]]["severity"] == sev for h in r["violations"])]
        if not group:
            continue
        print(f"── {sev.upper()} ({'─' * 50})")
        for r in group:
            tags = ", ".join(h["type"] for h in r["violations"])
            print(f"  [{tags}] {r['skill']}")
            print(f"    {r['description']}")
        print()


if __name__ == "__main__":
    main()
