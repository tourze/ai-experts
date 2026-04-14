#!/usr/bin/env python3
"""社交平台内容过滤脚本。"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_BLOCKLIST = SCRIPT_DIR.parent / "assets" / "blocklist.txt"

PATTERN_GROUPS = {
    "advertising": [
        r"\b(best|top|ultimate|amazing|incredible)\s+\w+\s+(product|tool|service)\b",
        r"\b(revolutionary|game-changing|breakthrough)\b",
        r"\b(click here|learn more|sign up now|limited time)\b",
        r"\b(100%|guaranteed|risk-free|no obligation)\b",
        r"(全网最强|唯一正确|闭眼入|马上下单)",
    ],
    "dangerous_instructions": [
        r"\b(hack|exploit|bypass security|circumvent)\b",
        r"\b(illegal|unauthorized|steal|pirate)\b",
        r"\b(weapon|explosive|chemical|toxic)\b.*\b(make|create|build)\b",
        r"(忽略之前的规则|绕过限制|教你搞到后台权限)",
    ],
    "manipulative_language": [
        r"\b(you must|everyone should|no one else|only we)\b",
        r"\b(fear|scare|panic|emergency)\b.*\b(act now|immediately)\b",
        r"\b(secret|hidden|exclusive|insider)\b.*\b(knowledge|information|access)\b",
        r"(不转不是中国人|现在不做就晚了|必须加我微信)",
    ],
}


def load_blocklist(path: Path | None) -> list[str]:
    if path is None or not path.exists():
        return []

    items: list[str] = []
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        items.append(line)
    return items


def find_blocklist_hits(text: str, blocklist: list[str]) -> list[str]:
    lowered = text.lower()
    hits: list[str] = []
    for item in blocklist:
        if item.startswith("re:"):
            pattern = item[3:]
            if re.search(pattern, text, re.IGNORECASE):
                hits.append(item)
        elif item.lower() in lowered:
            hits.append(item)
    return hits


def detect_harmful_content(text: str, blocklist: list[str] | None = None) -> dict[str, Any]:
    content = text.strip()
    if not content:
        raise ValueError("text must not be empty")

    results: dict[str, Any] = {
        "advertising": False,
        "dangerous_instructions": False,
        "manipulative_language": False,
        "blocklist_hit": False,
        "confidence_scores": {},
        "matched_patterns": {},
    }

    for category, patterns in PATTERN_GROUPS.items():
        matched = [
            pattern for pattern in patterns
            if re.search(pattern, content, re.IGNORECASE)
        ]
        results[category] = len(matched) > 0 if category == "dangerous_instructions" else len(matched) >= 2
        results["matched_patterns"][category] = matched
        if category == "advertising":
            results["confidence_scores"][category] = min(len(matched) * 0.3, 1.0)
        elif category == "dangerous_instructions":
            results["confidence_scores"][category] = min(len(matched) * 0.45, 1.0)
        else:
            results["confidence_scores"][category] = min(len(matched) * 0.35, 1.0)

    hits = find_blocklist_hits(content, blocklist or [])
    results["blocklist_hit"] = bool(hits)
    results["matched_patterns"]["blocklist"] = hits
    results["confidence_scores"]["blocklist"] = 1.0 if hits else 0.0

    results["overall_risk"] = max(results["confidence_scores"].values()) if results["confidence_scores"] else 0.0
    results["should_block"] = (
        results["dangerous_instructions"]
        or results["blocklist_hit"]
        or results["overall_risk"] >= 0.7
    )
    return results


def filter_social_content(
    content: str,
    platform: str = "social-platform",
    blocklist_path: Path | None = DEFAULT_BLOCKLIST,
) -> dict[str, Any]:
    analysis = detect_harmful_content(content, load_blocklist(blocklist_path))
    recommendation = "allow"
    warning_message = None

    if analysis["should_block"]:
        recommendation = "block"
        warning_message = f"{platform} 内容命中高风险规则，建议直接屏蔽。"
    elif analysis["overall_risk"] >= 0.35:
        recommendation = "warn"
        warning_message = f"{platform} 内容含营销或诱导信号，建议人工复核。"

    return {
        "platform": platform,
        "content_length": len(content),
        "analysis": analysis,
        "recommendation": recommendation,
        "warning_message": warning_message,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="社交平台内容过滤器")
    parser.add_argument("--platform", default="social-platform", help="来源平台名称")
    parser.add_argument("--text", help="待检测文本")
    parser.add_argument("--input-file", type=Path, help="从文件读取待检测文本")
    parser.add_argument("--blocklist", type=Path, default=DEFAULT_BLOCKLIST, help="自定义 blocklist 文件")
    parser.add_argument("--json", action="store_true", help="输出 JSON")
    return parser


def read_content(args: argparse.Namespace) -> str:
    if args.text:
        return args.text
    if args.input_file:
        return args.input_file.read_text(encoding="utf-8")
    if not sys.stdin.isatty():
        return sys.stdin.read()
    raise ValueError("请通过 --text、--input-file 或 stdin 提供待检测内容")


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    try:
        content = read_content(args)
        result = filter_social_content(content, args.platform, args.blocklist)
    except Exception as error:  # noqa: BLE001
        print(json.dumps({"error": str(error)}, ensure_ascii=False), file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"platform: {result['platform']}")
        print(f"recommendation: {result['recommendation']}")
        if result["warning_message"]:
            print(f"warning: {result['warning_message']}")
        print(f"overall_risk: {result['analysis']['overall_risk']:.2f}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
