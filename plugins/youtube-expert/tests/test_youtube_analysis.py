from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest.mock import patch

PLUGIN_ROOT = Path(__file__).resolve().parent.parent
ANALYSIS_SCRIPTS = PLUGIN_ROOT / "skills" / "youtube-analysis" / "scripts"
sys.path.insert(0, str(ANALYSIS_SCRIPTS))

import analyze_video  # type: ignore  # noqa: E402
import fetch_transcript  # type: ignore  # noqa: E402
import utils  # type: ignore  # noqa: E402


class UtilsTests(unittest.TestCase):
    def test_parse_youtube_url_supports_common_formats(self) -> None:
        self.assertEqual(
            utils.parse_youtube_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
            "dQw4w9WgXcQ",
        )
        self.assertEqual(
            utils.parse_youtube_url("https://youtu.be/dQw4w9WgXcQ?t=42"),
            "dQw4w9WgXcQ",
        )
        self.assertEqual(
            utils.parse_youtube_url("https://m.youtube.com/watch?v=dQw4w9WgXcQ"),
            "dQw4w9WgXcQ",
        )
        self.assertIsNone(utils.parse_youtube_url("https://vimeo.com/12345"))

    def test_chunk_transcript_splits_on_time_boundary(self) -> None:
        chunks = utils.chunk_transcript(
            [
                {"start": 0, "duration": 10, "text": "hello"},
                {"start": 305, "duration": 5, "text": "world"},
            ],
            chunk_minutes=5,
        )
        self.assertEqual(len(chunks), 2)
        self.assertEqual(chunks[0]["start_formatted"], "0:00")
        self.assertEqual(chunks[1]["start_formatted"], "5:05")


class FetchTranscriptTests(unittest.TestCase):
    def test_fetch_metadata_returns_defaults_when_ytdlp_missing(self) -> None:
        with patch.object(
            fetch_transcript,
            "_run_command",
            side_effect=RuntimeError("Command not found: yt-dlp"),
        ):
            metadata = fetch_transcript.fetch_metadata("dQw4w9WgXcQ")

        self.assertEqual(metadata["title"], "Unknown")
        self.assertEqual(metadata["channel"], "Unknown")
        self.assertEqual(metadata["tags"], [])

    def test_fetch_transcript_ytdlp_wraps_missing_binary(self) -> None:
        with patch.object(
            fetch_transcript,
            "_run_command",
            side_effect=RuntimeError("Command not found: yt-dlp"),
        ):
            with self.assertRaisesRegex(RuntimeError, "Command not found: yt-dlp"):
                fetch_transcript.fetch_transcript_ytdlp("dQw4w9WgXcQ", "en")


class AnalyzeVideoTests(unittest.TestCase):
    def test_build_scaffold_contains_analysis_context(self) -> None:
        data = {
            "video_id": "dQw4w9WgXcQ",
            "title": "Example",
            "channel": "Channel",
            "duration_seconds": 213,
            "upload_date": "2024-01-01",
            "description": "description",
            "view_count": 1,
            "tags": ["tag1"],
            "transcript": [{"start": 0, "duration": 5, "text": "hello"}],
            "transcript_text": "hello",
            "language": "en",
            "source": "youtube-transcript-api",
        }

        scaffold = analyze_video.build_scaffold(data, "quick", "auto")
        self.assertIn("## Analysis Context", scaffold)
        self.assertIn("**Video type**: auto", scaffold)
        self.assertIn("hello", scaffold)


if __name__ == "__main__":
    unittest.main()
