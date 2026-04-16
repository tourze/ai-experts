---
name: youtube-analysis
description: "当用户提供 YouTube 视频链接并要求分析内容、总结字幕、拆解演讲或提炼要点时使用。如果用户只是想搜视频而不是分析单个视频，改用 youtube-search。"
---

# YouTube 视频分析

## 适用场景

- 用户给出单个 `youtube.com` / `youtu.be` 链接，希望你总结内容、提炼概念、输出讲义或会议笔记。
- 用户明确提到“字幕”“转录”“tech talk 拆解”“podcast 摘要”“把这条 YouTube 视频看一遍”。
- 用户先通过 [youtube-search](../youtube-search/SKILL.md) 找到候选视频，再对其中一条做深度分析。

## 核心约束

- 只基于字幕与元数据分析，不做画面、PPT、代码演示或肢体语言的臆测。
- 首选 `youtube-transcript-api`；如果字幕库不可用，再回退到 `yt-dlp` 的字幕提取。
- 运行脚本时至少需要 `python`；推荐统一用 `uv run --with ... --no-project` 拉起临时依赖。
- `scripts/analyze_video.py` 生成的是“分析脚手架”，其中的 `[TO BE ANALYZED]` 是有意保留的占位符，不代表脚本缺失实现。
- 没有字幕、视频私有、年龄限制或被地区封锁时，必须直接说明限制，不要伪造摘要。
- 需要按视频类型调整提炼重点时，参考 `references/analysis-patterns.md`。

## 代码模式

### 文件入口

- `scripts/fetch_transcript.py`：抓字幕与元数据，输出 JSON。
- `scripts/analyze_video.py`：生成 Markdown 脚手架，便于后续人工或模型补全分析。
- `scripts/utils.py`：URL 解析、时间戳格式化、字幕分块。
- `assets/output-template.md`：脚手架模板。

### 直接抓取字幕 JSON

```bash
uv run --with youtube-transcript-api --with yt-dlp --no-project \
  python scripts/fetch_transcript.py \
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ" \
  --lang en
```

返回字段包括：

- `video_id`
- `title`
- `channel`
- `duration_seconds`
- `upload_date`
- `transcript`
- `transcript_text`
- `language`
- `source`

### 生成分析脚手架

```bash
uv run --with youtube-transcript-api --with yt-dlp --no-project \
  python scripts/analyze_video.py \
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ" \
  --depth quick \
  --output /tmp/youtube-analysis.md
```

可选参数与脚本保持一致：

- `--depth quick|standard|deep`
- `--type auto|lecture|tutorial|interview|podcast|tech-talk|panel`
- `--lang <语言代码>`
- `--json`
- `--output <输出路径>`

### 在 Python 中调用

```python
import sys
from pathlib import Path

scripts_dir = Path("scripts")
sys.path.insert(0, str(scripts_dir))

from fetch_transcript import fetch_video

data = fetch_video("https://www.youtube.com/watch?v=dQw4w9WgXcQ", lang="en")
print(data["title"], data["language"], len(data["transcript"]))
```

### 深度分析时按时间分块

```python
import sys
from pathlib import Path

scripts_dir = Path("scripts")
sys.path.insert(0, str(scripts_dir))

from fetch_transcript import fetch_video
from utils import chunk_transcript

data = fetch_video("https://www.youtube.com/watch?v=dQw4w9WgXcQ", lang="en")
chunks = chunk_transcript(data["transcript"], chunk_minutes=5)
for chunk in chunks:
    print(chunk["start_formatted"], chunk["end_formatted"])
```

## 检查清单

- 先确认输入是合法的 YouTube 链接或 11 位视频 ID。
- 需要真实内容而不是占位稿时，优先读取 `scripts/fetch_transcript.py` 的 JSON，再在上下文里完成分析。
- 输出结论前确认 `source` 与 `language`，不要把自动字幕误写成官方字幕。
- 如果视频明显依赖画面内容，结尾必须提示“仅基于字幕，视觉信息未覆盖”。
- 用户只是想找视频而不是分析当前视频时，切换到 [youtube-search](../youtube-search/SKILL.md)。
- 生成 Markdown 文件时，确认最终交付是否仍保留 `[TO BE ANALYZED]`；只有用户明确要脚手架时才允许保留。

## 反模式

### FAIL: 无字幕硬总结

```
用户给视频 URL → 脚本返回 “no captions available”
你：”这个视频主要讲了 AI 的未来...”
→ 完全编造
```

### PASS: 明确说明限制

```
“该视频没有字幕或字幕被限制访问。
无法做文本级分析。
建议：
1. 人工听一遍后把要点贴给我
2. 或换一个有字幕的同主题视频”
```

### FAIL: 脚手架占位当答案

```md
# 视频分析

## 核心要点
[TO BE ANALYZED]

## 结论
[TO BE ANALYZED]
```
→ 直接发给用户

### PASS: 完整填充

```bash
# 先拿字幕
uv run ... scripts/fetch_transcript.py “$url” --lang en
# 基于 transcript 文本做实质分析
# 输出中 [TO BE ANALYZED] 必须清空
```
