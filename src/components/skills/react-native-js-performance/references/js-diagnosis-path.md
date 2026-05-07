# React Native JS 性能诊断路径

按症状定位原因，先处理首选项，无效再看次选。

| 症状 | 默认怀疑 | 首选参考 | 次选 |
|------|---------|---------|------|
| 列表滚动掉帧 | `ScrollView` 渲染过多条目 | [js-lists-flatlist-flashlist](js-lists-flatlist-flashlist.md) | [js-measure-fps](js-measure-fps.md) |
| 输入框打字卡顿 | 受控组件 Bridge 来回跳 | [js-uncontrolled-components](js-uncontrolled-components.md) | [js-atomic-state](js-atomic-state.md) |
| 动画抖动/手势不跟手 | 动画跑在 JS 线程 | [js-animations-reanimated](js-animations-reanimated.md) | [js-bottomsheet](js-bottomsheet.md) |
| 页面切换/交互整体迟钝 | 状态变更触发大面积重渲染 | [js-profile-react](js-profile-react.md) | [js-atomic-state](js-atomic-state.md) -> [js-react-compiler](js-react-compiler.md) |
| 长时间使用后越来越卡 | JS 内存泄漏 | [js-memory-leaks](js-memory-leaks.md) | [js-profile-react](js-profile-react.md) |
| 首屏渲染慢但启动不慢 | 组件树过重或瀑布式请求 | [js-concurrent-react](js-concurrent-react.md) | [js-lists-flatlist-flashlist](js-lists-flatlist-flashlist.md) |

FlatList 调优无效时的升级路径：FlatList -> 调 `windowSize`/`maxToRenderPerBatch` -> 换 FlashList -> Profile React 组件找 renderItem 瓶颈。

## FlatList + deferred value 示例

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
