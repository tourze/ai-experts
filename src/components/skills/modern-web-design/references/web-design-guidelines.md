# Web 设计规范

与 `modern-web-design` 联动的 Web 平台规范和可访问性底线。

## 核心规范

### 可访问性
- WCAG 2.2 AA 级为最低基线。
- 色彩对比度 ≥ 4.5:1（正文）/ 3:1（大文本）。
- 焦点环可见且不依赖颜色单一传达信息。
- 所有交互元素支持键盘操作。

### 语义 HTML
- 使用正确的 heading 层级（h1-h6）。
- 交互使用 `<button>` 而非 `<div onclick>`。
- 表单使用 `<label>`、`<fieldset>`、`<legend>`。

### 移动端
- 触摸目标 ≥ 44×44px。
- 无水平滚动（除非设计意图）。
- 视口 `<meta name="viewport" content="width=device-width, initial-scale=1">`。

## 检查清单
- [ ] 色彩对比度通过 AA 级
- [ ] 键盘可完整操作
- [ ] 无 `aria-*` 误用
- [ ] 图片有 `alt` 文本
- [ ] 表单有正确的 label 关联
