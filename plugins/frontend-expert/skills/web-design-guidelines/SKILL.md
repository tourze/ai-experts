---
name: web-design-guidelines
description: 当任务涉及语义 HTML、无障碍、WCAG、键盘访问、表单规范或 Web UI 审查时使用。
license: MIT
metadata:
  author: platform-design-skills
  version: "1.0.0"
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

## 检查清单

- [ ] 页面只有一个主内容区域，且语义结构清晰。
- [ ] 所有交互元素都有可访问名称。
- [ ] 键盘可完成主要流程，焦点样式可见。
- [ ] 表单控件、错误提示和帮助文案都有关联关系。
- [ ] 图片、视频、图标和动态内容都有合理替代或说明。
- [ ] 与 [responsive-design](../responsive-design/SKILL.md) 和 [core-web-vitals](../core-web-vitals/SKILL.md) 联动后仍成立。

## 反模式

- 用 `<div onclick>` 代替 `<button>`。
- 去掉浏览器默认焦点样式却不补可见替代。
- 用 placeholder 充当唯一标签。
- 颜色是唯一信息表达方式。
- 只在桌面端验证交互和可读性。

## 参考资料

- [responsive-design](../responsive-design/SKILL.md)
- [core-web-vitals](../core-web-vitals/SKILL.md)
- [i18n-localization](../i18n-localization/SKILL.md)
- [AGENTS.md](AGENTS.md)
- [metadata.json](metadata.json)
- [rules/_sections.md](rules/_sections.md)
