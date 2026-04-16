"""Compatibility wrapper for the shared PPTX validator."""

from pathlib import Path
import sys

SKILLS_DIR = Path(__file__).resolve().parents[4]
if str(SKILLS_DIR) not in sys.path:
    sys.path.insert(0, str(SKILLS_DIR))

from _office_runtime.validators.pptx import PPTXSchemaValidator  # noqa: E402

__all__ = ["PPTXSchemaValidator"]
