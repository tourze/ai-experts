---
name: web-design-guidelines
description: 当任务涉及语义 HTML、无障碍、WCAG、键盘访问、表单规范或 Web UI 审查时使用。
---

# Web 设计规范

## 适用场景

- 编写或审查 HTML/CSS/JS Web 界面。
- 做无障碍、语义结构、键盘可达性和焦点态检查。
- 需要制定跨框架的 Web 平台设计和实现底线。
- 需要把表单、导航、媒体和动效规范统一化。

## 核心约束

- 语义优先：能用原生 HTML 元素就不要造自定义伪控件。
- 可访问性默认开启，不是上线前补票。
- 键盘路径、焦点可见、可访问名称是每个交互元素的硬要求。
- 表单、媒体、导航和弹层都要提供清晰语义和状态反馈。
- 响应式与性能规范必须跟无障碍一起考虑，不能互相牺牲。

## 代码模式

```html
<button aria-label="关闭对话框">
  <svg aria-hidden="true" viewBox="0 0 24 24">...</svg>
</button>
```

```css
:focus-visible {
  outline: 3px solid var(--focus-color, #2563eb);
  outline-offset: 2px;
}
```

```html
<label for="email">邮箱</label>
<input id="email" type="email" autocomplete="email">
```

## 排版与数字细节

详见 [references/typography-polish.md](references/typography-polish.md)：

- **text-wrap: balance**：标题用，≤6 行，防孤字。Tailwind `text-balance`。
- **text-wrap: pretty**：短中段落用，防末行单字。Tailwind `text-pretty`。长文（10+ 行）不加。
- **font-smoothing**：根元素加 `-webkit-font-smoothing: antialiased`，macOS 文字更锐利。Tailwind `antialiased`。
- **tabular-nums**：动态数字（计数器、价格、计时）用 `font-variant-numeric: tabular-nums` 防抖。Tailwind `tabular-nums`。
- **最小点击区**：交互元素 ≥ 40×40px，小控件用伪元素扩展，两个点击区不能重叠。

## 检查清单

- [ ] 页面只有一个主内容区域，且语义结构清晰。
- [ ] 所有交互元素都有可访问名称。
- [ ] 键盘可完成主要流程，焦点样式可见。
- [ ] 表单控件、错误提示和帮助文案都有关联关系。
- [ ] 图片、视频、图标和动态内容都有合理替代或说明。
- [ ] 标题用 `text-wrap: balance`，短段落用 `text-wrap: pretty`。
- [ ] 动态数字用 `tabular-nums`。
- [ ] 根元素有 `antialiased` font-smoothing。
- [ ] 交互元素点击区 ≥ 40×40px。
- [ ] 与 [responsive-design](../responsive-design/SKILL.md) 和 [core-web-vitals](../core-web-vitals/SKILL.md) 联动后仍成立。

## 反模式

### FAIL: div 假装按钮

```html
<div onclick="submit()" class="bg-blue-500 px-4 py-2 rounded">
  提交
</div>
<!-- Tab 不能聚焦 / Enter 不触发 / 屏幕阅读器读"组" / 无禁用态 -->
```

### PASS: 真按钮

```html
<button type="button" onclick="submit()" class="bg-blue-500 px-4 py-2 rounded">
  提交
</button>
<!-- 自动支持 Tab / Enter / Space / disabled / role=button -->
```

### FAIL: 去掉焦点轮廓

```css
*:focus { outline: none; }
/* 键盘用户完全失明 → WCAG 2.4.7 失败 */
```

### PASS: focus-visible 强化

```css
*:focus { outline: none; }
*:focus-visible {
  outline: 3px solid var(--focus-color);
  outline-offset: 2px;
}
/* 鼠标点击不显示轮廓，键盘聚焦清晰可见 */
```

### FAIL: placeholder 当 label

```html
<input type="email" placeholder="邮箱">
<!-- 输入后 placeholder 消失 → 用户忘记字段含义 -->
<!-- 屏幕阅读器可能不读 placeholder -->
<!-- placeholder 颜色对比度低，弱视用户难读 -->
```

### PASS: label + placeholder 共存

```html
<label for="email">邮箱</label>
<input id="email" type="email" placeholder="you@example.com" autocomplete="email">
<!-- label 始终可见 + placeholder 给格式示例 + autocomplete 提升填写效率 -->
```

## 参考资料

- [responsive-design](../responsive-design/SKILL.md)
- [core-web-vitals](../core-web-vitals/SKILL.md)
- [i18n-localization](../i18n-localization/SKILL.md)
- [references/typography-polish.md](references/typography-polish.md)
- [AGENTS.md](AGENTS.md)
- [metadata.json](metadata.json)
- [rules/_sections.md](rules/_sections.md)
