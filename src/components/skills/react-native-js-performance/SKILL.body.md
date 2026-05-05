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
