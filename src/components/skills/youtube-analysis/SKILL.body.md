## 代码模式

### 文件入口

- `procedure youtube-analysis-fetch-transcript`：抓字幕与元数据，输出 JSON。
- `procedure youtube-analysis-analyze-video`：生成 Markdown 脚手架，便于后续人工或模型补全分析。
- `procedure youtube-analysis-utils`：URL 解析、时间戳格式化、字幕分块。
- `assets/output-template.md`：脚手架模板。

### 直接抓取字幕 JSON

调用对应 procedure；具体用法、参数和示例命令见下方 **Procedure 调用说明**。

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

调用对应 procedure；具体用法、参数和示例命令见下方 **Procedure 调用说明**。

可选参数与脚本保持一致：

- `--depth quick|standard|deep`
- `--type auto|lecture|tutorial|interview|podcast|tech-talk|panel`
- `--lang <语言代码>`
- `--json`
- `--output <输出路径>`

### 深度分析时按时间分块

先调用 `procedure youtube-analysis-fetch-transcript` 获取 JSON，再按 `transcript` 中的时间戳和文本字段在当前上下文中分块分析；不要尝试从 dist 中 import procedure 源码。
