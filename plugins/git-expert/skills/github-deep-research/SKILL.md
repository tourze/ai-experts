---
name: github-deep-research
description: 当用户要深挖单个 GitHub 仓库、做演进时间线或分析架构与竞争格局时使用。
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

### FAIL: 仓库未定就深挖

```
用户："帮我研究 RAG 框架"
你：直接深挖 LangChain（凭印象选）
→ 用户："我其实想看 LlamaIndex 和其他 5 个对比"
→ 工作白做
```

### PASS: 先用 github-repo-search

```
用户没指定仓库 → 切到 github-repo-search
→ 给 Top 5 候选 → 用户选定 → 才进入深挖
```

### FAIL: 只看 README + star

```
"该项目 30k star，README 写得清晰，强烈推荐"
→ 漏看：最近 commit 6 个月前 / 100+ 未关 issue / 核心维护者已离开
```

### PASS: 多维度

```
基线必看：
- summary（活跃度）
- releases（节奏）
- issues / PR（响应时效）
- contributors（核心维护者是否还在）
- tree（架构现状）
star 仅作为参考，不做唯一指标
```

### FAIL: 转载时间当里程碑

```
报告："2024 年 9 月切换到新架构（来源：某博客）"
→ 实际：博客是转载，原 release 是 2024 年 3 月
→ 时间线整体偏移
```

### PASS: 优先 GitHub 时间戳

```
日期冲突时：release date > tag date > commit date > 转载文章
```
