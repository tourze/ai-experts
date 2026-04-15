---
name: data-analysis
description: 当用户上传或指定 .xlsx、.csv 等表格文件，需要分析数据并给出结论时使用。
---

# data-analysis

## 适用场景

- 用户给出一个或多个本地 `.xlsx` / `.csv` 文件路径，希望先看结构、再做筛选、聚合、对比、导出。
- 需要快速回答“有哪些列”“每列是什么类型”“哪几行最可疑”“这个维度怎么汇总”。
- 需要在多张表或多个文件之间做 join、group by、窗口函数类分析。
- 相关 skill：[statistical-analysis](../statistical-analysis/SKILL.md)、[data-visualization](../data-visualization/SKILL.md)、[data-storytelling](../data-storytelling/SKILL.md)。

## 核心约束

- 先 `inspect`，再 `query` 或 `summary`；没看清表结构就直接写 SQL，命中率会很差。
- 只处理显式给出的本地文件路径；不要假设上传目录，也不要猜测文件名。
- 当前脚本直接支持 `.xlsx` 与 `.csv`；旧式 `.xls` 需要先转存为 `.xlsx`。
- `scripts/analyze.py` 依赖 `duckdb`；分析 `.xlsx` 还依赖 `openpyxl`。缺依赖时先报错并给安装建议，不自动联网装包。
- 导出结果只支持 `.csv`、`.json`、`.md`。

## 代码模式

```bash
python3 scripts/analyze.py \
  --files /absolute/path/sales.xlsx \
  --action inspect
```

```bash
python3 scripts/analyze.py \
  --files /absolute/path/sales.csv /absolute/path/customers.csv \
  --action query \
  --sql 'SELECT region, SUM(amount) AS revenue FROM sales GROUP BY region ORDER BY revenue DESC'
```

```bash
python3 scripts/analyze.py \
  --files /absolute/path/sales.xlsx \
  --action query \
  --sql 'SELECT * FROM sales LIMIT 20' \
  --output-file /absolute/path/query-result.md
```

## 检查清单

- 文件路径是否真实存在，扩展名是否在支持范围内。
- 是否已经通过 `inspect` 确认过表名、列名、类型、空值分布。
- SQL 是否只引用了实际存在的表和列。
- 导出路径扩展名是否正确，是否需要交给 [data-visualization](../data-visualization/SKILL.md) 或 [data-storytelling](../data-storytelling/SKILL.md) 做后续表达。
- 如果需求涉及显著性检验、异常解释或统计边界，是否切换到 [statistical-analysis](../statistical-analysis/SKILL.md)。

## 反模式

- 看到 Excel 就直接把它当数据库 schema 使用，不先检查 sheet 名和列名。
- 把 `.xls` 当成 `.xlsx` 使用，或者默认脚本会自动帮你转换。
- 缺少 `duckdb` / `openpyxl` 时让脚本在 import 阶段偷偷装依赖。
- 还没明确业务问题就机械地跑一堆聚合，最后输出没有决策价值的表格。
