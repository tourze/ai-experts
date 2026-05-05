## 核心约束

- 评审优先指出问题，再给方案；结论要能落到具体文件、状态和组件。
- 先判断用户任务是否清晰，再看视觉层级和美术方向。
- 有设计系统时，以系统规则为第一约束；没有系统时，以一致性和可维护性为第一约束。
- 创意设计要“有方向”，不是把所有流行效果堆在一起。
- 低质量“AI 味”通常来自：默认字体、默认紫渐变、套路式卡片网格、无意义动画。

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

## 检查清单

- [ ] 页面主目标一眼可见，主 CTA 不超过两个。
- [ ] 视觉层级通过尺寸、颜色、间距而非堆叠装饰完成。
- [ ] 设计 token、组件 API、状态命名与设计系统一致。
- [ ] 键盘焦点、禁用态、加载态、错误态都可见。
- [ ] 移动端与桌面端都保留清晰的信息与操作路径。
- [ ] 如涉及 AI 结果、自动化建议或风险操作，界面已提供透明说明。

## 反模式

### FAIL: 全是主角

```
Hero + 6 张大卡片 + 渐变 banner + 浮动 CTA + 动画背景
→ 用户视线无落点 → 不知道下一步该点哪里
```

### PASS: 主次分明

```
1 个主 CTA（实色按钮）
2-3 个次操作（ghost / link）
其余信息降级（小字、灰色、无背景）
→ 三秒看出"该做什么"
```

### FAIL: 只做 default 态

```tsx
<button className="bg-brand">提交</button>
// 没有 hover/focus/disabled/loading
// 键盘用户看不到焦点 → a11y 失败
```

### PASS: 状态完整

```tsx
<button className="bg-brand hover:bg-brand-700
  focus-visible:ring-2 disabled:opacity-50
  data-[loading=true]:cursor-wait">
```

### FAIL: 动画掩盖信息

```
用户找不到操作 → "加个滑动动画引导一下"
→ 实际：信息架构混乱，动画只是绷带
```

### PASS: 先修结构

```
1. 重排：核心信息上移
2. 分组：相关项靠近
3. 标签：动作动词清晰
4. 都做完后才考虑动效
```

## Absolute Bans（CSS 模式级硬禁令）

审查时有 10 条"AI 指纹"CSS 模式**必须直接 P0 阻塞**，不能改颜色或宽度绕开，要换结构重写——包括 `border-left/right ≥ 2px` 侧条、`background-clip: text` 渐变文字、紫蓝 AI 色盘、深色霓虹光晕、嵌套卡片、装饰 sparkline、全居中、modal 滥用等。详情和正确重写方案见 [references/absolute-bans.md](references/absolute-bans.md)。

## 参考资料

- [refactoring-ui](../modern-web-design/SKILL.md)
- [responsive-design](../responsive-design/SKILL.md)
- [web-design-guidelines](../modern-web-design/SKILL.md)
- [references/absolute-bans.md](references/absolute-bans.md) — 10 条 CSS 模式级硬禁令
- [references/review-output-format.md](references/review-output-format.md)
- [references/review-type-modifiers.md](references/review-type-modifiers.md)
- [references/quick-checklist.md](references/quick-checklist.md)
- [references/pattern-examples.md](references/pattern-examples.md)
