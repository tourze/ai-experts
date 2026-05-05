## 适用场景

- 用户给出单个 `youtube.com` / `youtu.be` 链接，希望你总结内容、提炼概念、输出讲义或会议笔记。
- 用户明确提到“字幕”“转录”“tech talk 拆解”“podcast 摘要”“把这条 YouTube 视频看一遍”。
- 用户先通过 [youtube-search](../youtube-search/SKILL.md) 找到候选视频，再对其中一条做深度分析。

## 核心约束

- 只基于字幕与元数据分析，不做画面、PPT、代码演示或肢体语言的臆测。
- 通过 `yt-dlp` 提取字幕与元数据；脚本本身统一为 Node.js ESM。
- `scripts/analyze_video.mjs` 生成的是“分析脚手架”，其中的 `[TO BE ANALYZED]` 是有意保留的占位符，不代表脚本缺失实现。
- 没有字幕、视频私有、年龄限制或被地区封锁时，必须直接说明限制，不要伪造摘要。
- 需要按视频类型调整提炼重点时，参考 `references/analysis-patterns.md`。

## 代码模式

### 文件入口

- `scripts/fetch_transcript.mjs`：抓字幕与元数据，输出 JSON。
- `scripts/analyze_video.mjs`：生成 Markdown 脚手架，便于后续人工或模型补全分析。
- `scripts/utils.mjs`：URL 解析、时间戳格式化、字幕分块。
- `assets/output-template.md`：脚手架模板。

### 直接抓取字幕 JSON

```bash
node scripts/fetch_transcript.mjs \
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
node scripts/analyze_video.mjs \
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

### 在 Node.js 中调用

```js
import { fetchVideo } from "./scripts/fetch_transcript.mjs";

const data = fetchVideo("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "en");
console.log(data.title, data.language, data.transcript.length);
```

### 深度分析时按时间分块

```js
import { fetchVideo } from "./scripts/fetch_transcript.mjs";
import { chunkTranscript } from "./scripts/utils.mjs";

const data = fetchVideo("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "en");
for (const chunk of chunkTranscript(data.transcript, 5)) {
  console.log(chunk.start_formatted, chunk.end_formatted);
}
```

## 检查清单

- 先确认输入是合法的 YouTube 链接或 11 位视频 ID。
- 需要真实内容而不是占位稿时，优先读取 `scripts/fetch_transcript.mjs` 的 JSON，再在上下文里完成分析。
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
node scripts/fetch_transcript.mjs "$url" --lang en
# 基于 transcript 文本做实质分析
# 输出中 [TO BE ANALYZED] 必须清空
```
