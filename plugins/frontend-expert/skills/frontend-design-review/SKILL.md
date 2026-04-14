---
name: frontend-design-review
description: >
  用于审查或设计高质量前端界面。适合 PR 设计评审、可访问性检查、设计系统一致性检查、响应式检查，以及需要避免 AI 套版感的界面设计任务。
acknowledgments: |
  设计评审框架参考 @Quirinevwm 的质量支柱方法；
  创意前端约束受 Anthropic frontend-design 思路启发。
---

# 前端设计评审

## 适用场景

- 审查已实现界面的视觉质量、交互清晰度和设计系统一致性。
- 需要对 PR、组件、页面或核心流程给出设计层面的阻塞项。
- 需要创建风格明确、非模板化的前端界面。
- 需要在可访问性、响应式和工程实现之间做平衡。

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

- 每块区域都“看起来像主角”，导致无主次。
- 只做默认态，忽略焦点态、禁用态、空态和错误态。
- 拿随机灵感图硬套当前项目，风格与品牌完全脱节。
- 用复杂动画掩盖信息组织问题。
- 明明有设计系统却继续手写大量一次性样式。

## 参考资料

- [refactoring-ui](../refactoring-ui/SKILL.md)
- [responsive-design](../responsive-design/SKILL.md)
- [web-design-guidelines](../web-design-guidelines/SKILL.md)
- [references/review-output-format.md](references/review-output-format.md)
- [references/review-type-modifiers.md](references/review-type-modifiers.md)
- [references/quick-checklist.md](references/quick-checklist.md)
- [references/pattern-examples.md](references/pattern-examples.md)
