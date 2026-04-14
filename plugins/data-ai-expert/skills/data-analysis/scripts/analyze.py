#!/usr/bin/env python3
from __future__ import annotations

"""
使用 DuckDB 分析本地 `.xlsx` / `.csv` 文件。

能力：
- 结构检查（表、列、样例数据）
- SQL 查询
- 统计摘要
- 导出 CSV / JSON / Markdown

设计原则：
- 不在 import 阶段自动安装依赖
- 缺少依赖时输出明确错误，而不是直接崩溃
- Excel 使用 openpyxl 转临时 CSV，避免依赖 DuckDB 扩展下载
"""

import argparse
import csv
import hashlib
import importlib
import json
import logging
import os
import re
import sys
import tempfile
from contextlib import suppress
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    import duckdb

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)

CACHE_DIR = Path(tempfile.gettempdir()) / ".data-analysis-cache"
TABLE_MAP_SUFFIX = ".table_map.json"


def require_module(module_name: str, install_hint: str):
    """按需导入可选依赖；缺失时抛出可读错误。"""
    try:
        return importlib.import_module(module_name)
    except ImportError as exc:  # pragma: no cover - 依赖是否存在取决于环境
        raise RuntimeError(
            f"缺少 Python 依赖 `{module_name}`。请先运行：{install_hint}"
        ) from exc


def compute_files_hash(files: list[str]) -> str:
    """为输入文件集合生成稳定缓存键。"""
    hasher = hashlib.sha256()
    for file_path in sorted(files):
        try:
            with open(file_path, "rb") as handle:
                while chunk := handle.read(8192):
                    hasher.update(chunk)
        except OSError:
            hasher.update(file_path.encode("utf-8"))
    return hasher.hexdigest()


def get_cache_db_path(files_hash: str) -> Path:
    """返回缓存数据库路径。"""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    return CACHE_DIR / f"{files_hash}.duckdb"


def get_table_map_path(files_hash: str) -> Path:
    """返回表名映射缓存路径。"""
    return CACHE_DIR / f"{files_hash}{TABLE_MAP_SUFFIX}"


def save_table_map(files_hash: str, table_map: dict[str, str]) -> None:
    """缓存表名映射。"""
    path = get_table_map_path(files_hash)
    path.write_text(json.dumps(table_map, ensure_ascii=False, indent=2), encoding="utf-8")


def load_table_map(files_hash: str) -> dict[str, str] | None:
    """读取表名映射缓存。"""
    path = get_table_map_path(files_hash)
    if not path.exists():
        return None

    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def sanitize_identifier(name: str, prefix: str) -> str:
    """将任意名称转换为 SQL 友好的标识符。"""
    sanitized = re.sub(r"[^\w]+", "_", str(name).strip(), flags=re.UNICODE).strip("_")
    if not sanitized:
        sanitized = prefix
    if sanitized[0].isdigit():
        sanitized = f"{prefix}_{sanitized}"
    return sanitized


def dedupe_identifiers(values: list[Any], prefix: str) -> list[str]:
    """生成去重后的列名或表名。"""
    seen: dict[str, int] = {}
    result: list[str] = []

    for index, value in enumerate(values, start=1):
        base = sanitize_identifier("" if value is None else str(value), f"{prefix}_{index}")
        count = seen.get(base, 0)
        seen[base] = count + 1
        result.append(base if count == 0 else f"{base}_{count + 1}")

    return result


def escape_sql_literal(value: str) -> str:
    """转义 SQL 字符串字面量。"""
    return value.replace("'", "''")


def create_unique_table_name(candidate: str, table_map: dict[str, str], prefix: str) -> str:
    """为表生成不会与现有表冲突的名称。"""
    table_name = sanitize_identifier(candidate, prefix)
    original = table_name
    counter = 1
    while table_name in table_map.values():
        counter += 1
        table_name = f"{original}_{counter}"
    return table_name


def stringify_excel_cell(value: Any) -> Any:
    """把 Excel 单元格值转换为 CSV 可写入格式。"""
    if value is None:
        return ""
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def load_files(con: "duckdb.DuckDBPyConnection", files: list[str]) -> dict[str, str]:
    """
    将输入文件加载到 DuckDB。

    返回：原始表名/Sheet 名 -> SQL 表名。
    """
    table_map: dict[str, str] = {}

    for file_path in files:
        path = Path(file_path)
        if not path.exists():
            logger.error("File not found: %s", file_path)
            continue

        ext = path.suffix.lower()
        if ext == ".csv":
            _load_csv(con, path, table_map)
        elif ext == ".xlsx":
            _load_xlsx(con, path, table_map)
        elif ext == ".xls":
            logger.warning("Legacy .xls is not supported directly: %s", file_path)
            logger.warning("  Convert it to .xlsx first, then rerun the analysis.")
        else:
            logger.warning("Unsupported file format: %s (%s)", ext, file_path)

    return table_map


def _load_csv(
    con: "duckdb.DuckDBPyConnection", file_path: Path, table_map: dict[str, str]
) -> None:
    """加载 CSV 文件。"""
    table_key = file_path.stem
    table_name = create_unique_table_name(table_key, table_map, "table")
    escaped_path = escape_sql_literal(str(file_path))

    try:
        con.execute(
            f"""
            CREATE TABLE "{table_name}" AS
            SELECT * FROM read_csv_auto('{escaped_path}', HEADER = true)
            """
        )
        table_map[table_key] = table_name
        row_count = con.execute(f'SELECT COUNT(*) FROM "{table_name}"').fetchone()[0]
        logger.info(
            "  Loaded CSV '%s' -> table '%s' (%s rows)",
            table_key,
            table_name,
            row_count,
        )
    except Exception as exc:
        logger.warning("  Failed to load CSV '%s': %s", table_key, exc)


def _load_xlsx(
    con: "duckdb.DuckDBPyConnection", file_path: Path, table_map: dict[str, str]
) -> None:
    """逐个 Sheet 读取 `.xlsx` 文件。"""
    openpyxl = require_module("openpyxl", "python3 -m pip install openpyxl")

    try:
        workbook = openpyxl.load_workbook(file_path, read_only=True, data_only=True)
    except Exception as exc:
        logger.warning("  Failed to open workbook '%s': %s", file_path.name, exc)
        return

    try:
        for sheet_name in workbook.sheetnames:
            sheet = workbook[sheet_name]
            rows = sheet.iter_rows(values_only=True)
            header_row = next(rows, None)
            if header_row is None:
                logger.info("  Skipped empty sheet '%s'", sheet_name)
                continue

            headers = dedupe_identifiers(list(header_row), "column")
            table_name = create_unique_table_name(sheet_name, table_map, "table")

            with tempfile.NamedTemporaryFile(
                mode="w",
                suffix=".csv",
                newline="",
                encoding="utf-8",
                delete=False,
            ) as temp_file:
                temp_path = Path(temp_file.name)
                writer = csv.writer(temp_file)
                writer.writerow(headers)
                for row in rows:
                    padded = list(row or ())
                    if len(padded) < len(headers):
                        padded.extend([None] * (len(headers) - len(padded)))
                    writer.writerow(
                        stringify_excel_cell(value) for value in padded[: len(headers)]
                    )

            try:
                escaped_path = escape_sql_literal(str(temp_path))
                con.execute(
                    f"""
                    CREATE TABLE "{table_name}" AS
                    SELECT * FROM read_csv_auto('{escaped_path}', HEADER = true)
                    """
                )
                table_map[sheet_name] = table_name
                row_count = con.execute(
                    f'SELECT COUNT(*) FROM "{table_name}"'
                ).fetchone()[0]
                logger.info(
                    "  Loaded sheet '%s' -> table '%s' (%s rows)",
                    sheet_name,
                    table_name,
                    row_count,
                )
            except Exception as exc:
                logger.warning("  Failed to load sheet '%s': %s", sheet_name, exc)
            finally:
                with suppress(OSError):
                    temp_path.unlink()
    finally:
        workbook.close()


def action_inspect(con: "duckdb.DuckDBPyConnection", table_map: dict[str, str]) -> str:
    """输出所有表的结构、非空计数与样例数据。"""
    output_parts = []

    for original_name, table_name in table_map.items():
        output_parts.append(f"\n{'=' * 60}")
        output_parts.append(f'Table: {original_name} (SQL name: "{table_name}")')
        output_parts.append(f"{'=' * 60}")

        row_count = con.execute(f'SELECT COUNT(*) FROM "{table_name}"').fetchone()[0]
        output_parts.append(f"Rows: {row_count}")

        columns = con.execute(f'DESCRIBE "{table_name}"').fetchall()
        output_parts.append(f"\nColumns ({len(columns)}):")
        output_parts.append(f"{'Name':<30} {'Type':<15} {'Nullable'}")
        output_parts.append(f"{'-' * 30} {'-' * 15} {'-' * 8}")
        for col_name, col_type, nullable, *_ in columns:
            output_parts.append(f"{col_name:<30} {col_type:<15} {nullable}")

        col_names = [col[0] for col in columns]
        if col_names:
            try:
                non_null_sql = ", ".join(
                    f'COUNT("{column}") AS "{column}"' for column in col_names
                )
                non_null_counts = con.execute(
                    f'SELECT {non_null_sql} FROM "{table_name}"'
                ).fetchone()
                output_parts.append("\nNon-null counts:")
                for index, column in enumerate(col_names):
                    output_parts.append(f"  {column}: {non_null_counts[index]} / {row_count}")
            except Exception:
                pass

        output_parts.append("\nSample data (first 5 rows):")
        try:
            sample_df = con.execute(f'SELECT * FROM "{table_name}" LIMIT 5').fetchdf()
            output_parts.append(sample_df.to_string(index=False))
        except Exception:
            sample = con.execute(f'SELECT * FROM "{table_name}" LIMIT 5').fetchall()
            header = " | ".join(col_names)
            output_parts.append(f"  {header}")
            for row in sample:
                output_parts.append("  " + " | ".join(str(value) for value in row))

    result = "\n".join(output_parts)
    print(result)
    return result


def action_query(
    con: "duckdb.DuckDBPyConnection",
    sql: str,
    table_map: dict[str, str],
    output_file: str | None = None,
) -> str:
    """执行查询并打印或导出结果。"""
    modified_sql = sql
    for original_name, table_name in sorted(
        table_map.items(), key=lambda item: len(item[0]), reverse=True
    ):
        if original_name != table_name:
            modified_sql = re.sub(
                rf"\b{re.escape(original_name)}\b",
                f'"{table_name}"',
                modified_sql,
            )

    try:
        result = con.execute(modified_sql)
        if result.description is None:
            message = "Query executed successfully."
            print(message)
            return message

        columns = [desc[0] for desc in result.description]
        rows = result.fetchall()
    except Exception as exc:
        error_msg = [f"SQL Error: {exc}", "", "Available tables:"]
        for original_name, table_name in table_map.items():
            cols = con.execute(f'DESCRIBE "{table_name}"').fetchall()
            col_names = ", ".join(col[0] for col in cols)
            error_msg.append(f'  "{table_name}" ({original_name}): {col_names}')
        message = "\n".join(error_msg)
        print(message)
        return message

    if output_file:
        return _export_results(columns, rows, output_file)
    return _format_table(columns, rows)


def _format_table(columns: list[str], rows: list[tuple[Any, ...]]) -> str:
    """把结果格式化为终端表格。"""
    if not rows:
        message = "Query returned 0 rows."
        print(message)
        return message

    widths = [len(str(column)) for column in columns]
    for row in rows:
        for index, value in enumerate(row):
            widths[index] = max(widths[index], len(str(value)))

    widths = [min(width, 40) for width in widths]
    header = " | ".join(str(column).ljust(widths[index]) for index, column in enumerate(columns))
    separator = "-+-".join("-" * width for width in widths)
    parts = [header, separator]

    for row in rows:
        parts.append(
            " | ".join(
                str(value)[: widths[index]].ljust(widths[index])
                for index, value in enumerate(row)
            )
        )

    parts.append(f"\n({len(rows)} rows)")
    result = "\n".join(parts)
    print(result)
    return result


def _export_results(
    columns: list[str], rows: list[tuple[Any, ...]], output_file: str
) -> str:
    """导出查询结果。"""
    output_path = Path(output_file)
    if output_path.parent != Path("."):
        output_path.parent.mkdir(parents=True, exist_ok=True)

    ext = output_path.suffix.lower()
    if ext == ".csv":
        with output_path.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.writer(handle)
            writer.writerow(columns)
            writer.writerows(rows)
    elif ext == ".json":
        records = []
        for row in rows:
            record = {}
            for index, column in enumerate(columns):
                value = row[index]
                if hasattr(value, "isoformat"):
                    value = value.isoformat()
                elif isinstance(value, (bytes, bytearray)):
                    value = value.hex()
                record[column] = value
            records.append(record)
        output_path.write_text(
            json.dumps(records, indent=2, ensure_ascii=False, default=str),
            encoding="utf-8",
        )
    elif ext == ".md":
        with output_path.open("w", encoding="utf-8") as handle:
            handle.write("| " + " | ".join(columns) + " |\n")
            handle.write("| " + " | ".join("---" for _ in columns) + " |\n")
            for row in rows:
                handle.write(
                    "| "
                    + " | ".join(str(value).replace("|", "\\|") for value in row)
                    + " |\n"
                )
    else:
        message = f"Unsupported output format: {ext}. Use .csv, .json, or .md"
        print(message)
        return message

    message = f"Results exported to {output_path} ({len(rows)} rows)"
    print(message)
    return message


def action_summary(
    con: "duckdb.DuckDBPyConnection", table_name: str, table_map: dict[str, str]
) -> str:
    """输出单表统计摘要。"""
    resolved_name = table_map.get(table_name, table_name)

    try:
        columns = con.execute(f'DESCRIBE "{resolved_name}"').fetchall()
    except Exception:
        available = ", ".join(f'"{table}" ({original})' for original, table in table_map.items())
        message = f"Table '{table_name}' not found. Available tables: {available}"
        print(message)
        return message

    row_count = con.execute(f'SELECT COUNT(*) FROM "{resolved_name}"').fetchone()[0]
    output_parts = [
        f"\nStatistical Summary: {table_name}",
        f"Total rows: {row_count}",
        "=" * 70,
    ]

    numeric_types = {
        "BIGINT",
        "INTEGER",
        "SMALLINT",
        "TINYINT",
        "DOUBLE",
        "FLOAT",
        "DECIMAL",
        "HUGEINT",
        "REAL",
        "NUMERIC",
    }

    for column in columns:
        col_name, raw_type = column[0], column[1]
        output_parts.append(f"\n--- {col_name} ({raw_type}) ---")
        base_type = re.sub(r"\(.*\)", "", raw_type.upper()).strip()

        if base_type in numeric_types:
            try:
                stats = con.execute(
                    f"""
                    SELECT
                        COUNT("{col_name}") AS count,
                        AVG("{col_name}")::DOUBLE AS mean,
                        STDDEV("{col_name}")::DOUBLE AS std,
                        MIN("{col_name}") AS min,
                        QUANTILE_CONT("{col_name}", 0.25) AS q25,
                        MEDIAN("{col_name}") AS median,
                        QUANTILE_CONT("{col_name}", 0.75) AS q75,
                        MAX("{col_name}") AS max,
                        COUNT(*) - COUNT("{col_name}") AS null_count
                    FROM "{resolved_name}"
                    """
                ).fetchone()
                labels = ["count", "mean", "std", "min", "25%", "50%", "75%", "max", "nulls"]
                for label, value in zip(labels, stats):
                    if isinstance(value, float):
                        output_parts.append(f"  {label:<8}: {value:,.4f}")
                    else:
                        output_parts.append(f"  {label:<8}: {value}")
            except Exception as exc:
                output_parts.append(f"  Error computing stats: {exc}")
        else:
            try:
                stats = con.execute(
                    f"""
                    SELECT
                        COUNT("{col_name}") AS count,
                        COUNT(DISTINCT "{col_name}") AS unique_count,
                        MODE("{col_name}") AS mode_val,
                        COUNT(*) - COUNT("{col_name}") AS null_count
                    FROM "{resolved_name}"
                    """
                ).fetchone()
                output_parts.append(f"  count   : {stats[0]}")
                output_parts.append(f"  unique  : {stats[1]}")
                output_parts.append(f"  top     : {stats[2]}")
                output_parts.append(f"  nulls   : {stats[3]}")

                top_values = con.execute(
                    f"""
                    SELECT "{col_name}", COUNT(*) AS freq
                    FROM "{resolved_name}"
                    WHERE "{col_name}" IS NOT NULL
                    GROUP BY "{col_name}"
                    ORDER BY freq DESC
                    LIMIT 5
                    """
                ).fetchall()
                if top_values:
                    output_parts.append("  top values:")
                    for value, freq in top_values:
                        percentage = (freq / row_count * 100) if row_count else 0
                        output_parts.append(f"    {value}: {freq} ({percentage:.1f}%)")
            except Exception as exc:
                output_parts.append(f"  Error computing stats: {exc}")

    result = "\n".join(output_parts)
    print(result)
    return result


def parse_args() -> argparse.Namespace:
    """解析命令行参数。"""
    parser = argparse.ArgumentParser(description="Analyze local .xlsx/.csv files using DuckDB")
    parser.add_argument(
        "--files",
        nargs="+",
        required=True,
        help="Paths to local .xlsx or .csv files (.xls should be converted to .xlsx first)",
    )
    parser.add_argument(
        "--action",
        required=True,
        choices=["inspect", "query", "summary"],
        help="Action to perform: inspect, query, or summary",
    )
    parser.add_argument("--sql", type=str, default=None, help="SQL query for --action query")
    parser.add_argument("--table", type=str, default=None, help="Table name for --action summary")
    parser.add_argument(
        "--output-file",
        type=str,
        default=None,
        help="Optional export path (.csv, .json, .md) for query results",
    )
    args = parser.parse_args()

    if args.action == "query" and not args.sql:
        parser.error("--sql is required for 'query' action")
    if args.action == "summary" and not args.table:
        parser.error("--table is required for 'summary' action")
    return args


def main() -> int:
    """主入口。"""
    args = parse_args()
    duckdb = require_module("duckdb", "python3 -m pip install duckdb")

    files_hash = compute_files_hash(args.files)
    db_path = get_cache_db_path(files_hash)
    cached_table_map = load_table_map(files_hash)

    if cached_table_map and db_path.exists():
        logger.info("Cache hit! Using cached database: %s", db_path)
        con = duckdb.connect(str(db_path), read_only=True)
        table_map = cached_table_map
        logger.info(
            "Loaded %s table(s) from cache: %s",
            len(table_map),
            ", ".join(table_map.keys()),
        )
    else:
        logger.info("Loading files (first time, will cache for future use)...")
        con = duckdb.connect(str(db_path))
        table_map = load_files(con, args.files)

        if not table_map:
            logger.error("No tables were loaded. Check file paths and formats.")
            con.close()
            with suppress(OSError):
                db_path.unlink()
            return 1

        save_table_map(files_hash, table_map)
        logger.info("\nLoaded %s table(s): %s", len(table_map), ", ".join(table_map.keys()))
        logger.info("Cached database saved to: %s", db_path)

    try:
        if args.action == "inspect":
            action_inspect(con, table_map)
        elif args.action == "query":
            action_query(con, args.sql, table_map, args.output_file)
        else:
            action_summary(con, args.table, table_map)
    finally:
        con.close()

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as exc:
        logger.error("%s", exc)
        raise SystemExit(1) from exc
