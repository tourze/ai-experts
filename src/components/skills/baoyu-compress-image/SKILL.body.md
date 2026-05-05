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
