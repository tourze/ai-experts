## 代码模式

### 1. 查看帮助

```bash
node scripts/main.mjs --help
```

### 2. 单文件压缩

```bash
node scripts/main.mjs image.png --format webp --quality 80
```

### 3. 保留原图

```bash
node scripts/main.mjs image.png --format png --quality 75 --keep
```

### 4. 目录批处理

```bash
node scripts/main.mjs ./imgs --recursive --quality 72 --json
```

输出字段与行为要点：

- `input`：原文件绝对路径。
- `output`：压缩后的目标路径。
- `ratio`：`outputSize / inputSize`。
- 批处理模式下，如果所有文件都失败，脚本会直接报错而不是输出空摘要。

## 反模式

### FAIL: 误删源文件

```bash
node scripts/main.mjs ./imgs --recursive --quality 70
# 默认 --keep=false → 100 张原图被删
# 用户：”我的原图呢？”
```

### PASS: --keep 显式

```bash
node scripts/main.mjs ./imgs --recursive --quality 70 --keep
# 或：先备份 → cp -r ./imgs ./imgs.bak → 再压
```

### FAIL: 批处理传 --output

```bash
node scripts/main.mjs ./imgs --output ./out --recursive
# Error: --output 仅支持单文件
# 用户困惑
```

### PASS: 单/批分清

```bash
# 单文件：可改名
node scripts/main.mjs photo.png --output thumbnail.webp --quality 70

# 批处理：原地改后缀
node scripts/main.mjs ./imgs --recursive --quality 70 --keep
```
