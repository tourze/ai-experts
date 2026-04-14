---
name: vercel-react-best-practices
description: 适用于按 Vercel 工程团队规则审视 React/Next.js 代码，重点覆盖 async waterfalls、bundle、server/client 边界、重渲染与前端微优化。用户提到 Next.js 性能、Vercel 规则、waterfall、bundle、resource hints 时使用。
---

# Vercel React 最佳实践

## 适用场景

- 需要按 Vercel 的 React / Next.js 规则集做代码审查、重构或生成代码。
- 需要系统化处理 waterfalls、bundle size、Server Action、RSC 序列化与客户端监听器问题。
- 任务是 Next.js App Router 项目，且希望按高影响规则先做收益最大的改动。
- RSC 边界先看 [react-server-components](../react-server-components/SKILL.md)，通用渲染热点先看 [react-performance](../react-performance/SKILL.md)，框架实现细节再联动 [nextjs-developer](../../../nextjs-expert/skills/nextjs-developer/SKILL.md)。

## 核心约束

- 先用高影响规则：`async-*`、`bundle-*`、`server-*`，最后才看 `js-*` 微优化。
- 规则必须匹配框架前提；纯 Vite/CRA 页面不要照搬 Next.js / App Router 规则。
- 优化目标是降低真实用户等待与 bundle 压力，不是堆更多抽象。
- 这套 skill 是规则索引；需要细节时直接打开对应 `rules/*.md` 文件。

## 代码模式

```tsx
// async-parallel
async function getMetrics() {
  return { visitors: 42 };
}

async function getNotifications() {
  return [{ id: "1", title: "Deploy finished" }];
}

export default async function DashboardPage() {
  const [metrics, notifications] = await Promise.all([
    getMetrics(),
    getNotifications(),
  ]);

  return <Dashboard metrics={metrics} notifications={notifications} />;
}
```

```tsx
// bundle-dynamic-imports
import dynamic from "next/dynamic";

const HeavyChart = dynamic(() => import("./HeavyChart"), {
  loading: () => <div>Loading…</div>,
});
```

```tsx
// rerender-transitions
"use client";

import { startTransition, useState } from "react";

export function SearchBox() {
  const [query, setQuery] = useState("");

  return (
    <input
      value={query}
      onChange={(event) => {
        const nextQuery = event.target.value;
        startTransition(() => {
          setQuery(nextQuery);
        });
      }}
    />
  );
}
```

```md
优先阅读这些规则文件：

- [rules/async-parallel.md](rules/async-parallel.md)
- [rules/bundle-dynamic-imports.md](rules/bundle-dynamic-imports.md)
- [rules/server-auth-actions.md](rules/server-auth-actions.md)
- [rules/rerender-transitions.md](rules/rerender-transitions.md)
- [rules/rendering-resource-hints.md](rules/rendering-resource-hints.md)
- [AGENTS.md](AGENTS.md)
```

## 检查清单

- [ ] 是否先从 `async-*` / `bundle-*` / `server-*` 规则入手？
- [ ] 当前项目是否真是 Next.js / App Router，再决定是否应用服务端规则？
- [ ] 是否避免在 Server Action、RSC props、模块级状态上制造隐患？
- [ ] 懒加载、预加载、资源提示是否落在真正昂贵的边界上？
- [ ] 重渲染优化是否与 props 稳定性、状态粒度一起评估？
- [ ] 改动前后是否有网络 waterfall、bundle 或交互指标对比？

## 反模式

- 在 `js-*` 小优化上花半天，却没先清掉串行数据获取。
- 纯客户端应用里硬套 Server Action / RSC 规则。
- 为了方便导入到处用 barrel exports，最后把首屏 bundle 撑爆。
- 在服务器模块里存放请求相关可变状态，制造跨请求污染。
- 把用户点击逻辑放进 effect，再靠依赖数组补丁式修复。
