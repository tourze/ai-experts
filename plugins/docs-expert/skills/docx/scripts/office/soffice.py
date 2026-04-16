"""Compatibility wrapper for the shared soffice helpers."""

from pathlib import Path
import sys

SKILLS_DIR = Path(__file__).resolve().parents[3]
if str(SKILLS_DIR) not in sys.path:
    sys.path.insert(0, str(SKILLS_DIR))

from _office_runtime.soffice import get_soffice_env, main, run_soffice  # noqa: E402

__all__ = ["get_soffice_env", "main", "run_soffice"]


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
