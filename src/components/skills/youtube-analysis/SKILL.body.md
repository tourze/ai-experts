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
