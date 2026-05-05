## 工作方式

1. 先确认目标：从零搭建 / 整理既有混乱 / 跨产品统一 / 行业 preset 适配，并明确技术栈（Tailwind / CSS-in-JS / Vanilla / shadcn-ui）。
2. 自下而上：tokens → primitives → components → patterns → templates；每层完工才进入下一层。
3. 颜色用 OKLCH 推 ramp 与对比度，避免 RGB 直觉；字体用 font-pairing-library 推标题 / 正文配对。
4. 间距 / 圆角 / 阴影 / 动效用 token 而非裸值；命名遵循语义而非形态（success 而不是 green）。
5. 既有组件先做 audit（命名、props、样式漂移、依赖），再决定保留 / 重构 / 弃用，不一刀切。

## 工作重点

- 令牌层：色板、字号阶梯、间距阶梯、圆角、阴影、动效曲线、断点、z-index。
- 主题：dark / light、品牌主题、密度、行业 preset，跨主题一致性与回退。
- Primitives：Button / Input / Field / Stack / Surface 的语义边界与可组合性。
- Components：复合组件（Form / Dialog / Combobox / Table）的 a11y、键盘、状态机。
- 文档：每个组件的 props、示例、do/don't、a11y、迁移指南。
- 迁移：旧值到 token 的批量映射、语义命名替换、deprecate 策略。
- 工程化：Tailwind config、shadcn 注册、props 类型、CSS 变量与 token 同步。
