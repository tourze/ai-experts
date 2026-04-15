---
name: baoyu-article-illustrator
description: 当用户要给文章配图、按段落补解释图或为长文批量生成插图时使用；如果只需要单张静态图，改用 concept-to-image。
version: 1.57.0
metadata:
  openclaw:
    homepage: https://github.com/JimLiu/baoyu-skills#baoyu-article-illustrator
---

# 文章配图器

## 适用场景

- 已有 Markdown/文本文章，需要按章节或段落补图。
- 需要把抽象概念、流程、对比关系转成说明图，而不是只做装饰性图片。
- 需要先产出 `outline.md`、提示词文件，再批量调用外部出图工具。
- 如果只是做单张图、海报或静态概念图，改用 [concept-to-image](../concept-to-image/SKILL.md)。
- 如果批量生成后的图片还要压缩体积，串接 [baoyu-compress-image](../baoyu-compress-image/SKILL.md)。

## 核心约束

- 先检查 `EXTEND.md`，没找到就先完成首配流程，不能跳过。
- 先分析文章，再统一提问；确认问题只能合并成一次 `AskUserQuestion`，总数不超过 4 个。
- 先写 `outline.md` 与 `prompts/*.md`，再触发任何出图动作；禁止直接把临时 prompt 通过命令行内联传递。
- `prompts/*.md` 文件名必须和 `outline.md` 的插图编号保持一致，例如 `01-infographic-cache.md`。
- 隐喻类内容要画“底层机制”，不要把比喻字面化。
- 输入是粘贴文本而不是文件路径时，默认输出到 `illustrations/{topic-slug}/`。

## 代码模式

### 1. 预检查与偏好读取

```bash
test -f .baoyu-skills/baoyu-article-illustrator/EXTEND.md && echo "project"
test -f "${XDG_CONFIG_HOME:-$HOME/.config}/baoyu-skills/baoyu-article-illustrator/EXTEND.md" && echo "xdg"
test -f "$HOME/.baoyu-skills/baoyu-article-illustrator/EXTEND.md" && echo "user"
```

需要完整流程时，优先阅读：

- [references/workflow.md](references/workflow.md)
- [references/config/first-time-setup.md](references/config/first-time-setup.md)
- [references/prompt-construction.md](references/prompt-construction.md)

### 2. 生成 `outline.md`

`outline.md` 至少包含编号、插图位置、目的、可视内容和输出文件名：

```md
## Illustration 1
**Position**: 第 2 节第 1 段后
**Purpose**: 解释缓存失效链路
**Visual Content**: 请求、缓存、数据库三层关系
**Filename**: 01-flowchart-cache-invalidation.png
```

### 3. 生成批处理 JSON

当 `outline.md` 与 `prompts/` 都准备好后，优先使用批量构建脚本：

```bash
npx -y tsx scripts/build-batch.ts \
  --outline outline.md \
  --prompts prompts \
  --output batch.json \
  --images-dir imgs \
  --provider replicate \
  --model google/nano-banana-pro \
  --ar 16:9 \
  --quality 2k
```

脚本行为要点：

- `--outline`、`--prompts`、`--output` 必填。
- `--jobs` 若提供，必须是正整数。
- 如果没有任何可匹配的提示词文件，脚本会直接报错而不是输出空批次。

## 检查清单

- 已确认文章输入类型：文件路径还是粘贴文本。
- 已确认 `EXTEND.md` 是否存在；不存在时先做首配，不提前问风格问题。
- `outline.md` 中每个 `Filename` 都能在 `prompts/` 找到对应编号的 `.md`。
- 批量 JSON 中每个任务都落在正确的输出目录。
- 插图引用路径使用相对路径，插入位置与 `outline.md` 保持一致。
- 批量出图后，如需减重，再交给 [baoyu-compress-image](../baoyu-compress-image/SKILL.md)。

## 反模式

- 没有 `outline.md` 就直接生成图片。
- 为了省事跳过 `EXTEND.md` 检查，或者把首配和正式配置问答混在一起。
- 用字面图解去画隐喻句子，导致图片“像插画，不像说明图”。
- 提示词不落盘，只在命令里拼接临时字符串。
- 一个段落一个问题地来回追问，破坏一次性确认设置的约束。
