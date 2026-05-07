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
