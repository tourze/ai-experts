---
name: redesign-my-landingpage
description: "在需要评审、重构或直接实现高转化落地页时使用，默认技术栈为 React + Vite + TypeScript + Tailwind + shadcn/ui + Iconify。"
metadata:
  version: 1.0.0
---

# 落地页重构（redesign-my-landingpage）

## 适用场景
- 需要从零搭建营销页、销售页、注册页或产品落地页。
- 已有页面转化弱，需要从首屏到页尾重排结构。
- 需要直接交付可运行的 React/Vite/Tailwind 代码。

## 核心约束
- 先锁定单一主转化动作，页面其它元素都服务这个动作。
- 上半屏解决“我为什么继续看”，下半屏解决“我为什么现在行动”。
- 默认实现约束是 shadcn/ui + Tailwind + Iconify，避免引入额外视觉系统分叉。
- 若任务主要是实验设计或诊断，不直接写代码时，配合 [cro-methodology](../cro-methodology/SKILL.md)；若重点是文案打磨，配合 [copy-editing](../copy-editing/SKILL.md)。

## 代码模式
- 参考现成示例资产： [LandingPage.tsx](assets/vite-shadcn-iconify-landing/src/pages/LandingPage.tsx)。
- 最小实现模式：

```tsx
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'

<Button>
  Start free
  <Icon icon="lucide:arrow-right" className="ml-2 size-4" />
</Button>
```

- 页面结构与风格方向优先参考 [landing-page-anatomy](references/landing-page-anatomy.md)、[section-templates](references/section-templates.md)、[aesthetic-directions](references/aesthetic-directions.md)、[shadcn-vite-setup](references/shadcn-vite-setup.md)。

## 检查清单
- 是否只有一个主 CTA，且在关键位置重复出现。
- 是否用真实产品画面或结果预览，而不是装饰图。
- 是否首屏就说明目标用户、核心价值和下一步动作。
- 是否兼顾移动端排版、可访问性和组件一致性。

## 反模式
- 把 shadcn 组件原样拼装成千篇一律模板。
- 首屏只有大词和抽象价值，没有产品画面和 CTA。
- 为了“酷”牺牲可读性、性能和移动端体验。
