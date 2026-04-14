#!/usr/bin/env python3
from __future__ import annotations

"""
Model-First Reasoning Validator

校验 model.json 是否具备实现前必须冻结的结构。
退出码：
- 0：结构有效，可进入实现阶段
- 1：结构无效
- 2：结构有效，但仍存在 unknowns，必须停在 Phase 1
"""

import argparse
import json
from typing import Any

REQUIRED_KEYS = {
    "deliverable",
    "entities",
    "state_variables",
    "actions",
    "constraints",
    "initial_state",
    "goal",
    "assumptions",
    "unknowns",
    "requirement_trace",
    "test_oracles",
}
REQUIRED_ACTION_KEYS = {"name", "preconditions", "effects"}
REQUIRED_CONSTRAINT_KEYS = {"id", "statement"}
REQUIRED_TRACE_KEYS = {"requirement", "represented_as", "ref"}
REQUIRED_ORACLE_KEYS = {"id", "maps_to", "description"}
LIST_FIELDS = [
    "entities",
    "state_variables",
    "actions",
    "constraints",
    "initial_state",
    "goal",
    "assumptions",
    "unknowns",
    "requirement_trace",
    "test_oracles",
]


def validate_list_of_dicts(
    data: dict[str, Any],
    field: str,
    required_keys: set[str],
    label: str,
    issues: list[str],
) -> None:
    """校验列表字段中的每一项是否为对象且包含必需键。"""
    value = data.get(field)
    if not isinstance(value, list):
        return

    for index, item in enumerate(value):
        if not isinstance(item, dict):
            issues.append(f"{label}[{index}] must be an object")
            continue

        missing = required_keys - set(item.keys())
        if missing:
            issues.append(f"{label}[{index}] missing: {', '.join(sorted(missing))}")


def validate_model(data: dict[str, Any]) -> tuple[bool, list[str]]:
    """返回 (is_valid, issues)。"""
    issues: list[str] = []

    missing_keys = REQUIRED_KEYS - set(data.keys())
    if missing_keys:
        issues.append(f"Missing top-level keys: {', '.join(sorted(missing_keys))}")

    deliverable = data.get("deliverable")
    if deliverable is not None:
        if not isinstance(deliverable, dict):
            issues.append("'deliverable' must be an object")
        elif "description" not in deliverable:
            issues.append("'deliverable' missing 'description'")

    for field in LIST_FIELDS:
        value = data.get(field)
        if value is not None and not isinstance(value, list):
            issues.append(f"'{field}' must be a list")

    validate_list_of_dicts(data, "actions", REQUIRED_ACTION_KEYS, "Action", issues)
    validate_list_of_dicts(
        data, "constraints", REQUIRED_CONSTRAINT_KEYS, "Constraint", issues
    )
    validate_list_of_dicts(
        data, "requirement_trace", REQUIRED_TRACE_KEYS, "RequirementTrace", issues
    )
    validate_list_of_dicts(
        data, "test_oracles", REQUIRED_ORACLE_KEYS, "TestOracle", issues
    )

    return len(issues) == 0, issues


def parse_args() -> argparse.Namespace:
    """解析命令行参数。"""
    parser = argparse.ArgumentParser(description="Validate a Model-First Reasoning model file")
    parser.add_argument("model_path", help="Path to model JSON file")
    return parser.parse_args()


def main() -> int:
    """CLI 入口。"""
    args = parse_args()

    try:
        with open(args.model_path, "r", encoding="utf-8") as handle:
            data = json.load(handle)
    except FileNotFoundError:
        print(f"ERROR: File not found: {args.model_path}")
        return 1
    except json.JSONDecodeError as exc:
        print(f"ERROR: Invalid JSON: {exc}")
        return 1

    is_valid, issues = validate_model(data)
    if issues:
        print("VALIDATION FAILED:")
        for issue in issues:
            print(f"  - {issue}")
        print()

    unknowns = data.get("unknowns", [])
    if isinstance(unknowns, list) and unknowns:
        print(f"WARNING: {len(unknowns)} unknowns remain - STOP after Phase 1")
        for unknown in unknowns:
            print(f"  - {unknown}")
        print()
        print("Do NOT proceed to implementation until unknowns are resolved.")
        return 2 if is_valid else 1

    if is_valid:
        print("OK: Model structure is valid")
        print("    Ready for Phase 2: Implementation")
        return 0

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
