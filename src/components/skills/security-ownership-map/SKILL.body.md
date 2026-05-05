## 代码模式
```bash
node scripts/run_ownership_map.mjs \
  --repo /path/to/repo \
  --out ownership-map-out \
  --since '12 months ago' \
  --emit-commits

node scripts/query_ownership.mjs --data-dir ownership-map-out summary --section bus_factor_hotspots
node scripts/community_maintainers.mjs --data-dir ownership-map-out --file src/auth/session.go --top 5
```
