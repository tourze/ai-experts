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
