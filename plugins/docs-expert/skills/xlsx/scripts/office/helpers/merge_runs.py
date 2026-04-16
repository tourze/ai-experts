"""Compatibility wrapper for the shared merge-runs helper."""

from pathlib import Path
import sys

SKILLS_DIR = Path(__file__).resolve().parents[4]
if str(SKILLS_DIR) not in sys.path:
    sys.path.insert(0, str(SKILLS_DIR))

from _office_runtime.helpers.merge_runs import merge_runs  # noqa: E402

__all__ = ["merge_runs"]
