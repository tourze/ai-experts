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
- 所有脚本路径都以当前 skill 目录为基准，例如 `scripts/run_ownership_map.py`。

## 代码模式
```bash
python3 scripts/run_ownership_map.py \
  --repo /path/to/repo \
  --out ownership-map-out \
  --since '12 months ago' \
  --emit-commits

python3 scripts/query_ownership.py --data-dir ownership-map-out summary --section bus_factor_hotspots
python3 scripts/community_maintainers.py --data-dir ownership-map-out --file src/auth/session.go --top 5
```

## 检查清单
- 确认时间窗、身份归因方式和敏感规则配置。
- 检查 `summary.json`、`people.csv`、`files.csv` 与 `edges.csv` 是否完整生成。
- 对“隐藏 owner”“低 bus factor”“孤儿敏感代码”分别解释证据。
- 导出图数据前说明 co-change 过滤规则和作者排除规则。

## 反模式
- 不设时间窗就对超大仓库全量跑历史。
- 把普通代码活跃度统计当成安全结论。
- 文档示例写绝对错路径或不存在的参数。
