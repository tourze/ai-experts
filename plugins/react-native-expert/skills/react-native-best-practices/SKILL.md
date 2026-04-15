---
name: react-native-best-practices
description: 当用户要排查或优化 React Native 性能时使用。用户提到掉帧、启动慢、包太大、内存涨、FPS、TTI、FlashList、Hermes 时触发。
---

# React Native 最佳实践

## 适用场景

- 界面卡顿、滚动掉帧、首屏慢、动画抖动、包体积膨胀。
- 需要区分问题是在 JS 线程、UI 线程、Bridge 还是原生模块。
- 要评估 Hermes、R8、tree shaking、FlashList、Reanimated 等优化手段。
- 版本升级相关任务优先联动 [upgrading-react-native](../upgrading-react-native/SKILL.md)。
- 交互与视觉实现优先联动 [react-native-design](../react-native-design/SKILL.md)。

## 核心约束

- 先量化，再优化；没有基线的“优化”大概率只是主观感觉。
- 只用 release 构建做真实性能判断；debug 构建结论通常失真。
- 大列表默认怀疑 `ScrollView`；高频输入默认怀疑受控组件；复杂动画默认怀疑跑在 JS 线程。
- 包体与启动优化要区分 JS bundle、原生二进制、资源体积三类问题。
- 远程代码分发、第三方依赖、原生命令执行都要遵守供应链与最小权限约束。

## 代码模式

```tsx
import { useDeferredValue } from "react";
import { FlatList, Text } from "react-native";

export function SearchList({
  query,
  items,
}: {
  query: string;
  items: { id: string; title: string }[];
}) {
  const deferredQuery = useDeferredValue(query);
  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(deferredQuery.toLowerCase()),
  );

  return (
    <FlatList
      data={filteredItems}
      keyExtractor={(item) => item.id}
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      windowSize={5}
      removeClippedSubviews
      renderItem={({ item }) => <Row title={item.title} />}
    />
  );
}

function Row({ title }: { title: string }) {
  return <Text>{title}</Text>;
}
```

```bash
# 生成生产 bundle 并分析体积
npx react-native bundle \
  --entry-file index.js \
  --platform ios \
  --dev false \
  --minify true \
  --bundle-output /tmp/main.jsbundle \
  --sourcemap-output /tmp/main.jsbundle.map

npx source-map-explorer /tmp/main.jsbundle --no-border-checks
```

```md
优先查阅这些参考文件：

- [references/js-lists-flatlist-flashlist.md](references/js-lists-flatlist-flashlist.md)
- [references/js-memory-leaks.md](references/js-memory-leaks.md)
- [references/native-measure-tti.md](references/native-measure-tti.md)
- [references/bundle-analyze-js.md](references/bundle-analyze-js.md)
- [references/native-threading-model.md](references/native-threading-model.md)
```

## 检查清单

- [ ] 是否记录了优化前后的 FPS、TTI、bundle size 或内存数据？
- [ ] 是否在 release 构建、真机或接近真实环境里复测？
- [ ] 大列表是否使用虚拟化组件，并控制 `windowSize`/`initialNumToRender`？
- [ ] 动画是否尽量放到 Reanimated/UI 线程，而不是 JS 线程？
- [ ] 包体积分析是否区分 JS bundle、图片/字体资源与原生依赖？
- [ ] 原生模块/线程问题是否已经借助 Xcode Instruments 或 Android Profiler 验证？

## 反模式

- 没有任何测量数据，就盲目上 memo、拆组件或换库。
- 用 `ScrollView` 渲染成百上千条记录，再怪 React Native 慢。
- 在 debug 包里看见掉帧就直接下结论，不做 release 复测。
- 所有动画都走 JS 线程，手势交互与动画互相抢资源。
- 为了减包随意删 polyfill、开启远程分包，却不验证 Hermes 能力与来源可信性。
- 升级后把性能回退归因于“React Native 就这样”，不做 profiler 与 bundle diff。
