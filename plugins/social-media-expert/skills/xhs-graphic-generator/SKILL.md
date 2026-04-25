---
name: xhs-graphic-generator
description: 当用户生成小红书图文笔记、封面卡片或系列知识卡时使用；英文触发词 xiaohongshu / XHS / 小红书图文。
---

# 小红书图文生成

## 适用场景

- 用户要做小红书图文笔记、封面卡片或系列知识卡。
- 只有主题、提纲或一篇长文，需要重组为 5-18 张卡片内容。
- 需要同时产出标题、文案、标签和图片生成 Prompt。
- 选题和内容方向不清晰时，先配合 [xiaohongshu-commercial-growth](../xiaohongshu-commercial-growth/SKILL.md) 确认定位。
- 想把个人风格统一进图文模板时，配合 [personal-branding-advanced](../personal-branding-advanced/SKILL.md)。

## 核心约束

- 先拆内容结构，再写图片 Prompt；不要一上来直接堆视觉词。
- 每张图只承载一个明确重点，避免信息密度失控。
- Prompt 必须把中文文案内容、版式、背景和负面约束一起写清楚。
- 生成脚本依赖 `curl`、`jq` 和 `MULERUN_API_KEY`，没配置时只能输出 Prompt 方案。
- 用户没有图片生成需求时，不要强行调用脚本，直接输出卡片规划即可。

## 代码模式

内容规划完成后，调用脚本生成单张图片：

```bash
node scripts/generate.mjs "完整英文 Prompt" "3:4" "2K"
```

推荐的 Prompt 骨架：

```text
3:4 vertical Xiaohongshu content card.
Style: <风格名> with <视觉特征>
Background: <背景描述 + HEX>
Layout: <主体布局>
Text Content (Chinese): <完整中文文案>
Typography: <字体、字号、颜色、位置>
Negative prompts: <15-25 个约束词>
```

先读这些参考资料，再决定风格和卡片顺序：

- [内容规划](references/content-planning.md)
- [Prompt 编写](references/prompt-guide.md)
- [风格方案](references/styles.md)
- 环境变量模板：[`./.env.example`](.env.example)

## 检查清单

- 已先给出卡片顺序和每张图的核心信息点。
- 图文标题、正文和标签与目标人群一致。
- Prompt 中明确写出中文文案、版式和负面约束。
- 需要实际生成图片时，已确认 `MULERUN_API_KEY`、`curl`、`jq` 可用。
- 生成风格与 [personal-branding-advanced](../personal-branding-advanced/SKILL.md) 的品牌表达保持一致。
- 选题和商业目标已和 [xiaohongshu-commercial-growth](../xiaohongshu-commercial-growth/SKILL.md) 对齐。

## 反模式

### FAIL: 一图 300 字

```
[图片：6 段长文 + 引用 + 标签 + 二维码]
→ 用户两秒滑过 / 完读率 5%
```

### PASS: 一图一信息

```
封面：标题 + 一个数据点（≤ 20 字）
P2：核心结论（≤ 50 字）
P3-N：每页 1 个支撑点（≤ 80 字）
→ 18 张卡可表达完整故事
```

### FAIL: Prompt 只写风格

```
“小红书风格图，简约清新，3:4”
→ 生成图：精美但中文文本随机生成 / 排版无法预测
```

### PASS: Prompt 含 文本 + 版式 + 负向

```
3:4 vertical XHS card
Style: warm minimal, beige #F5F0E8 bg
Text Content (Chinese): “30 岁后省心穿搭法”
Typography: Source Han Sans 72pt, top center, dark brown
Negative: blurry text, watermark, English text, low contrast
```
