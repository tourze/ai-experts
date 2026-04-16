"""Compatibility wrappers for the shared Office validator modules."""

from pathlib import Path
import sys

SKILLS_DIR = Path(__file__).resolve().parents[4]
if str(SKILLS_DIR) not in sys.path:
    sys.path.insert(0, str(SKILLS_DIR))

from _office_runtime.validators import (  # noqa: E402
    BaseSchemaValidator,
    DOCXSchemaValidator,
    PPTXSchemaValidator,
    RedliningValidator,
)

__all__ = ["BaseSchemaValidator", "DOCXSchemaValidator", "PPTXSchemaValidator", "RedliningValidator"]
