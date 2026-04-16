"""Compatibility wrappers for the shared Office helper modules."""

from pathlib import Path
import sys

SKILLS_DIR = Path(__file__).resolve().parents[4]
if str(SKILLS_DIR) not in sys.path:
    sys.path.insert(0, str(SKILLS_DIR))

from _office_runtime.helpers.merge_runs import merge_runs  # noqa: E402
from _office_runtime.helpers.simplify_redlines import (  # noqa: E402
    get_tracked_change_authors,
    infer_author,
    simplify_redlines,
)

__all__ = ["get_tracked_change_authors", "infer_author", "merge_runs", "simplify_redlines"]
