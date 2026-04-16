---
name: baoyu-compress-image
description: 当用户要压缩图片、转成 WebP 或导出更小的 PNG/JPEG 时使用。
---

# 图片压缩器

## 适用场景

- 单张图片需要压成更小的 `webp`、`png` 或 `jpeg`。
- 一整个目录里的说明图、插图需要批量减重。
- 文章配图生成后，需要在提交前统一压缩。
- 如果目标是重新设计图片内容而不是压缩体积，改用 [concept-to-image](../concept-to-image/SKILL.md)。

## 核心约束

- 单文件既可以用 `bun` 运行，也可以用 `npx -y tsx` 作为回退。
- `--output` 只支持单文件输入；目录批处理时禁止传自定义输出路径。
- 默认 `--keep=false`，表示成功转码后删除原文件；只有显式加 `--keep` 才保留源文件。
- 目录模式默认不递归；需要跨子目录时必须显式加 `--recursive`。
- 压缩后端按“系统工具优先、`sharp` 兜底”顺序选择；如果没有任何后端，先补依赖再运行。

## 代码模式

### 1. 查看帮助

```bash
bun scripts/main.ts --help
# 或
npx -y tsx scripts/main.ts --help
```

### 2. 单文件压缩

```bash
npx -y tsx scripts/main.ts image.png --format webp --quality 80
```

### 3. 保留原图

```bash
npx -y tsx scripts/main.ts image.png --format png --quality 75 --keep
```

### 4. 目录批处理

```bash
npx -y tsx scripts/main.ts ./imgs --recursive --quality 72 --json
```

输出字段与行为要点：

- `input`：原文件绝对路径。
- `output`：压缩后的目标路径。
- `ratio`：`outputSize / inputSize`。
- 批处理模式下，如果所有文件都失败，脚本会直接报错而不是输出空摘要。

## 检查清单

- 已确认输入是单文件还是目录。
- 目录模式下没有误传 `--output`。
- `quality` 在 `0-100` 范围内。
- 选择的输出格式与后缀一致：`webp`、`png`、`jpeg`。
- 若未传 `--keep`，已确认源文件会在成功转码后删除。
- 若需要链到文章配图流程，先跑 [baoyu-article-illustrator](../baoyu-article-illustrator/SKILL.md)，再做统一压缩。

## 反模式

### FAIL: 误删源文件

```bash
npx -y tsx scripts/main.ts ./imgs --recursive --quality 70
# 默认 --keep=false → 100 张原图被删
# 用户：”我的原图呢？”
```

### PASS: --keep 显式

```bash
npx -y tsx scripts/main.ts ./imgs --recursive --quality 70 --keep
# 或：先备份 → cp -r ./imgs ./imgs.bak → 再压
```

### FAIL: 批处理传 --output

```bash
npx -y tsx scripts/main.ts ./imgs --output ./out --recursive
# Error: --output 仅支持单文件
# 用户困惑
```

### PASS: 单/批分清

```bash
# 单文件：可改名
npx -y tsx scripts/main.ts photo.png --output thumbnail.webp --quality 70

# 批处理：原地改后缀
npx -y tsx scripts/main.ts ./imgs --recursive --quality 70 --keep
```
