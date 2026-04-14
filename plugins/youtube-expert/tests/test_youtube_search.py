from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch

PLUGIN_ROOT = Path(__file__).resolve().parent.parent
SEARCH_SCRIPTS = PLUGIN_ROOT / "skills" / "youtube-search" / "scripts"
sys.path.insert(0, str(SEARCH_SCRIPTS))

import search_youtube  # type: ignore  # noqa: E402


class SearchYouTubeTests(unittest.TestCase):
    def test_normalize_entry_generates_stable_schema(self) -> None:
        normalized = search_youtube.normalize_entry(
            {
                "id": "abc123def45",
                "title": "Example Video",
                "channel": "Example Channel",
                "view_count": 42,
                "duration_string": "10:00",
                "upload_date": "20260401",
                "description": "x" * 300,
            }
        )

        self.assertEqual(normalized["url"], "https://www.youtube.com/watch?v=abc123def45")
        self.assertEqual(normalized["upload_date"], "2026-04-01")
        self.assertEqual(len(normalized["description"]), 200)

    def test_sort_entries_by_views_descending(self) -> None:
        results = search_youtube.sort_entries(
            [
                {"title": "A", "view_count": 2},
                {"title": "B", "view_count": 10},
                {"title": "C", "view_count": None},
            ],
            "views",
        )
        self.assertEqual([item["title"] for item in results], ["B", "A", "C"])

    def test_search_videos_normalizes_mocked_payload(self) -> None:
        payload = {
            "entries": [
                {
                    "id": "abc123def45",
                    "title": "Example Video",
                    "channel": "Example Channel",
                    "view_count": 42,
                    "duration_string": "10:00",
                    "upload_date": "20260401",
                }
            ]
        }
        with patch.object(search_youtube, "_run_ytdlp", return_value=payload):
            results = search_youtube.search_videos("example", count=1)

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "Example Video")
        self.assertEqual(results[0]["upload_date"], "2026-04-01")

    def test_run_ytdlp_reports_missing_binary(self) -> None:
        with patch.object(search_youtube.subprocess, "run", side_effect=FileNotFoundError("yt-dlp")):
            with self.assertRaisesRegex(RuntimeError, "yt-dlp 未安装"):
                search_youtube._run_ytdlp("claude code", 5)


if __name__ == "__main__":
    unittest.main()
