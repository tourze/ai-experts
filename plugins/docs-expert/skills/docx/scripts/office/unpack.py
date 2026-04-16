"""Compatibility wrapper for the shared Office unpacker."""

from pathlib import Path
import sys

SKILLS_DIR = Path(__file__).resolve().parents[3]
if str(SKILLS_DIR) not in sys.path:
    sys.path.insert(0, str(SKILLS_DIR))

from _office_runtime.unpack import main, unpack  # noqa: E402

__all__ = ["main", "unpack"]


if __name__ == "__main__":
    raise SystemExit(main())
