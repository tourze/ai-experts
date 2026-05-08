---
title: 原子化状态管理
impact: HIGH
tags: state, jotai, zustand, re-renders, context
---

# 技能：原子化状态管理

使用原子化状态库（Jotai、Zustand）减少不必要的重新渲染，无需手动 memoization。

## 快速模式

**之前（Context —— 所有消费者都重新渲染）：**

```jsx
const { filter, todos } = useContext(TodoContext);
// 任何状态变化时都会重新渲染
```

**之后（Zustand —— 仅订阅具体状态）：**

```jsx
const filter = useTodoStore((s) => s.filter);
// 仅当 filter 变化时重新渲染
```

## 适用场景

- 全局状态变化导致大范围重新渲染
- 使用 React Context 管理应用状态
- 组件在其数据未变化时也重新渲染
- 希望避免各处手写 `useMemo`/`useCallback`
- 尚未准备好采用 React Compiler

## 前置条件

- 状态管理库：`jotai` 或 `zustand`

```bash
npm install jotai
# 或
npm install zustand
```

## 问题描述

使用传统 React 状态或 Context：

```jsx
// 当 filter 或 todos 变化时，所有内容都重新渲染
const App = () => {
  const [filter, setFilter] = useState('all');
  const [todos, setTodos] = useState([]);
  
  return (
    <>
      <FilterMenu filter={filter} setFilter={setFilter} />
      <TodoList todos={todos} filter={filter} setTodos={setTodos} />
    </>
  );
};
```

更改一个 todo 会重新渲染 FilterMenu，即使它不使用 todos。

## 分步说明

### 使用 Jotai

#### 1. 定义 Atom

```jsx
import { atom } from 'jotai';

// 每个 atom 是一块独立的状态
const filterAtom = atom('all');
const todosAtom = atom([]);

// 派生 atom（计算值）
const filteredTodosAtom = atom((get) => {
  const filter = get(filterAtom);
  const todos = get(todosAtom);
  
  if (filter === 'active') return todos.filter(t => !t.completed);
  if (filter === 'completed') return todos.filter(t => t.completed);
  return todos;
});
```

#### 2. 在组件中使用 Atom

```jsx
import { useAtom, useAtomValue, useSetAtom } from 'jotai';

// 仅当 filterAtom 变化时重新渲染
const FilterMenu = () => {
  const [filter, setFilter] = useAtom(filterAtom);
  
  return (
    <View>
      {['all', 'active', 'completed'].map((f) => (
        <Pressable key={f} onPress={() => setFilter(f)}>
          <Text style={filter === f ? styles.active : null}>{f}</Text>
        </Pressable>
      ))}
    </View>
  );
};

// 仅当 todosAtom 变化时重新渲染
const TodoItem = ({ id }) => {
  const setTodos = useSetAtom(todosAtom);  // 仅设置器，读取时不重新渲染
  
  const toggleTodo = () => {
    setTodos((prev) => 
      prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t)
    );
  };
  
  return <Pressable onPress={toggleTodo}>...</Pressable>;
};
```

### 使用 Zustand

#### 1. 创建 Store

```jsx
import { create } from 'zustand';

const useTodoStore = create((set, get) => ({
  filter: 'all',
  todos: [],
  
  setFilter: (filter) => set({ filter }),
  
  toggleTodo: (id) => set((state) => ({
    todos: state.todos.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ),
  })),
  
  // 派生状态的选择器
  getFilteredTodos: () => {
    const { filter, todos } = get();
    if (filter === 'active') return todos.filter(t => !t.completed);
    if (filter === 'completed') return todos.filter(t => t.completed);
    return todos;
  },
}));
```

#### 2. 使用选择器

```jsx
// 仅当 filter 变化时重新渲染
const FilterMenu = () => {
  const filter = useTodoStore((state) => state.filter);
  const setFilter = useTodoStore((state) => state.setFilter);
  
  return (
    <View>
      {['all', 'active', 'completed'].map((f) => (
        <Pressable key={f} onPress={() => setFilter(f)}>
          <Text>{f}</Text>
        </Pressable>
      ))}
    </View>
  );
};

// 仅当 todos 变化时重新渲染
const TodoList = () => {
  const todos = useTodoStore((state) => state.todos);
  return todos.map((todo) => <TodoItem key={todo.id} {...todo} />);
};
```

## 代码示例

### 之前：基于 Context（多次重新渲染）

```jsx
const TodoContext = createContext();

const TodoProvider = ({ children }) => {
  const [state, setState] = useState({ filter: 'all', todos: [] });
  return (
    <TodoContext.Provider value={{ state, setState }}>
      {children}
    </TodoContext.Provider>
  );
};

// 使用此 Context 的每个组件在任何状态变更时都会重新渲染
const FilterMenu = () => {
  const { state, setState } = useContext(TodoContext);
  // 当 todos 变化时也会重新渲染！
};
```

### 之后：原子化（精确重新渲染）

```jsx
// Jotai 版本 —— 仅受影响的组件重新渲染
const filterAtom = atom('all');
const todosAtom = atom([]);

const FilterMenu = () => {
  const [filter, setFilter] = useAtom(filterAtom);
  // 仅当 filter 变化时重新渲染
};

const TodoList = () => {
  const todos = useAtomValue(todosAtom);
  // 仅当 todos 变化时重新渲染
};
```

## 对比

| 特性 | Context | Jotai | Zustand |
|---------|---------|-------|---------|
| 重新渲染范围 | 所有消费者 | Atom 订阅者 | 选择器订阅者 |
| 派生状态 | 手动 | 内置 atom | 选择器 |
| DevTools | React DevTools | Jotai DevTools | Zustand DevTools |
| 打包大小 | 0 KB | ~3 KB | ~2 KB |
| 学习曲线 | 低 | 中 | 低 |

## 何时使用哪个

- **Jotai**：细粒度状态、许多小 atom、派生/异步 atom
- **Zustand**：更简单的思维模型、单个 store、熟悉的 Redux 风格模式
- **React Compiler**：如果可用，可能无需这些库

## 常见陷阱

- **过度原子化**：不要为每个变量创建 atom。将相关状态分组。
- **Zustand 中缺少选择器**：始终使用选择器以防止不必要的重新渲染。
- **派生状态无 memoization**：使用派生 atom（Jotai）或带 memo 的选择器。

## 相关技能

- [js-bottomsheet.md](./js-bottomsheet.md) —— 避免 context 驱动的底部面板子树重新渲染
- [js-react-compiler.md](./js-react-compiler.md) —— 自动 memoization 替代方案
- [js-profile-react.md](./js-profile-react.md) —— 验证重新渲染减少
