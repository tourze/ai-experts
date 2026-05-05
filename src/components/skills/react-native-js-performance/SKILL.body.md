## 适用场景

- 界面卡顿、滚动掉帧、动画抖动、输入延迟。
- 大列表渲染慢，需要评估 FlatList / FlashList / 虚拟化策略。
- 动画需要从 JS 线程迁移到 UI 线程（Reanimated worklet）。
- React 渲染性能分析、React Compiler 接入评估。
- JS 内存泄漏定位与修复。
- 交互与视觉实现优先联动 [react-native-design](../react-native-design/SKILL.md)。

## 核心约束

- 量化 = 帧耗时/FPS 数字，不是"感觉流畅了"。用 Perf Monitor 或 Flashlight 拿到数据再下结论。
- 只用 release 构建做真实性能判断；debug 构建的 JS 执行慢 10-20 倍，结论完全失真。
- 区分 JS 线程瓶颈和 UI 线程瓶颈——症状相似但解法不同。Perf Monitor 左列（JS）掉帧和右列（UI）掉帧要区别对待。

## 诊断路径

按症状定位原因，先处理首选项，无效再看次选：

| 症状 | 默认怀疑 | 首选参考 | 次选 |
|------|---------|---------|------|
| 列表滚动掉帧 | `ScrollView` 渲染过多条目 | [js-lists-flatlist-flashlist](references/js-lists-flatlist-flashlist.md) | [js-measure-fps](references/js-measure-fps.md) |
| 输入框打字卡顿 | 受控组件 Bridge 来回跳 | [js-uncontrolled-components](references/js-uncontrolled-components.md) | [js-atomic-state](references/js-atomic-state.md) |
| 动画抖动/手势不跟手 | 动画跑在 JS 线程 | [js-animations-reanimated](references/js-animations-reanimated.md) | [js-bottomsheet](references/js-bottomsheet.md) |
| 页面切换/交互整体迟钝 | 状态变更触发大面积重渲染 | [js-profile-react](references/js-profile-react.md) | [js-atomic-state](references/js-atomic-state.md) → [js-react-compiler](references/js-react-compiler.md) |
| 长时间使用后越来越卡 | JS 内存泄漏 | [js-memory-leaks](references/js-memory-leaks.md) | [js-profile-react](references/js-profile-react.md) |
| 首屏渲染慢但启动不慢 | 组件树过重或瀑布式请求 | [js-concurrent-react](references/js-concurrent-react.md) | [js-lists-flatlist-flashlist](references/js-lists-flatlist-flashlist.md) |

FlatList 调优无效时的升级路径：FlatList → 调 `windowSize`/`maxToRenderPerBatch` → 换 FlashList → Profile React 组件找 renderItem 瓶颈。

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

## 检查清单

- [ ] 是否用 Perf Monitor 或 Flashlight 记录了优化前后的 FPS 数据？
- [ ] 是否在 release 构建、真机上复测？
- [ ] 大列表是否使用虚拟化组件，并控制 `windowSize`/`initialNumToRender`？
- [ ] 动画是否尽量放到 Reanimated/UI 线程，而不是 JS 线程？
- [ ] 高频输入是否使用非受控组件或 deferred value？
- [ ] 是否排查了闭包、定时器和事件监听器的内存泄漏？

## 反模式

### FAIL: ScrollView 渲染长列表

```tsx
<ScrollView>
  {items.map(i => <Row key={i.id} data={i} />)} // 1000 个 Row 全部挂载
</ScrollView>
```

### PASS: 虚拟化列表

```tsx
<FlatList
  data={items}
  keyExtractor={i => i.id}
  renderItem={({ item }) => <Row data={item} />}
  initialNumToRender={12}
  windowSize={5}
  removeClippedSubviews
/>
```

### FAIL: debug 构建下结论

```bash
# debug 包 fps 30，"React Native 太慢了"
```

→ debug 构建 JS 执行慢 10-20 倍，结论完全失真。

### PASS: release 真机复测

```bash
npx react-native run-ios --configuration Release
# 用 Perf Monitor 或 Flashlight 记录真实 FPS
```
