---
name: github-deep-research
description: 对单个 GitHub 仓库做多轮深度研究，结合 GitHub API、官方文档、技术文章与社区讨论生成带时间线、指标、对比与引用的报告。适用于“深挖这个仓库”“做演进时间线”“分析架构与竞争格局”等场景。
---

# GitHub 深度研究

## 适用场景

- 用户已经锁定了某个 GitHub 仓库，要做深入分析而不是简单搜索。
- 需要还原项目时间线、架构演进、社区热度、发布节奏、核心贡献者与竞品对比。
- 若用户还没锁定仓库，只是要先筛项目列表，优先使用 `github-repo-search`。

## 核心约束

- 第一轮必须先跑同目录 `scripts/github_api.py`，用仓库一手数据建立基线。
- 外部结论必须内联引用，且要区分“源码/官方事实”和“社区观点/推断”。
- 官方文档、仓库 README、release、issue、PR 的优先级高于新闻与社区二手文章。
- 日期冲突时优先信 GitHub 时间戳，不要被转载文章误导。
- 写报告时应复用 `assets/report_template.md` 的章节骨架，不要临时拼凑结构。

## 代码模式

### 1. 先拿 GitHub 基线数据

```bash
python3 scripts/github_api.py <owner> <repo> summary
python3 scripts/github_api.py <owner> <repo> readme
python3 scripts/github_api.py <owner> <repo> tree
python3 scripts/github_api.py <owner> <repo> releases
python3 scripts/github_api.py <owner> <repo> tags
```

可用命令：

- `summary`
- `info`
- `readme`
- `tree`
- `languages`
- `contributors`
- `commits`
- `issues`
- `prs`
- `releases`
- `tags`
- `search-issues <query>`

### 2. 多轮研究顺序

- 第 1 轮：GitHub API，确认默认分支、语言、star、release、目录结构、issue/PR 热点。
- 第 2 轮：官方站点与核心资料搜索，补 README 未覆盖的背景信息。
- 第 3 轮：技术深挖，聚焦架构、路线图、竞品与使用门槛。
- 第 4 轮：时间线与社区层，核对关键版本、重大转折、争议点与维护状态。

### 3. 报告结构

使用 `assets/report_template.md` 生成报告，至少保留：

- 元信息
- 执行摘要
- 时间线
- 关键分析
- 架构 / 系统总览
- 指标与影响分析
- 对比分析
- 优势与不足
- 信息来源
- 置信度评估

### 4. 引用格式

每个来自外部来源的判断后都立即追加内联引用：

```markdown
该项目在 2025 年 3 月切换到新的协调架构 [citation:Release v2.0](https://github.com/owner/repo/releases/tag/v2.0)。
```

## 检查清单

- 是否先跑了 `scripts/github_api.py`，而不是直接上网搜二手资料。
- 是否把关键日期和版本号都回源到 release、tag、commit 或 PR。
- 是否在“事实”“观点”“推断”之间做了清晰分层。
- 是否每个外部结论后都有内联引用。
- 是否在用户语言下输出，并沿用模板的完整章节结构。

## 反模式

- 用户还没确定仓库，就直接进入单仓库深挖。
- 只看 README 和 star 数，不看 releases、issues、PR、tree 与最近提交。
- 报告写成一堆无来源断言，无法回查。
- 把社区情绪当成源码事实，把转载时间当成项目里程碑时间。
