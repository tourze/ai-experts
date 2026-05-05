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
