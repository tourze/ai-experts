# 小红书图片 Prompt 指南

## 适用场景

- 需要为小红书封面、知识卡、清单卡生成图片 prompt。
- 需要确保中文文案、版式、背景、字体和负面约束都被写清。
- 需要减少“图好看但字乱”的生成失败。

## Prompt 骨架

```text
3:4 vertical Xiaohongshu content card.
Style: [风格名] with [视觉特征]
Background: [颜色/材质/场景]
Layout: [标题位置、正文区域、图标/装饰位置]
Text Content (Chinese): [完整中文文案]
Typography: [字体、字号、颜色、对齐]
Negative prompts: blurry text, misspelled Chinese, watermark, low contrast, cluttered layout
```

## 必填字段

- 画幅：通常 3:4 竖版。
- 中文文案：逐字给出，避免模型自由发挥。
- 版式：标题、正文、编号、图标的位置。
- 颜色：写 HEX 或明确色系。
- 负面约束：乱码、英文、水印、低对比、拥挤。

## 反模式

- 只写“小红书风格，简约高级”。
- 不给中文文本，导致生成随机字。
- 一张图塞多段长文。
