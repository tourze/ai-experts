## 代码模式

```text
推荐评审顺序：
1. 用户目标是否在 1-3 次操作内完成
2. 主次操作是否清晰
3. 是否复用设计系统组件与 token
4. 断点、焦点态、错误态是否完整
5. 是否存在会破坏信任的实现细节
```

```tsx
// 好：主操作单一，次操作后退一步
<div className="flex items-center gap-3">
  <Button>保存设置</Button>
  <Button variant="ghost">取消</Button>
</div>
```

## Absolute Bans（CSS 模式级硬禁令）

审查时有 10 条"AI 指纹"CSS 模式**必须直接 P0 阻塞**，不能改颜色或宽度绕开，要换结构重写——包括 `border-left/right ≥ 2px` 侧条、`background-clip: text` 渐变文字、紫蓝 AI 色盘、深色霓虹光晕、嵌套卡片、装饰 sparkline、全居中、modal 滥用等。详情和正确重写方案见 [references/absolute-bans.md](references/absolute-bans.md)。
