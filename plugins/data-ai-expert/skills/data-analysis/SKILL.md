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

### FAIL: 不 inspect 直接 SQL

```bash
# 用户说 "分析销售数据"
python3 scripts/analyze.py --files sales.xlsx \
  --action query --sql "SELECT region, SUM(revenue) FROM sales GROUP BY region"
# Error: column "revenue" does not exist
# 实际列名是 "Revenue (USD)"，sheet 名也不是 "sales"
```

### PASS: inspect → query

```bash
# Step 1: 先看结构
python3 scripts/analyze.py --files sales.xlsx --action inspect
# → 输出：sheet=Sales_2026, columns=[Region, "Revenue (USD)", ...]

# Step 2: 用真实列名
python3 scripts/analyze.py --files sales.xlsx --action query \
  --sql 'SELECT Region, SUM("Revenue (USD)") FROM "Sales_2026" GROUP BY Region'
```

### FAIL: 没问题先聚合

```
用户："这是 12 个月销售数据"
AI：[直接生成 20 张聚合表 + 月环比 + 同比]
→ 用户："我只想知道为什么 9 月跌了"
```

### PASS: 先确认问题

```
AI："你最想回答哪个问题？
  a. 哪个区域贡献最大
  b. 9 月为什么下跌
  c. 哪些客户流失了
→ 用户选 b → 只跑 9 月相关分析
```
