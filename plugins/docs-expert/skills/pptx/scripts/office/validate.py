"""Compatibility wrapper for the shared Office validator."""

from pathlib import Path
import sys

SKILLS_DIR = Path(__file__).resolve().parents[3]
if str(SKILLS_DIR) not in sys.path:
    sys.path.insert(0, str(SKILLS_DIR))

from _office_runtime.validate import main  # noqa: E402

__all__ = ["main"]


if __name__ == "__main__":
    raise SystemExit(main())
