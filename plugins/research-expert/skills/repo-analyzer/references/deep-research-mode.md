# GitHub API 深度研究模式

适用于演进时间线、架构演进、竞品对比等需要一手数据的深度研究场景（原 `github-deep-research` 能力）。

## 第 1 步：拉一手基线数据

```bash
node scripts/github_api.mjs <owner> <repo> summary
node scripts/github_api.mjs <owner> <repo> readme
node scripts/github_api.mjs <owner> <repo> tree
node scripts/github_api.mjs <owner> <repo> releases
node scripts/github_api.mjs <owner> <repo> tags
```

可用命令：`summary` / `info` / `readme` / `tree` / `languages` / `contributors` / `commits` / `issues` / `prs` / `releases` / `tags` / `search-issues <query>`。

## 第 2 步：四轮研究顺序

1. **GitHub API**：确认默认分支、语言、star、release、目录结构、issue/PR 热点。
2. **官方站点 + 核心资料搜索**：补 README 未覆盖的背景信息。
3. **技术深挖**：聚焦架构、路线图、竞品与使用门槛。
4. **时间线与社区层**：核对关键版本、重大转折、争议点与维护状态。

## 第 3 步：报告骨架

复用 [assets/report_template.md](../assets/report_template.md)，至少保留：元信息、执行摘要、时间线、关键分析、架构 / 系统总览、指标与影响分析、对比分析、优势与不足、信息来源、置信度评估。

## 引用与时间戳规则

- 每个外部来源结论后立即追加内联引用：

```markdown
该项目在 2025 年 3 月切换到新的协调架构 [citation:Release v2.0](https://github.com/owner/repo/releases/tag/v2.0)。
```

- 日期冲突时优先信 GitHub 时间戳：release date > tag date > commit date > 转载文章。
- 事实 / 观点 / 推断之间做清晰分层。

## 反模式

### FAIL: 仓库未定就深挖

用户："帮我研究 RAG 框架"，直接深挖 LangChain（凭印象选）。先用 `github-repo-search` 给 Top 5 候选，用户选定后再切到模式 B。

### FAIL: 只看 README + star

漏看：最近 commit 6 个月前 / 100+ 未关 issue / 核心维护者已离开。基线必看 summary（活跃度）/ releases（节奏）/ issues / PR（响应时效）/ contributors（核心维护者是否还在）/ tree（架构现状）。

### FAIL: 转载时间当里程碑

报告"2024 年 9 月切换到新架构（来源：某博客）"，实际原 release 是 2024 年 3 月。优先 GitHub 时间戳。
