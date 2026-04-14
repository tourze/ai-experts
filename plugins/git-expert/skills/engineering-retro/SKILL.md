---
name: engineering-retro
description: 按时间窗口生成基于 Git 历史的工程回顾，输出提交量、改动规模、活跃时段、热点文件、作者亮点与可选的 PR 指标。适用于“这周发了什么”“做个 sprint retro”“看最近 30 天开发节奏”等场景。
metadata:
  version: 1.1.0
  category: review
  tags: [retrospective, velocity, git-analysis, sprint]
  difficulty: intermediate
---

# 工程回顾

## 适用场景

- 用户要按 `24h`、`7d`、`14d`、`30d` 回顾最近交付情况。
- 需要从 Git 历史提炼开发节奏、热点模块、提交聚焦度和作者亮点。
- 单仓库或 monorepo 子目录都要支持，例如 `/engineering-retro 14d services/api`。

## 核心约束

- 默认只读：不改分支、不改索引、不改工作树，也不要顺手修改 `.gitignore`。
- 若用户明确要求保留快照供下次环比，才允许在 `.engineering-retros/` 写 JSON；否则只输出报告。
- 默认分支必须动态探测，失败就明确说明，禁止猜 `main` 或 `master`。
- 时区必须取系统实际值 `date +%Z`，不要写死。
- 需要尊重路径范围；一旦传了 `PATH_SCOPE`，所有 Git 命令都要带 `-- <PATH_SCOPE>`。
- 作者统计只用于说明贡献分布，不做绩效评价。

## 代码模式

### 1. 参数约定

```text
/engineering-retro [TIME_WINDOW] [PATH_SCOPE]
```

- `TIME_WINDOW` 可选：`24h`、`7d`（默认）、`14d`、`30d`
- `PATH_SCOPE` 可选：如 `services/api`

### 2. 环境探测

```bash
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
if [ -z "$DEFAULT_BRANCH" ]; then
  DEFAULT_BRANCH=$(git remote show origin 2>/dev/null | grep 'HEAD branch' | awk '{print $NF}')
fi
TZ_NAME=$(date +%Z)
```

### 3. 原始数据采集

```bash
git log origin/$DEFAULT_BRANCH --since="$SINCE" --format="%H|%aI|%aN|%s" -- $PATH_SCOPE
git log origin/$DEFAULT_BRANCH --since="$SINCE" --numstat --format="%H" -- $PATH_SCOPE
git log origin/$DEFAULT_BRANCH --since="$SINCE" --name-only --format="" -- $PATH_SCOPE | sort | uniq -c | sort -rn | head -20
```

- 抓提交、作者、时间、标题、文件数、增删行。
- 再基于时间戳做工作时段直方图和 session 聚合。

### 4. 指标计算

- 总提交数、唯一贡献者数、唯一文件数、增加行、删除行、净增量、平均提交规模。
- 聚焦度：`<= 3` 文件的提交数 ÷ 总提交数。
- 热点文件：按“被多少个提交触达”排序，超过 50% 提交触达记为 hotspot。
- 若远端是 GitHub 且 `gh` 可用，再拉 merged PR 做体量分布与评审时效。

### 5. 可选快照

仅当用户明确要求“留一份供下次对比”时，才写：

```text
.engineering-retros/<YYYY-MM-DD>.json
```

推荐结构：

```json
{
  "date": "YYYY-MM-DD",
  "window": "7d",
  "path_scope": null,
  "branch": "main",
  "timezone": "PST",
  "metrics": {
    "commits": 0,
    "contributors": 0,
    "files_changed": 0,
    "lines_added": 0,
    "lines_removed": 0,
    "net_delta": 0,
    "focus_score": 0.0
  }
}
```

### 6. 交付结构

- `Metrics`：核心数字摘要。
- `Time Patterns`：峰值日期、峰值时段、文本直方图、session 概览。
- `Work Breakdown`：按 feature/fix/refactor/docs/test/chore 等分类。
- `Hotspots`：Top 文件与 hotspot 标记。
- `Contributor Highlights`：按作者字母序列亮点。
- `PR Summary`：可用时输出。
- `Week-over-Week`：仅在已有上次快照时输出。
- `Observations`：基于数据的 2-4 条观察，不臆测个人动机。

## 检查清单

- 默认分支和时区是否来自实时探测。
- `PATH_SCOPE` 是否在所有 Git 命令里都被带上。
- 提交分类是否先看 Conventional Commit 前缀，再用 diff 特征兜底。
- PR 统计是否在 GitHub/`gh` 不可用时优雅跳过。
- 若用户没要求落盘，是否保持纯只读输出。
- 若需要环比，是否明确说明使用了本次或历史快照。

## 反模式

- 一边写“只读分析”，一边又默认去改 `.gitignore` 或生成文件。
- 默认把主分支写死成 `main`，在 `master` 或企业仓库里直接失真。
- 把作者统计写成“谁效率高/谁效率低”的人事评价。
- 在 monorepo 场景忽略路径范围，导致回顾结果被无关目录污染。
