# Red Flags 与 Rationalizations

## Red Flags（出现这些信号立即停下）

- 同一章节连续出现 3 个以上 `.def`/`.formula` 框 —— 退回 `<p>` + `<b>`。
- SVG 里写死颜色（`#1D9E75`、`black`）—— 必须用 CSS 变量（`var(--gn)`），否则深色模式爆炸。
- 节点圆心距 < 56px，或 viewBox 底边裁掉了节点下方的 `[i]` 标注 —— 加大 viewBox。
- 动画区域和代码区域并存但 step 里没有 `line` 字段 —— 违反约束 3。
- 把 `assets/boilerplate.js` 模板 A + 模板 C 同时嵌入同一页 —— `var steps` 重复声明报错。
- 一页只有动画没有任何静态 SVG —— 静态图缺位，读者无法对照参考状态。
- 一页只有文字没有任何 SVG —— 概念全凭脑补。
- "我先把 PDF 看完，提炼要点重新组织章节" —— 违反约束 5，跟着原文走。
- 表格 ≥ 3 个，或用表格罗列步骤 —— 步骤用 `.sb` + `.sn` 编号块。

## Rationalizations（自我合理化反制）

| 想偷懒的念头 | 现实后果 |
|---|---|
| "节点离得近一点没事，浏览器会自适应" | viewBox 固定，节点会重叠成糊团 |
| "公式还是放 `.formula` 框里更显眼" | 整页方块墙，叙事断裂，看完不记得讲了啥 |
| "代码就放在动画下面单独的 `<pre>` 里，没必要联动" | 用户根本不知道动画哪一帧对应代码哪一行 |
| "我对 base.css 改一下颜色变量名就好" | 参考实现 heap_overview.html 视觉对不上，深色模式被破坏 |
| "整篇 boilerplate.js 复制进去，按需调用就行" | 模板 A 和 C 都声明顶层 `var steps`，浏览器直接 `SyntaxError: Identifier 'steps' has already been declared` |
| "一个 SVG 也不画，全用文字描述清楚就好" | 教学密度直接归零，违反约束 4 |
