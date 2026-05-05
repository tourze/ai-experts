## 代码模式

```bash
node scripts/analyze.mjs \
  --files /absolute/path/sales.xlsx \
  --action inspect
```

```bash
node scripts/analyze.mjs \
  --files /absolute/path/sales.csv /absolute/path/customers.csv \
  --action query \
  --sql 'SELECT region, SUM(amount) AS revenue FROM sales GROUP BY region ORDER BY revenue DESC'
```

```bash
node scripts/analyze.mjs \
  --files /absolute/path/sales.xlsx \
  --action query \
  --sql 'SELECT * FROM sales LIMIT 20' \
  --output-file /absolute/path/query-result.md
```

## 反模式

### FAIL: 不 inspect 直接 SQL

```bash
# 用户说 "分析销售数据"
node scripts/analyze.mjs --files sales.xlsx \
  --action query --sql "SELECT region, SUM(revenue) FROM sales GROUP BY region"
# Error: column "revenue" does not exist
# 实际列名是 "Revenue (USD)"，sheet 名也不是 "sales"
```

### PASS: inspect → query

```bash
# Step 1: 先看结构
node scripts/analyze.mjs --files sales.xlsx --action inspect
# → 输出：sheet=Sales_2026, columns=[Region, "Revenue (USD)", ...]

# Step 2: 用真实列名
node scripts/analyze.mjs --files sales.xlsx --action query \
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
