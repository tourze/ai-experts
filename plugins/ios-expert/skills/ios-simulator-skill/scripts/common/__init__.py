"""
Common utilities shared across iOS simulator scripts.

This module centralizes genuinely reused code patterns to eliminate duplication
while respecting Jackson's Law - no over-abstraction, only truly shared logic.

Organization:
- device_utils: Device detection, command building, coordinate transformation
- idb_utils: IDB-specific operations (accessibility tree, element manipulation)
"""

from .device_utils import (
    build_idb_command,
    build_simctl_command,
    get_booted_device_udid,
    get_device_screen_size,
    resolve_udid,
    transform_screenshot_coords,
)
from .idb_utils import (
    count_elements,
    flatten_tree,
    get_accessibility_tree,
    get_screen_size,
)

__all__ = [
    # device_utils
    "build_idb_command",
    "build_simctl_command",
    # idb_utils
    "count_elements",
    "flatten_tree",
    "get_accessibility_tree",
    "get_booted_device_udid",
    "get_device_screen_size",
    "get_screen_size",
    "resolve_udid",
    "transform_screenshot_coords",
]
