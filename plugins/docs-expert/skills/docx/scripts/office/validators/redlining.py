"""Compatibility wrapper for the shared redlining validator."""

from pathlib import Path
import sys

SKILLS_DIR = Path(__file__).resolve().parents[4]
if str(SKILLS_DIR) not in sys.path:
    sys.path.insert(0, str(SKILLS_DIR))

from _office_runtime.validators.redlining import RedliningValidator  # noqa: E402

__all__ = ["RedliningValidator"]
