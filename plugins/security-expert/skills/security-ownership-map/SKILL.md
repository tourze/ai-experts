---
name: security-ownership-map
description: "当用户明确希望基于 git 历史构建安全所有权、bus factor、敏感代码归属或 CODEOWNERS 风险画像时使用。"
---

# 安全所有权拓扑分析

## 适用场景
- 需要找出敏感代码无人维护、单点维护者或高风险变更簇。
- 需要把 git 历史与 [security-threat-model](../security-threat-model/SKILL.md) 的资产/边界分析关联起来。
- 需要导出 CSV/JSON 给图数据库或可视化工具。

## 核心约束
- 只用于安全导向的所有权分析，不回答泛化的“谁维护这个仓库”问题。
- 优先缩小时间窗；大仓库默认加 `--since` 或 `--until`。
- 社区检测和 GraphML 输出需要 `networkx`；关闭这两项时核心导出可独立运行。
- 脚本路径以当前 skill 目录为基准；查询、社区分析与构建入口使用 Node.js，构建核心暂仍由 `build_ownership_map.py` 执行。

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

## 检查清单
- 确认时间窗、身份归因方式和敏感规则配置。
- 检查 `summary.json`、`people.csv`、`files.csv` 与 `edges.csv` 是否完整生成。
- 对“隐藏 owner”“低 bus factor”“孤儿敏感代码”分别解释证据。
- 导出图数据前说明 co-change 过滤规则和作者排除规则。

## 反模式

### FAIL: 全量跑大仓库

```bash
node scripts/run_ownership_map.mjs --repo /path/to/monorepo
# 10 年历史 / 500k commits / 跑 4 小时 OOM
```

### PASS: 限定时间窗

```bash
node scripts/run_ownership_map.mjs \
  --repo /path/to/monorepo \
  --since '12 months ago' \
  --paths 'src/auth/**,src/payment/**'
# 只看近 1 年 + 敏感目录，10 分钟出结果
```

### FAIL: 活跃度当安全结论

```md
"src/utils.ts 近 30 天有 50 次提交 → 高风险"
→ 实际：utils.ts 是常用工具，频繁修改是正常的
→ 用错指标，安全注意力被浪费
```

### PASS: 敏感规则 + bus factor

```md
"src/auth/session.go:
  - bus_factor = 1（仅 alice 维护，alice 已 6 个月未提交）
  - 触碰敏感函数：encryptToken, verifyJWT
  - 最近 PR 评审 0 人参与
→ 高风险（孤儿敏感代码 + 无评审）"
```

### FAIL: 把所有 commit author 当 owner

```md
"docs/ 下 60% 文件 zhang3 提交过 → zhang3 是 docs owner"
→ 实际：zhang3 只是修过一次错别字
→ 真正的 owner 是写过实质内容的少数人
```

### PASS: 加权 + 阈值

```md
ownership = lines_changed_weighted_by_recency
排除 docs-only / typo-only commits
只把 contribution > 30% 的人视为 co-owner
```
