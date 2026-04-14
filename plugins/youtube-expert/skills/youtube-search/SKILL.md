---
name: youtube-search
description:
  "按关键词搜索 YouTube，并输出结构化结果。底层使用 yt-dlp 的 ytsearch，
  不需要 API Key；适合做视频发现、选题调研、内容源搜集。用户提到搜 YouTube、
  找教程、找最近/最热门的视频、列候选清单时使用。如果用户已经给出单条视频链接并要总结内容，
  改用 youtube-analysis。"
metadata:
  version: 1.2.0
  category: research
  tags: [youtube, search, discovery]
  difficulty: beginner
---

# YouTube 视频搜索

## 适用场景

- 用户要“搜一下 YouTube 上有哪些视频”“找教程”“列几个候选视频”“看看这个主题最近有什么视频”。
- 用户需要标题、频道、观看量、URL 这类结构化结果，方便后续筛选。
- 用户先做发现，再把选中的单条视频交给 [youtube-analysis](../youtube-analysis/SKILL.md) 深挖。

## 核心约束

- 默认使用 `yt-dlp ytsearch + --dump-single-json --flat-playlist`，字段是“尽力而为”。
- 在 flat search 模式下，`upload_date`、`duration_string` 等字段可能为空；缺失时要明确说明，不要伪造。
- 本技能不负责下载视频、不负责音视频转码，也不承诺绕过 YouTube 的反爬限制。
- 插件内已经提供 `scripts/search_youtube.py`，优先用它，不要再依赖手写 `jq` 管道。
- 用户已经给出明确视频链接且诉求是“总结内容”时，不要继续搜索，直接切到 [youtube-analysis](../youtube-analysis/SKILL.md)。

## 代码模式

### 文件入口

- `scripts/search_youtube.py`：执行搜索、规范化字段、支持排序与近 N 天过滤。

### 基础搜索

```bash
uv run --with yt-dlp --no-project \
  python plugins/youtube-expert/skills/youtube-search/scripts/search_youtube.py \
  "claude code skills" \
  --count 5 \
  --format table
```

### 输出 JSON

```bash
uv run --with yt-dlp --no-project \
  python plugins/youtube-expert/skills/youtube-search/scripts/search_youtube.py \
  "claude code mcp servers" \
  --count 5 \
  --format json
```

### 按观看量排序

```bash
uv run --with yt-dlp --no-project \
  python plugins/youtube-expert/skills/youtube-search/scripts/search_youtube.py \
  "AI agents" \
  --count 10 \
  --sort views \
  --format table
```

### 过滤最近 N 天

```bash
uv run --with yt-dlp --no-project \
  python plugins/youtube-expert/skills/youtube-search/scripts/search_youtube.py \
  "claude code tutorial" \
  --count 10 \
  --days 30 \
  --format json
```

### 只输出 URL，交给其他流程继续处理

```bash
uv run --with yt-dlp --no-project \
  python plugins/youtube-expert/skills/youtube-search/scripts/search_youtube.py \
  "claude code hooks" \
  --count 5 \
  --format urls
```

标准化输出字段：

- `id`
- `title`
- `url`
- `channel`
- `view_count`
- `duration_string`
- `upload_date`
- `description`

## 检查清单

- 查询词先收窄到主题本身，不要把分析诉求和搜索词混在一起。
- 需要“最近”或“热门”时，显式指定 `--days` 或 `--sort`，不要靠自然语言脑补。
- 如果 `upload_date` / `duration_string` 为空，要告诉用户这是 YouTube flat search 的字段缺失，不是脚本 bug。
- 用户选中具体视频后，切到 [youtube-analysis](../youtube-analysis/SKILL.md) 做内容分析。
- YouTube 触发 bot challenge 时，直接说明失败原因；不要把空结果伪装成“没有搜到”。

## 反模式

- 不要把本技能当下载器或音视频抓取器使用。
- 不要继续保留未落地的交叉引用或伪命令占位符。
- 不要承诺“发布日期一定有”；在 flat 模式下它本来就可能缺失。
- 不要在用户已经给出视频 URL 并要求总结内容时继续搜索，这会偏离任务。
