---
title: 并发 React
impact: HIGH
tags: useDeferredValue, useTransition, suspense, concurrent
---

# 技能：并发 React

使用 `useDeferredValue` 和 `useTransition` 通过优先处理关键更新来改善感知性能。

## 快速模式

**错误做法（每次按键都阻塞输入）：**

```jsx
const [query, setQuery] = useState('');
<TextInput value={query} onChangeText={setQuery} />
<ExpensiveList query={query} />  // 阻塞输入
```

**正确做法（输入保持响应）：**

```jsx
const [query, setQuery] = useState('');
const deferredQuery = useDeferredValue(query);
<TextInput value={query} onChangeText={setQuery} />
<ExpensiveList query={deferredQuery} />  // 延迟更新
```

## 适用场景

- 搜索/筛选输入在大结果集下感觉迟钝
- 昂贵的计算阻塞了 UI 交互
- 加载状态出现过于频繁
- 希望在加载新内容时仍显示旧内容
- 需要优先处理用户输入而非后台更新

## 前置条件

- 启用新架构的 React Native（RN 0.76+ 默认）
- React 18+ 特性（`useDeferredValue`、`useTransition`、`Suspense`）

## 概念概述

**并发 React** 允许更新被：
- **暂停**：低优先级工作可以等待
- **中断**：用户输入优先处理
- **放弃**：过时的更新可以被跳过

## 分步说明

### 模式 1：使用 `useDeferredValue` 延迟昂贵的渲染

当某个值驱动昂贵计算但希望输入保持响应时使用。

```jsx
import { useState, useDeferredValue } from 'react';

const SearchScreen = () => {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  
  // query 立即更新（输入保持响应）
  // deferredQuery 在 React 有空时更新
  
  return (
    <View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="搜索..."
      />
      {/* ExpensiveList 接收延迟值 */}
      <ExpensiveList query={deferredQuery} />
    </View>
  );
};
```

### 模式 2：加载时显示旧内容

```jsx
const SearchWithStaleIndicator = () => {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;
  
  return (
    <View>
      <TextInput value={query} onChangeText={setQuery} />
      <View style={isStale && { opacity: 0.7 }}>
        <SearchResults query={deferredQuery} />
      </View>
      {isStale && <ActivityIndicator />}
    </View>
  );
};
```

### 模式 3：使用 `useTransition` 处理非关键更新

当有多个状态更新且希望将某些标记为低优先级时使用。

```jsx
import { useState, useTransition } from 'react';

const TransitionExample = () => {
  const [count, setCount] = useState(0);
  const [heavyData, setHeavyData] = useState(null);
  const [isPending, startTransition] = useTransition();
  
  const handleIncrement = () => {
    // 高优先级 —— 立即更新
    setCount(c => c + 1);
    
    // 低优先级 —— 可被中断
    startTransition(() => {
      setHeavyData(computeExpensiveData());
    });
  };
  
  return (
    <View>
      <Text>Count: {count}</Text>
      {isPending ? <ActivityIndicator /> : <HeavyComponent data={heavyData} />}
      <Button onPress={handleIncrement} title="Increment" />
    </View>
  );
};
```

### 模式 4：Suspense 用于数据获取

```jsx
import { Suspense, useDeferredValue } from 'react';

const DataScreen = () => {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  
  return (
    <View>
      <TextInput value={query} onChangeText={setQuery} />
      <Suspense fallback={<LoadingSpinner />}>
        <SearchResults query={deferredQuery} />
      </Suspense>
    </View>
  );
};
```

## 代码示例

### 慢组件优化

```jsx
// 无并发 React —— UI 卡死
const SlowSearch = () => {
  const [query, setQuery] = useState('');
  
  return (
    <>
      <TextInput value={query} onChangeText={setQuery} />
      <SlowComponent query={query} /> {/* 阻塞每次按键 */}
    </>
  );
};

// 有并发 React —— UI 保持响应
const FastSearch = () => {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  
  return (
    <>
      <TextInput value={query} onChangeText={setQuery} />
      <SlowComponent query={deferredQuery} />
    </>
  );
};

// 重要：将 SlowComponent 包裹在 memo 中，防止来自父组件的重新渲染
const SlowComponent = memo(({ query }) => {
  // 在这里执行昂贵计算
});
```

### 自动批处理（React 18+）

React 18 自动批处理状态更新：

```jsx
// React 18 之前 —— 2 次重新渲染
setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
  // 渲染了两次
}, 1000);

// React 18+ —— 1 次重新渲染（自动批处理）
setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
  // 只渲染一次！
}, 1000);
```

## 何时使用哪个

| 场景 | 解决方案 |
|----------|----------|
| 单个值驱动昂贵渲染 | `useDeferredValue` |
| 多个状态更新，部分非关键 | `useTransition` |
| 需要转换的加载指示器 | `useTransition`（有 `isPending`） |
| 数据获取带加载状态 | `Suspense` + `useDeferredValue` |
| 简单的父到子值延迟 | `useDeferredValue` |

## 重要考量

1. **将昂贵的组件包裹在 `memo()` 中**：没有 memoization，组件无论如何会因父组件重新渲染。

2. **与新架构一起使用**：并发特性需要 React Native 的新架构。

3. **不要过度使用**：仅延迟真正昂贵的工作。为快速组件增加复杂度是适得其反的。

## 常见陷阱

- **忘记 memo()**：如果子组件因父组件重新渲染，`useDeferredValue` 毫无用处
- **对简单状态使用**：对廉价更新来说，开销不值得
- **期望更快计算**：这些 hooks 不会让代码更快，它们优先安排运行时机

## 相关技能

- [js-profile-react.md](./js-profile-react.md) —— 识别慢组件
- [js-react-compiler.md](./js-react-compiler.md) —— 自动 memoization
- [js-lists-flatlist-flashlist.md](./js-lists-flatlist-flashlist.md) —— 列表特定优化
