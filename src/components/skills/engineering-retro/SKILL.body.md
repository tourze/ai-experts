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

## 经验提炼

从代码变更提炼工程教训：见 [references/lesson-learned.md](./references/lesson-learned.md)。
