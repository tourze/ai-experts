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
