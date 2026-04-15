---
name: technology-search
description: 需要搜索技术博客、开发者社区、官方博客与科技媒体的最新资讯时使用，适用于编程语言、框架、AI、硬件、DevOps、安全、操作系统等技术主题。
---

# 技术资讯搜索

## 适用场景

- 用户要查“某项技术最近有什么新动态”“这个框架最近发布了什么”“某个 AI / 硬件话题现在有哪些报道”。
- 主题明确属于软件、硬件、AI、基础设施、安全或开发者生态。
- 需要从多技术媒体和社区里取回结构化结果，再由模型翻译和归纳。
- 如果需要进一步汇总结论，转到 [knowledge-synthesis](../knowledge-synthesis/SKILL.md)；如果拿到单篇 URL 正文，转到 [web-content-fetcher](../web-content-fetcher/SKILL.md)。

## 核心约束

- 只在“技术主题”下使用，泛社会新闻不要走这个 skill。
- 脚本输出已经是 JSON，先读结构化结果，再决定是否翻译和分层展示。
- 默认启用智能路由：按关键词映射领域，仅查询相关源；必要时可加 `--all-sources`。
- 当前实现只依赖本 skill 自带的 RSS/API 数据源，不再假定存在仓库外的额外搜索脚本回退链路。
- 对“最新 / 今天 / 本周”类问题，要在最终答案里保留真实日期上下文。

## 代码模式

```bash
# <skill_dir> 为当前 SKILL.md 所在目录
bash "<skill_dir>/scripts/search-news.sh" "Electron" --limit 15 --max-per-source 5

# 搜索全部可用源，关闭智能路由
bash "<skill_dir>/scripts/search-news.sh" "OpenAI" --all-sources --limit 10

# 仅保留近 3 天结果
bash "<skill_dir>/scripts/search-news.sh" "Kubernetes" --max-age 3 --limit 12
```

```text
推荐输出流程
1. 提取关键词
2. 运行脚本，读取 JSON
3. 按 heat_score 排序分层
4. 对英文标题/摘要做中文翻译
5. 标注来源、发布时间、热度和是否为推荐项
```

## 检查清单

- 命令是否使用了当前目录下的 `scripts/search-news.sh` 或 `scripts/search-news.ps1`。
- 是否根据用户时效要求设置了合理的 `--max-age`。
- 是否区分“精准匹配结果”和“推荐补位结果”。
- 是否在输出里保留来源、发布时间和热度。
- 是否在需要时把结果交给 [knowledge-synthesis](../knowledge-synthesis/SKILL.md) 做二次归纳。

## 反模式

- 把非技术新闻丢给这个 skill。
- 假设存在仓库外的额外搜索脚本并把它当成必备依赖。
- 只展示标题，不展示来源与发布时间。
- 用户要求“最近”，结果却混入大量过旧内容。
- 没有看 JSON 结构，就直接把 stderr 日志当答案。
