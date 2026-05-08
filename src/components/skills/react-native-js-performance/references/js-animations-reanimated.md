---
title: 高性能动画
impact: MEDIUM
tags: reanimated, animations, worklets, ui-thread
---

# 技能：高性能动画

使用 React Native Reanimated 实现流畅的 60+ FPS 动画。

## 快速模式

**错误做法（JS 线程 - 在繁重工作时阻塞）：**

```jsx
const opacity = useRef(new Animated.Value(0)).current;
Animated.timing(opacity, { toValue: 1 }).start();
```

**正确做法（UI 线程 - 即使 JS 忙碌也流畅）：**

```jsx
const opacity = useSharedValue(0);
const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
opacity.value = withTiming(1);
```

## 适用场景

- 动画掉帧或感觉卡顿
- UI 在动画期间卡死
- 需要手势驱动动画
- 希望在 JS 繁重工作时动画仍能运行

## 前置条件

- 已安装 `react-native-reanimated`（v4+）和 `react-native-worklets`

```bash
npm install react-native-reanimated react-native-worklets
```

添加到 `babel.config.js`：

```javascript
module.exports = {
  plugins: ['react-native-worklets/plugin'],  // 必须放在最后
};
```

> **注意**：Reanimated 4 需要 React Native 的**新架构**（Fabric + TurboModules）。旧架构不再支持。如果从 v3 升级，请参阅本文档末尾的迁移说明。

## 关键概念

### 主线程 vs JS 线程

- **主/UI 线程**：处理原生渲染（目标 60+ FPS）
- **JS 线程**：运行 React 和你的 JavaScript

**问题**：繁重的 JS 工作会阻塞在 JS 线程上运行的动画。

**解决方案**：使用 Reanimated worklets 在 UI 线程上运行动画。

## 分步说明

### 1. 基础动画样式（UI 线程）

```jsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated';

const FadeInView = () => {
  const opacity = useSharedValue(0);

  // 这在 UI 线程上运行 - 不会被 JS 阻塞
  const animatedStyle = useAnimatedStyle(() => {
    return { opacity: opacity.value };
  });

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
  }, []);

  return <Animated.View style={[styles.box, animatedStyle]} />;
};
```

### 2. 使用 `scheduleOnUI` 在 UI 线程上运行代码

```jsx
import { scheduleOnUI } from 'react-native-worklets';

const triggerAnimation = () => {
  scheduleOnUI(() => {
    'worklet';
    console.log('Running on UI thread');
    // 在此进行直接的 UI 操作
  });
};
```

### 3. 使用 `scheduleOnRN` 从 UI 线程调用 JS

```jsx
import { scheduleOnRN } from 'react-native-worklets';

// 常规 JS 函数
const trackAnalytics = (value) => {
  analytics.track('animation_complete', { value });
};

const AnimatedComponent = () => {
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    // 当动画完成时，调用 JS 函数
    if (progress.value === 1) {
      scheduleOnRN(trackAnalytics, progress.value);
    }
    return { opacity: progress.value };
  });

  return <Animated.View style={animatedStyle} />;
};
```

### 4. 带回调的动画

```jsx
import { scheduleOnRN } from 'react-native-worklets';

const AnimatedButton = () => {
  const scale = useSharedValue(1);

  const onComplete = () => {
    console.log('Animation finished!');
  };

  const handlePress = () => {
    scale.value = withTiming(
      1.2,
      { duration: 200 },
      (finished) => {
        if (finished) {
          scheduleOnRN(onComplete);
        }
      }
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.button, animatedStyle]}>
        <Text>Press Me</Text>
      </Animated.View>
    </Pressable>
  );
};
```

## 何时使用什么

| 线程 | 最适合 |
|--------|----------|
| **UI 线程**（worklets） | 视觉动画、变换、手势 |
| **JS 线程** | 状态更新、数据处理、API 调用 |

| Hook/API | 用例 |
|----------|----------|
| `useAnimatedStyle` | 动画样式（自动在 UI 线程） |
| `scheduleOnUI` | 手动 UI 线程执行（来自 `react-native-worklets`） |
| `scheduleOnRN` | 从 worklet 调用 JS 函数（来自 `react-native-worklets`） |
| `useTransition` | React 状态驱动延迟的替代方案 |

## 常见陷阱

- **在 worklet 中访问 React 状态**：使用 `useSharedValue` 代替 `useState` 作为动画值
- **未使用 Animated 组件**：必须使用 `Animated.View`、`Animated.Text` 等
- **在 useAnimatedStyle 中做重计算**：保持 worklet 轻量快速
- **忘记 'worklet' 指令**：内联 worklet 函数需要此指令

```jsx
// 错误：在 useAnimatedStyle 中使用普通函数
const style = useAnimatedStyle(() => {
  heavyComputation();  // 阻塞 UI 线程！
  return { opacity: 1 };
});

// 正确：保持 worklet 轻量
const style = useAnimatedStyle(() => {
  return { opacity: opacity.value };  // 只读取值
});
```

## 从 Reanimated 3.x 迁移到 4.x

如果你正在从 Reanimated 3.x 升级，以下是主要变更。

> **无法升级到 v4？** 如果你的项目因某些原因无法迁移到新架构（例如原生库不兼容、复杂的原生代码或时间线限制），请继续使用现有 API，并在适用处利用原生驱动。避免引入旧版 Reanimated 3.x 或更早版本，以减少未来的迁移复杂度。

### 破坏性变更

| 旧 API（v3） | 新 API（v4） | 包 |
|--------------|--------------|---------|
| `runOnUI(() => {...})()` | `scheduleOnUI(() => {...})` | `react-native-worklets` |
| `runOnJS(fn)(args)` | `scheduleOnRN(fn, args)` | `react-native-worklets` |
| `executeOnUIRuntimeSync` | `runOnUISync` | `react-native-worklets` |
| `runOnRuntime` | `scheduleOnRuntime` | `react-native-worklets` |
| `useScrollViewOffset` | `useScrollOffset` | `react-native-reanimated` |
| `useWorkletCallback` | 使用带 `'worklet';` 指令的 `useCallback` | React |

### 已移除的 API

- `useAnimatedGestureHandler` —— 迁移到 `react-native-gesture-handler` v2+ 的手势 API
- `addWhitelistedNativeProps` / `addWhitelistedUIProps` —— 不再需要
- `combineTransition` —— 改用 `EntryExitTransition.entering(...).exiting(...)`

### withSpring 变更

```jsx
// 之前（v3）
withSpring(value, {
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
  duration: 300,
});

// 之后（v4）
withSpring(value, {
  energyThreshold: 0.01,  // 替代两个阈值参数
  duration: 200,          // 持续时间现在是"感知性"（约 1.5 倍实际时间）
});
```

### 迁移检查清单

1. **启用新架构** —— Reanimated 4 仅支持 Fabric + TurboModules
2. **安装 `react-native-worklets`** —— 必需的新依赖
3. **更新 Babel 插件** —— 将 `'react-native-reanimated/plugin'` 改为 `'react-native-worklets/plugin'`
4. **更新导入** —— 将 worklet 函数移至 `react-native-worklets`
5. **更新 API 调用** —— 新函数直接接受回调 + 参数（非柯里化）
6. **重建原生应用** —— 添加 `react-native-worklets` 后需要

## 相关技能

- [js-measure-fps.md](./js-measure-fps.md) —— 验证动画帧率
- [js-bottomsheet.md](./js-bottomsheet.md) —— 保持底部面板视觉状态在 UI 线程上
- [js-concurrent-react.md](./js-concurrent-react.md) —— 使用 useTransition 进行 React 级别延迟
