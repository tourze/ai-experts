---
name: engineering-retro
description: 当用户需要回顾最近一段时间的开发进度、提交量或热点文件时使用。
context: fork
agent: git-expert:git-historian
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

推荐字段：顶层 `date / window / path_scope / branch / timezone`，嵌套 `metrics { commits, contributors, files_changed, lines_added, lines_removed, net_delta, focus_score }`。

### 6. 交付结构

- `Metrics`：核心数字摘要。
- `Time Patterns`：峰值日期、峰值时段、文本直方图、session 概览。
- `Work Breakdown`：按 feature/fix/refactor/docs/test/chore 等分类。
- `Thematic Clusters`：先按主题聚类再叙事（"支付重构"/"CI 提速" 等），每簇给主题名 + commit 数 + 2-3 个核心文件 + 一句话叙事。先聚类再罗列。
- `Hotspots`：Top 文件与 hotspot 标记。
- `Contributor Highlights`：按作者字母序列亮点。
- `PR Summary`：可用时输出。
- `Week-over-Week`：仅在已有上次快照时输出。
- `Observations`：基于数据的 2-4 条观察，不臆测动机。每条必须附量化引用 `（N commits · files: a.py, b.py）`；无证据不写。

## 检查清单

- 默认分支和时区是否来自实时探测。
- `PATH_SCOPE` 是否在所有 Git 命令里都被带上。
- 提交分类是否先看 Conventional Commit 前缀，再用 diff 特征兜底。
- PR 统计是否在 GitHub/`gh` 不可用时优雅跳过。
- 若用户没要求落盘，是否保持纯只读输出。
- 若需要环比，是否明确说明使用了本次或历史快照。

## 反模式

### FAIL: 只读但默认写文件

```
“我先生成快照供下次环比”
→ 写 .engineering-retros/2026-04-16.json
→ 用户：”我没让你写文件”
→ 工作树脏 / 被误提交
```

### PASS: 显式开关

```
默认：纯输出报告，零文件写入
仅当用户明确说”留快照”才写
.engineering-retros/ 加进 .gitignore（但不要顺手改）
```

### FAIL: 作者统计当绩效

```md
“Alice 提交 50 次，Bob 仅 10 次 → Alice 更勤奋”
→ Bob 在做架构重构 + code review
→ 错误归因 → 团队矛盾
```

### PASS: 中性描述贡献分布

```md
## Contributors（按字母）
- Alice：50 commits，主要在 services/api
- Bob：10 commits + 35 PR reviews，主要在 architecture/
观察：贡献形态不同，commit 数不能横比
```
