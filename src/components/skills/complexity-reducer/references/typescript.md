# TypeScript / JavaScript 精简模式

## 目录

1. [类型系统运用](#类型系统运用)
2. [结构模式](#结构模式)
3. [模块设计](#模块设计)
4. [反模式](#反模式)
5. [React 专项](#react-专项)

---

## 类型系统运用

### 判别联合代替类型守卫

```typescript
// 改造前——字符串化类型，容易遗漏分支
type Event = { type: string; payload: unknown };

function handle(event: Event) {
    if (event.type === "click") { ... }
    else if (event.type === "key") { ... }
}

// 改造后——穷尽检查，编译器保障
type Event =
    | { type: "click"; x: number; y: number }
    | { type: "key"; key: string };

function handle(event: Event) {
    switch (event.type) {
        case "click": return handleClick(event.x, event.y);
        case "key": return handleKey(event.key);
    }
    // 穷尽性：此处 event 为 `never`
    const _exhaustive: never = event;
}
```

### `satisfies` 用于验证对象字面量

```typescript
const config = {
  port: 8080,
  host: "localhost",
} satisfies ServerConfig;
// 类型被精确推断（字面量类型），同时根据 ServerConfig 验证
```

### 品牌类型用于领域标识符

```typescript
type UserId = string & { readonly __brand: "UserId" };
type OrderId = string & { readonly __brand: "OrderId" };

// 防止在需要 OrderId 的地方意外传入 UserId
function getOrder(id: OrderId): Order { ... }
```

### `const` 断言用于不可变字面量

```typescript
const DIRECTIONS = ["north", "south", "east", "west"] as const;
type Direction = (typeof DIRECTIONS)[number]; // "north" | "south" | "east" | "west"
```

---

## 结构模式

### 提前返回 / 卫语句

与所有语言同样的原则。让主路径保持在最低缩进级：

```typescript
// 改造前——深度嵌套
async function processRequest(req: Request): Promise<Response> {
  if (req.body) {
    const parsed = JSON.parse(req.body);
    if (parsed.userId) {
      const user = await getUser(parsed.userId);
      if (user) {
        return buildResponse(user);
      }
    }
  }
  return errorResponse(400);
}

// 改造后
async function processRequest(req: Request): Promise<Response> {
  if (!req.body) return errorResponse(400);
  const parsed = JSON.parse(req.body);
  if (!parsed.userId) return errorResponse(400);
  const user = await getUser(parsed.userId);
  if (!user) return errorResponse(400);
  return buildResponse(user);
}
```

### 对象解构提升清晰度

```typescript
// 改造前
function render(props: Props) {
  return h("div", null, props.title, props.description, props.author.name);
}

// 改造后
function render({ title, description, author: { name } }: Props) {
  return h("div", null, title, description, name);
}
```

### `Map` / `Set` 代替对象查找

当键是动态的或非字符串时使用 `Map`/`Set`。它们有正确的迭代顺序、`.size` 属性，且不与原型属性冲突。

---

## 模块设计

### 命名导出优于默认导出

命名导出支持更好的 tree-shaking、重构支持和导入一致性。

### 桶文件——谨慎使用

`index.ts` 重导出虽然方便，但可能破坏 tree-shaking 并引起循环依赖问题。用于对外 API 面，而非内部组织。

### 导入中显式扩展名

对于 ESM 项目，在导入路径中包含 `.js` 扩展名（即使在 Node ESM 环境下引用 `.ts` 源文件时也是如此）。

---

## 反模式

| 反模式 | 修复方案 |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| `any` 类型注解 | 缩小为具体类型；真正动态时使用 `unknown` + 类型守卫 |
| 嵌套三元表达式 | `switch`、if/else 链，或提取为函数 |
| `== null` vs `=== null` | 使用 `== null` 同时捕获 null 和 undefined（这是有意用法） |
| 用 `Promise` 构造器包装 async/await | 直接使用 `async`/`await` |
| 用 `setTimeout(fn, 0)` 控制顺序 | 使用 `queueMicrotask` 或重构逻辑 |
| 对数组使用 `for...in` | 使用 `for...of`、`.forEach()` 或数组方法 |
| 抛出字符串 | 抛出 `Error` 实例（保留堆栈信息） |
| 简单联合类型用带字符串值的 Enum | 直接用字符串字面量联合类型 |

---

## React 专项

### 组件提取信号

以下情况提取组件：

- JSX 块有自己的 state 或 effect
- 同一标记模式出现 3 次以上
- 区块有独立职责（表单、列表、头部）

### Hook 组合

以下情况提取自定义 hook：

- 多个 state/effect 配对协同工作
- 同一 hook 组合出现在多个组件中
- 业务逻辑可以与展示层分离

### 避免 JSX Props 中的内联对象/数组字面量

```tsx
// 改造前——每次渲染创建新引用，破坏 memoization
<Chart options={{ animate: true }} data={[1, 2, 3]} />;

// 改造后
const chartOptions = useMemo(() => ({ animate: true }), []);
const data = useMemo(() => [1, 2, 3], []);
<Chart options={chartOptions} data={data} />;
```

### 列表项 `key` 优先使用稳定标识符

永远不要用数组索引作为可能重排列表的 key。
