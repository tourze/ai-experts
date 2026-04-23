---
name: ppt-generate
description: 当用户要从零生成演示文稿、从文档/主题生成 PPT、或要求 AI 端到端制作幻灯片时使用。
---

# PPT 端到端生成

## 适用场景

- 用户给出主题/需求，要求生成完整演示文稿。
- 用户提供源文档（PDF/文本/URL），要求转化为 PPT。
- 用户说"帮我做个 PPT"、"生成幻灯片"、"做个 deck"。
- 区别：[ppt-visual](../ppt-visual/SKILL.md) 只输出设计说明；[pptx](../pptx/SKILL.md) 处理已有文件。

## 核心流程 — 5 阶段，3 个硬停点

```
阶段 1: 需求确认 [HARD STOP]
  八项确认：观众、目的、页数、风格、配色、图标风格、字体、图片需求
  输出：design_spec.md + spec_lock.md（见 references/spec-lock-template.md）

阶段 2: 大纲规划 [HARD STOP]
  每页标注：页面类型 + page_rhythm + 核心信息 + 信息块数
  输出：outline.md

阶段 3: SVG 生成
  逐页生成，每页前重读 spec_lock
  SVG 规范见 pptx skill: references/svg-subset.md
  生成后校验: python3 ../pptx/scripts/svg_quality_checker.py svg_output/

阶段 4: 转换 & 交付 [HARD STOP]
  python3 ../pptx/scripts/svg_to_pptx.py svg_output/ output.pptx
  → 原生 DrawingML PPTX，用户打开检查

阶段 5: 迭代修改
  按页码修改 SVG → 重新校验 → 重新转换
```

## page_rhythm 节奏

| 标签 | 信息密度 | 典型页面 |
|------|----------|----------|
| anchor | 1-2 块 | cover, section, ending |
| dense | 3-5 块 | content, data, comparison, timeline |
| breathing | 1-2 块 | agenda, quote, team |

编排规则：dense 不连续超过 3 页；首尾必须 anchor；每 4-6 页至少一次 breathing。

## 核心约束

1. 每页只传达一个核心观点（4±1 信息块上限）
2. SVG 禁用 `<mask>`/`<style>`/`<foreignObject>`/`<filter>`/CSS class，只用内联属性
3. 逐页生成，不批量（防质量下降）
4. 每页生成前必须重读 spec_lock（防上下文漂移）
5. page_rhythm 大纲阶段锁定，执行时不改
6. 3 个 HARD STOP 必须用户确认才继续

## 检查清单

- [ ] 八项确认全部完成
- [ ] spec_lock 已锁定
- [ ] 大纲标注了 page_rhythm 且不超过 3 页连续 dense
- [ ] 每页 SVG 生成前重读 spec_lock
- [ ] SVG 通过 quality checker
- [ ] PPTX 可正常打开
- [ ] 页数与 spec_lock 一致

详细反模式与正确做法见 [references/anti-patterns.md](references/anti-patterns.md)。
页面类型参考见 [references/page-types.md](references/page-types.md)。
