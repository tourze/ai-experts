"""Search YouTube with yt-dlp and normalize results for skill usage."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import UTC, date, datetime, timedelta
from typing import Any


def _run_ytdlp(query: str, count: int) -> dict[str, Any]:
    """Run yt-dlp search and return the raw playlist payload."""
    cmd = [
        "yt-dlp",
        f"ytsearch{count}:{query}",
        "--dump-single-json",
        "--flat-playlist",
        "--no-warnings",
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    except FileNotFoundError as exc:
        raise RuntimeError(
            "yt-dlp 未安装，请先安装，或通过 `uv run --with yt-dlp --no-project ...` 执行"
        ) from exc
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError("yt-dlp 搜索超时，请减少结果数量或稍后重试") from exc

    if result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip() or "未知错误"
        raise RuntimeError(f"yt-dlp 搜索失败: {detail}")

    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"yt-dlp 输出不是合法 JSON: {exc}") from exc


def _normalize_upload_date(raw_value: Any) -> str | None:
    """Convert YYYYMMDD to YYYY-MM-DD; preserve unknown formats as-is."""
    if not raw_value:
        return None

    raw = str(raw_value)
    if len(raw) == 8 and raw.isdigit():
        return f"{raw[:4]}-{raw[4:6]}-{raw[6:]}"
    return raw


def _build_url(entry: dict[str, Any]) -> str:
    """Get a stable watch URL for a search result."""
    if entry.get("webpage_url"):
        return str(entry["webpage_url"])
    if entry.get("url"):
        return str(entry["url"])
    if entry.get("id"):
        return f"https://www.youtube.com/watch?v={entry['id']}"
    return ""


def normalize_entry(entry: dict[str, Any]) -> dict[str, Any]:
    """Normalize yt-dlp playlist entries into a stable schema."""
    description = entry.get("description") or ""
    return {
        "id": entry.get("id"),
        "title": entry.get("title") or "",
        "url": _build_url(entry),
        "channel": entry.get("channel") or entry.get("uploader") or "",
        "view_count": entry.get("view_count"),
        "duration_string": entry.get("duration_string"),
        "upload_date": _normalize_upload_date(entry.get("upload_date")),
        "description": description[:200],
    }


def filter_recent(entries: list[dict[str, Any]], days: int | None) -> list[dict[str, Any]]:
    """Keep only results published in the last N days when upload dates exist."""
    if days is None:
        return entries

    cutoff = datetime.now(UTC).date() - timedelta(days=days)
    filtered: list[dict[str, Any]] = []
    for entry in entries:
        upload_date = entry.get("upload_date")
        if not upload_date:
            continue
        try:
            published = date.fromisoformat(upload_date)
        except ValueError:
            continue
        if published >= cutoff:
            filtered.append(entry)
    return filtered


def sort_entries(entries: list[dict[str, Any]], sort_by: str) -> list[dict[str, Any]]:
    """Sort normalized entries."""
    if sort_by == "relevance":
        return entries
    if sort_by == "views":
        return sorted(entries, key=lambda item: item.get("view_count") or -1, reverse=True)
    if sort_by == "newest":
        return sorted(entries, key=lambda item: item.get("upload_date") or "", reverse=True)
    raise ValueError(f"Unsupported sort mode: {sort_by}")


def search_videos(
    query: str,
    count: int = 10,
    sort_by: str = "relevance",
    days: int | None = None,
) -> list[dict[str, Any]]:
    """Search YouTube and return normalized results."""
    payload = _run_ytdlp(query, count)
    raw_entries = payload.get("entries") or []
    normalized = [normalize_entry(entry) for entry in raw_entries if isinstance(entry, dict)]
    filtered = filter_recent(normalized, days)
    return sort_entries(filtered, sort_by)


def render_table(entries: list[dict[str, Any]]) -> str:
    """Render a simple Markdown table."""
    lines = [
        "| 标题 | 频道 | 观看量 | 时长 | 发布日期 | URL |",
        "|---|---|---:|---|---|---|",
    ]
    for entry in entries:
        title = str(entry.get("title") or "").replace("|", "\\|")
        channel = str(entry.get("channel") or "").replace("|", "\\|")
        views = entry.get("view_count")
        duration = entry.get("duration_string") or ""
        upload_date = entry.get("upload_date") or ""
        url = entry.get("url") or ""
        lines.append(
            f"| {title} | {channel} | {views if views is not None else ''} | {duration} | {upload_date} | {url} |"
        )
    return "\n".join(lines)


def main() -> None:
    """CLI entry point."""
    parser = argparse.ArgumentParser(description="Search YouTube and normalize the results.")
    parser.add_argument("query", help="YouTube search query")
    parser.add_argument(
        "--count",
        type=int,
        default=10,
        help="Number of results to fetch (default: 10)",
    )
    parser.add_argument(
        "--sort",
        choices=["relevance", "views", "newest"],
        default="relevance",
        help="Sort order after normalization (default: relevance)",
    )
    parser.add_argument(
        "--days",
        type=int,
        help="Only keep videos published in the last N days when upload_date is available",
    )
    parser.add_argument(
        "--format",
        choices=["json", "table", "urls"],
        default="json",
        help="Output format (default: json)",
    )
    args = parser.parse_args()

    if args.count < 1:
        parser.error("--count must be greater than or equal to 1")
    if args.days is not None and args.days < 1:
        parser.error("--days must be greater than or equal to 1")

    try:
        results = search_videos(
            query=args.query,
            count=args.count,
            sort_by=args.sort,
            days=args.days,
        )
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)

    if args.format == "table":
        print(render_table(results))
        return

    if args.format == "urls":
        for entry in results:
            if entry.get("url"):
                print(entry["url"])
        return

    json.dump(
        {
            "query": args.query,
            "count": len(results),
            "sort": args.sort,
            "days": args.days,
            "results": results,
        },
        sys.stdout,
        ensure_ascii=False,
        indent=2,
    )
    print()


if __name__ == "__main__":
    main()
