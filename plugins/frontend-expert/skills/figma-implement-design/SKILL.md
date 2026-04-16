---
name: figma-implement-design
description: 当用户提供 Figma 链接、要求 1:1 还原界面、或需要根据设计稿实现组件或页面时使用。
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

### FAIL: 复制 Figma 生成代码

```tsx
// 直接粘贴 Figma "Copy as React"
<div className="bg-[#3B82F6] rounded-[8px] px-[16px] py-[12px]
  font-['Inter'] text-[14px] leading-[20px] text-white">
  立即开始
</div>
// 颜色/字体/spacing 全是硬编码，token 系统失效
```

### PASS: 翻译到项目 token

```tsx
<Button variant="primary" size="md">立即开始</Button>
// 自动用项目 brand color + spacing scale + Button 组件状态体系
```

### FAIL: 凭截图猜布局

```
"看截图卡片是 3 列网格"
→ 实现成 grid-cols-3
→ 实际 Figma 用的是 auto-fit minmax，平板会变 2 列
→ 还原失败
```

### PASS: 先拿结构化数据

```
1. get_design_context → 取出 Auto Layout 配置
2. get_screenshot → 视觉对照
3. 根据 Auto Layout direction/wrap/min-width 决定 CSS
   → grid auto-fit / flex-wrap / 容器查询
```

### FAIL: 只做默认态

```tsx
<Button>提交</Button>
// Figma 设计稿明明有 hover/loading/disabled 三态
// 实现时只做了一个状态，PR 评审被打回
```

### PASS: 状态全覆盖

```tsx
// Figma → "Component variants"：default / hover / loading / disabled
<Button
  disabled={isPending}
  className="hover:bg-brand-700 disabled:opacity-50"
>
  {isPending ? <Spinner /> : "提交"}
</Button>
```

## 参考资料

- [design-system-patterns](../design-system-patterns/SKILL.md)
- [shadcn-ui](../shadcn-ui/SKILL.md)
- [frontend-design-review](../frontend-design-review/SKILL.md)
- [Figma MCP 文档](https://developers.figma.com/docs/figma-mcp-server/)
