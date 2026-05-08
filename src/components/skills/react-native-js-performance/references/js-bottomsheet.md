---
title: 底部面板
impact: HIGH
tags: bottom-sheet, gorhom, re-renders, shared-values, gestures, context, scrollable, modal, keyboard
---

# 技能：底部面板最佳实践

优化 `@gorhom/bottom-sheet` 以实现流畅的 60 FPS，将手势/滚动驱动的状态保持在 UI 线程上。

## 快速模式

**错误做法（交互期间可能反复进入 JS —— 完整子树重新渲染）：**

```jsx
const handleAnimate = useCallback((fromIndex, toIndex) => {
  setIsExpanded(toIndex > 0); // 重新渲染整棵树
}, []);

<BottomSheet onAnimate={handleAnimate}>
  <ExpensiveContent isExpanded={isExpanded} />
</BottomSheet>
```

**正确做法（保持在 UI 线程 —— 零重新渲染）：**

```jsx
const animatedIndex = useSharedValue(0);

const overlayStyle = useAnimatedStyle(() => ({
  opacity: withTiming(animatedIndex.value > 0 ? 0.5 : 0),
}));

<BottomSheet animatedIndex={animatedIndex}>
  <ExpensiveContent />
</BottomSheet>
<Animated.View style={[styles.overlay, overlayStyle]} />
```

## 适用场景

- 实现或优化使用 `@gorhom/bottom-sheet` 的底部面板
- 底部面板手势导致卡顿或掉帧
- 底部面板内的滚动触发过多重新渲染
- 包裹底部面板的 Context provider 重新渲染整个子树
- 仅视觉状态（阴影、透明度、底部可见性）使用 `useState` 管理
- 需要在 `BottomSheet` 和 `BottomSheetModal` 之间选择
- 底部面板内的可滚动内容未与手势协调
- 键盘未与面板正确交互

## 前置条件

- 先查看官方 [`@gorhom/bottom-sheet` 版本/兼容性表](https://github.com/gorhom/react-native-bottom-sheet#versioning)。
- 如果你的应用使用低于 v5 的 `@gorhom/bottom-sheet`，在应用本技能中的模式之前先升级到 v5。
- `@gorhom/bottom-sheet` v5 是当前维护的版本线，专为 `react-native-reanimated` v3 构建。
- `react-native-reanimated` v4 可能在某些应用中可用，但 bottom-sheet 文档未正式保证。明确决定是留在 v3 还是尝试 v4，并在设备上彻底验证。
- `react-native-gesture-handler` v2+

```bash
npm install @gorhom/bottom-sheet@^5 react-native-reanimated@^3 react-native-gesture-handler
```

> **注意**：在 v5 中，`enableDynamicSizing` 默认为 `true`。如果你需要固定的吸附点索引，或不希望库根据内容高度插入动态吸附点，请显式设置 `enableDynamicSizing={false}`。

## 问题描述

底部面板的手势、动画和滚动回调如果更新 React 状态，会重新渲染面板子树。在实践中，像 `onAnimate` 这样的回调可能在面板重新定位动画时反复运行，如果驱动昂贵的 React 更新，可能导致可见的卡顿。

## 分步说明

### 1. 将手势驱动的状态转换为 SharedValue

避免为手势驱动的视觉状态使用 React 状态。更新一个共享值并通过 `useAnimatedStyle` 消费它。

**之前：**

```jsx
const [shadowOpacity, setShadowOpacity] = useState(0);

const handleAnimate = useCallback((fromIndex, toIndex) => {
  setShadowOpacity(toIndex > 0 ? 0.3 : 0);
}, []);

<BottomSheet onAnimate={handleAnimate}>
  <View style={{ shadowOpacity }}>
    <HeavyContent />
  </View>
</BottomSheet>
```

**之后：**

```jsx
const animatedIndex = useSharedValue(0);

const shadowStyle = useAnimatedStyle(() => ({
  shadowOpacity: withTiming(animatedIndex.value > 0 ? 0.3 : 0),
}));

<BottomSheet animatedIndex={animatedIndex}>
  <Animated.View style={shadowStyle}>
    <HeavyContent />
  </Animated.View>
</BottomSheet>
```

### 2. 通过 `useAnimatedReaction` 驱动面板索引可见性

通过 `{showFooter && <Footer/>}` 基于面板索引切换内容会导致每次吸附时触发挂载/卸载循环。相反，始终挂载，通过 `animatedIndex` 驱动可见性动画，并将最小的布尔值通过 `pointerEvents`/无障碍属性桥接到一个包裹组件，使整棵树不会重新渲染。

**之前：**

```jsx
const [showFooter, setShowFooter] = useState(false);

// 每次切换时重新挂载 footer
{showFooter && <Footer />}
```

**之后：**

```jsx
const SheetVisibilityWrapper = ({ animatedIndex, threshold = 1, children }) => {
  const [isInteractive, setIsInteractive] = useState(false);

  const style = useAnimatedStyle(() => ({
    opacity: withTiming(animatedIndex.value >= threshold ? 1 : 0),
    transform: [{ translateY: withTiming(animatedIndex.value >= threshold ? 0 : 50) }],
  }));

  useAnimatedReaction(
    () => animatedIndex.value >= threshold,
    (visible, prev) => {
      if (visible !== prev) runOnJS(setIsInteractive)(visible);
    }
  );

  return (
    <Animated.View
      style={style}
      pointerEvents={isInteractive ? 'auto' : 'none'}
      accessibilityElementsHidden={!isInteractive}
      importantForAccessibility={isInteractive ? 'auto' : 'no-hide-descendants'}
    >
      {children}
    </Animated.View>
  );
};

// 使用：
<SheetVisibilityWrapper animatedIndex={animatedIndex}>
  <Footer />
</SheetVisibilityWrapper>
```

### 3. 将滚动驱动的逻辑保持在 JS 线程之外

`BottomSheetScrollView` 忽略 `scrollEventThrottle`，因此设置它不是优化。保持 JS `onScroll` 工作最少，或将滚动驱动的逻辑移至 `useAnimatedScrollHandler`（见 [js-animations-reanimated.md](./js-animations-reanimated.md)），使其保持在 UI 线程上：

```jsx
const scrollHandler = useAnimatedScrollHandler((event) => {
  scrollY.value = event.contentOffset.y;
});

<BottomSheetScrollView onScroll={scrollHandler}>
  <Content />
</BottomSheetScrollView>
```

### 4. 使用库提供的组件和属性

**可滚动组件** —— 在底部面板内始终使用这些而非 React Native 内置组件：

```jsx
import {
  BottomSheetScrollView,
  BottomSheetFlatList,
  BottomSheetSectionList,
} from '@gorhom/bottom-sheet';

// FlashList v2：BottomSheetFlashList 已弃用。
// 创建滚动组件，然后传递给 FlashList。
import { useBottomSheetScrollableCreator } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';

const BottomSheetFlashListScrollComponent = useBottomSheetScrollableCreator();

<BottomSheet snapPoints={snapPoints} enableDynamicSizing={false}>
  <FlashList
    data={data}
    keyExtractor={(item) => item.id}
    renderItem={renderItem}
    renderScrollComponent={BottomSheetFlashListScrollComponent}
  />
</BottomSheet>
```

**关键属性：**

| 属性 | 用途 |
|------|---------|
| `containerHeight` | 提供以跳过挂载时的额外测量重新渲染 |
| `enableDynamicSizing={false}` | 当需要固定吸附点索引且不希望插入动态内容高度吸附点时使用 |
| `animatedIndex` | 用于在 UI 线程上连续追踪索引的 SharedValue |
| `animatedPosition` | 用于在 UI 线程上连续追踪位置的 SharedValue |
| `onChange` | 仅在吸附**完成**时触发（离散的）—— 用于分析/副作用 |
| `onAnimate` | 在每次动画开始/重新定位前触发 —— 谨慎使用，因为可能在交互期间反复运行 |

### 5. BottomSheetModal 设置

```jsx
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';

const App = () => (
  <BottomSheetModalProvider>
    <BottomSheetModal
      ref={modalRef}
      snapPoints={snapPoints}
      enableDismissOnClose={true}
    >
      <Content />
    </BottomSheetModal>
  </BottomSheetModalProvider>
);
```

**iOS 层级修复** —— 使用 `FullWindowOverlay` 渲染在原生导航之上：

```jsx
import { FullWindowOverlay } from 'react-native-screens';

<BottomSheetModal
  containerComponent={(props) => <FullWindowOverlay>{props.children}</FullWindowOverlay>}
>
```

### 6. 键盘处理

```jsx
<BottomSheet
  snapPoints={snapPoints}
  enableDynamicSizing={false}
  keyboardBehavior="interactive"    // 'extend' | 'fillParent' | 'interactive'
  keyboardBlurBehavior="restore"    // 键盘关闭时重置面板位置
  enableBlurKeyboardOnGesture={true} // 拖拽时关闭键盘
>
  <BottomSheetTextInput
    placeholder="在此输入..."
    style={styles.input}
  />
</BottomSheet>
```

| `keyboardBehavior` | 效果 |
|--------------------|--------|
| `extend` | 面板扩展以容纳键盘 |
| `fillParent` | 键盘出现时面板填满父容器 |
| `interactive` | 面板跟随键盘位置交互 |

> 优先在底部面板内使用 `BottomSheetTextInput`。如果需要自定义输入，复制库 `BottomSheetTextInput` 实现中的焦点/失焦处理器，以确保键盘处理仍能正常运行。

## 使用 `animatedPosition` 的派生动画

使用 `animatedPosition` 共享值实现流畅的派生 UI，保持在 UI 线程上：

```jsx
const animatedPosition = useSharedValue(0);

const backdropStyle = useAnimatedStyle(() => ({
  opacity: interpolate(
    animatedPosition.value,
    [0, 300],
    [0.5, 0],
    Extrapolation.CLAMP
  ),
}));

<BottomSheet animatedPosition={animatedPosition} snapPoints={snapPoints}>
  <Content />
</BottomSheet>
<Animated.View style={[StyleSheet.absoluteFill, backdropStyle]} pointerEvents="none" />
```

## 原生替代方案：react-native-true-sheet

如果你的应用已运行在**新架构（Fabric）**上，考虑 `@lodev09/react-native-true-sheet` —— 完全原生的底部面板，完全规避 JS 重新渲染问题。

| 场景 | 推荐 |
|----------|---------------|
| 需要深入的 JS 自定义（自定义手势、动画派生 UI） | `@gorhom/bottom-sheet` |
| 标准面板，原生体验 + 无障碍 | `react-native-true-sheet` |
| 旧架构（无 Fabric） | `@gorhom/bottom-sheet`（true-sheet v3+ 需要 Fabric） |
| 需要 Web 支持 | 两者均可（true-sheet 在 Web 内部使用 `@gorhom/bottom-sheet`） |

**优势**：零 JS 开销（面板位于原生侧 —— 无需 SharedValue 管道）、内置键盘处理、原生屏幕阅读器支持、平板上的侧面板、iOS 26+ Liquid Glass 支持、React Navigation 面板导航器集成。

**要求**：v3+ 需要新架构（Fabric），旧架构使用 v2.x。

```bash
npm install @lodev09/react-native-true-sheet
```

> 如果满足要求且不需要本技能中描述的精细 Reanimated 驱动自定义，`react-native-true-sheet` 是更简单和高性能的选择。

## 常见陷阱

- **使用 `onChange` 进行连续位置追踪** —— 它仅在吸附完成时触发（离散的）。改用 `animatedPosition` 或 `animatedIndex` 共享值。
- **始终挂载的隐藏元素忘记 `pointerEvents='none'`** —— 不可见元素仍然捕获触摸。
- **隐藏元素缺少无障碍属性** —— 添加 `accessibilityElementsHidden` 和 `importantForAccessibility='no-hide-descendants'`。
- **将独立状态值捆绑在一个 context 中** —— 参见 [js-atomic-state.md](./js-atomic-state.md) 了解拆分模式。
- **认为传递 `snapPoints` 时必须禁用 `enableDynamicSizing`** —— 并非必须，但保持启用可能插入额外的吸附点并改变索引。
- **在底部面板内使用 React Native `ScrollView`/`FlatList`** —— 手势无法协调。使用 `BottomSheetScrollView`、`BottomSheetFlatList` 等。
- **在 Android 上使用 React Native 触摸组件** —— 从 `@gorhom/bottom-sheet` 导入 `TouchableOpacity`、`TouchableHighlight` 或 `TouchableWithoutFeedback`。
- **未提供 `containerHeight`** —— 导致挂载时进行额外测量重新渲染。
- **使用自定义 `TextInput` 但未移植库的焦点/失焦处理器** —— 键盘处理将不完整。除非需要自定义输入，否则优先使用 `BottomSheetTextInput`。

## 相关技能

- [js-animations-reanimated.md](./js-animations-reanimated.md) —— SharedValue 和 useAnimatedStyle 基础
- [js-atomic-state.md](./js-atomic-state.md) —— Context 拆分和原子化状态模式
- [js-profile-react.md](./js-profile-react.md) —— 性能分析以测量重新渲染减少
- [js-measure-fps.md](./js-measure-fps.md) —— 验证优化后的 FPS 改进
