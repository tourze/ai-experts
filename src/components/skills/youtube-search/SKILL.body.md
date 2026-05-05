## 代码模式

### 文件入口

- `scripts/search_youtube.mjs`：执行搜索、规范化字段、支持排序与近 N 天过滤。

### 基础搜索

```bash
node scripts/search_youtube.mjs \
  "claude code skills" \
  --count 5 \
  --format table
```

### 输出 JSON

```bash
node scripts/search_youtube.mjs \
  "claude code mcp servers" \
  --count 5 \
  --format json
```

### 按观看量排序

```bash
node scripts/search_youtube.mjs \
  "AI agents" \
  --count 10 \
  --sort views \
  --format table
```

### 过滤最近 N 天

```bash
node scripts/search_youtube.mjs \
  "claude code tutorial" \
  --count 10 \
  --days 30 \
  --format json
```

### 只输出 URL，交给其他流程继续处理

```bash
node scripts/search_youtube.mjs \
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
- YouTube 触发 bot challenge 时，直接说明失败原因；不要把空结果伪装成“没有搜到”。

## 反模式

### FAIL: 当下载器使

```
用户：”下载这 10 个视频”
你：跑 search_youtube.mjs 10 次
→ 本技能不做下载 / 不做音视频抓取
```

### PASS: 明确职责边界

```
搜索 / 发现 / 候选清单 → 本技能
单视频字幕分析 → youtube-analysis
下载视频文件 → 不在范围（建议用 yt-dlp 单独处理）
```

### FAIL: flat 字段当真实数据

```
“该视频 1000 万播放，发布于 2024”
→ 实际：flat search 中 view_count 可能为空
→ 数字是前一个结果残留 / 编造
```

### PASS: 缺失字段显式说明

```
“view_count: 1.2M (flat search 估算)
upload_date: [不可用 - YouTube flat mode 限制]
详情需切到 youtube-analysis 单视频抓取”
```
