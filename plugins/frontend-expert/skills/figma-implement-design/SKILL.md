---
name: figma-implement-design
description: 用于把 Figma 设计稿转成可落地代码。当用户提供 Figma 链接、要求 1:1 还原界面、根据设计稿实现组件或页面时使用。
---

# Figma 设计实现

## 适用场景

- 用户给出 Figma 链接，希望实现单个组件、模块或整页。
- 需要依据 Figma Dev Mode 或 MCP 数据做像素级还原。
- 需要把 Figma 输出映射到现有设计系统、组件库和路由约定。
- 需要从设计稿提取图片、图标、布局、间距和状态变化。

## 核心约束

- 没有设计上下文就不要开写。先拿结构化设计数据，再拿截图做对照。
- 先还原布局、层级和状态，再做动效和工程抽象。
- 不要把 Figma 自动生成代码原样落库；必须翻译成项目现有规范。
- 设计稿资产以 Figma 提供的内容为准，不要私自替换为别的图标包或占位图。
- 遇到设计系统已有组件时先复用，再决定是否新建。
- 实现完成后，用 [frontend-design-review](../frontend-design-review/SKILL.md) 复核视觉与交互一致性。

## 代码模式

```text
推荐顺序：
1. 解析 fileKey / nodeId 或读取桌面 Figma 当前选区
2. 调用 get_design_context 获取结构化设计数据
3. 调用 get_screenshot 获取视觉对照
4. 下载设计稿返回的图片 / SVG 资产
5. 映射到项目组件、token、样式体系
6. 逐状态自测：默认、hover、focus、disabled、loading
```

```tsx
// 先用项目 token 和组件表达设计稿，而不是直接复制 Figma 生成类名
<Button variant="primary" size="lg" className="w-full">
  立即开始
</Button>
```

## 检查清单

- [ ] 已拿到设计上下文和截图，而不是只看链接标题。
- [ ] 已确认目标节点范围，避免整页与局部混淆。
- [ ] 已复用现有组件、token、图标包装器和布局约定。
- [ ] 默认态、交互态、异常态都与设计稿一致。
- [ ] 所有导入资产都来自 Figma 返回结果或项目既有资源。
- [ ] 实现后已在真实断点下复查间距、换行和溢出。

## 反模式

- 跳过设计上下文，直接凭截图猜布局。
- 把 Figma 生成的 React/Tailwind 代码整段贴进仓库。
- 为了“快”而绕过项目已有 Button、Card、Typography 体系。
- 设计稿是 SVG，却自行换成第三方图标。
- 只实现默认态，不实现 hover、focus、loading、error。

## 参考资料

- [design-system-patterns](../design-system-patterns/SKILL.md)
- [shadcn-ui](../shadcn-ui/SKILL.md)
- [frontend-design-review](../frontend-design-review/SKILL.md)
- [Figma MCP 文档](https://developers.figma.com/docs/figma-mcp-server/)
