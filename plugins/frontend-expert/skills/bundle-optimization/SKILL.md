---
name: bundle-optimization
description: 当需要减小前端 bundle 体积、做代码分割、消除 barrel imports 或按用户意图预加载时使用。用户提到 bundle size、dynamic import、code splitting、tree shaking、barrel exports、首屏体积 时触发。
---

# Bundle 体积优化

## 适用场景

- 首屏加载慢，需要减小初始 bundle 体积以改善 TTI 和 LCP。
- 需要对重型组件做动态导入 / 代码分割。
- 项目使用 barrel exports（index.ts 重导出），导致 tree shaking 失效。
- 需要基于用户行为意图预加载即将用到的模块。
- 性能指标层面可联动 [core-web-vitals](../../core-web-vitals/SKILL.md)。
- 这套 skill 是规则索引；需要细节时直接打开对应 `rules/*.md` 文件。

## 核心约束

- 先量化：用 bundle analyzer 确认哪些模块占比最大，再决定拆分策略。
- 动态导入只用在真正重型的、非首屏必须的组件上，不要滥用。
- 消除 barrel imports 时优先改成 direct path imports，而不是靠打包器 sideEffects 配置。
- 预加载（preload）只用在高概率用户路径上，避免浪费带宽。

## 代码模式

```tsx
// FAIL — barrel import 拉入整个模块
import { Button, Icon } from '@/components';
```

```tsx
// PASS — direct path import，只打包用到的
import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
```

```tsx
// FAIL — 重型组件同步导入，撑大首屏 bundle
import { MonacoEditor } from './monaco-editor';
```

```tsx
// PASS — 动态导入，按需加载
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(
  () => import('./monaco-editor').then(m => m.MonacoEditor),
  { ssr: false }
);
```

```md
规则文件索引：
- [rules/bundle-barrel-imports.md](rules/bundle-barrel-imports.md)
- [rules/bundle-dynamic-imports.md](rules/bundle-dynamic-imports.md)
- [rules/bundle-conditional.md](rules/bundle-conditional.md)
- [rules/bundle-defer-third-party.md](rules/bundle-defer-third-party.md)
- [rules/bundle-preload.md](rules/bundle-preload.md)
```

## 检查清单

- [ ] 是否用 bundle analyzer 确认了最大的几个模块？
- [ ] 首屏不需要的重型组件是否已动态导入？
- [ ] 是否消除了 barrel imports 改为 direct path？
- [ ] 第三方库是否按需加载而不是全量引入？
- [ ] 预加载是否只用在高概率路径上？
- [ ] 改动前后是否有 bundle size 对比？

## 反模式

- 到处用 barrel exports（`index.ts`），把首屏 bundle 撑到 500KB+。
- 对 10KB 的小组件也做动态导入，增加请求数反而更慢。
- 只看 gzip 后体积，忽略解析和执行时间。
- 用 `import()` 但没做 loading 状态，用户看到空白。
