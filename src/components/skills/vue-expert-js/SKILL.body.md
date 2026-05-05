# Vue Expert（JavaScript）

面向 Vue 3 JavaScript 项目的实现技能。目标是在不引入 TypeScript 的前提下，仍然保持组件 API、composable 返回值、Pinia store 与测试代码具备清晰的 JSDoc 类型边界。

## 适用场景

- 需要用纯 JavaScript 编写 Vue 3 组件、composable、Pinia store 或 Vite 配置。
- 项目明确不启用 TypeScript，但仍要求通过 `@typedef`、`@param`、`@returns`、`@type` 保持 API 自描述。
- 需要把 Vue 2 Options API 逐步迁移到 Vue 3 Composition API，并保持文件仍为 `.js` / `.mjs` / `.vue`。
- 需要为 Vue JavaScript 代码补 Vitest 测试时，联动 `javascript-typescript-jest`。
- 涉及更广义的 ES 模块、异步流程或数据变换时，联动 `modern-javascript-patterns`。
- 需要展开某一专题时，按需查阅：
  - [JSDoc 标注参考](references/jsdoc-typing.md)
  - [Composable 模式](references/composables-patterns.md)
  - [组件结构](references/component-architecture.md)
  - [状态管理](references/state-management.md)
  - [测试模式](references/testing-patterns.md)

## 核心约束

- 统一使用 Vue 3 Composition API 与 `<script setup>`；不要回退到 Options API 作为默认实现。
- 禁止使用 TypeScript 语法：不写 `lang="ts"`、不写 `.ts` / `.tsx`，也不在 JavaScript 文件里塞入 TS-only 语法。
- 公开 API 必须带 JSDoc：组件 props / emits、导出函数、store action、公共 composable 返回值都要能从注释看出契约。
- 复杂对象形状用 `@typedef` 明确声明；跨文件复用的类型通过 `import('./path').TypeName` 引用，不复制粘贴类型描述。
- `.mjs` 只在需要显式 ESM 边界时使用；普通浏览器端模块沿用项目既有 `.js` 约定，不为“看起来更现代”盲目改后缀。
- 验证顺序固定为“先 JSDoc 完整，再跑测试”；测试失败时优先修逻辑或注释契约不一致，而不是弱化断言。

## 代码模式

### 1. 组件：props 与 emits 同时声明运行时约束和 JSDoc 契约

```vue
<script setup>
/**
 * @typedef {Object} UserCardProps
 * @property {string} userId - 用户唯一标识
 * @property {string} name - Display name of the user
 * @property {number} age - User's age
 * @property {boolean} [isAdmin=false] - 是否具有管理员权限
 */

/** @type {UserCardProps} */
const props = defineProps({
  userId:  { type: String,  required: true },
  name:    { type: String,  required: true },
  age:     { type: Number,  required: true },
  isAdmin: { type: Boolean, default: false },
});

const emit = defineEmits({
  /**
   * @param {string} userId
   * @returns {boolean}
   */
  select: (userId) => typeof userId === "string" && userId.length > 0,
});

/** @param {string} userId */
function handleSelect(userId) {
  emit("select", userId);
}
</script>

<template>
  <div @click="handleSelect(props.userId)">
    {{ props.name }} ({{ props.age }})
  </div>
</template>
```

### 2. Composable：用 `@typedef` 固定返回契约

```js
// composables/useCounter.mjs
import { computed, ref } from "vue";

/**
 * @typedef {Object} CounterState
 * @property {import("vue").Ref<number>} count - 当前计数
 * @property {import("vue").ComputedRef<boolean>} isPositive - 是否大于 0
 * @property {() => void} increment - 按步长递增
 * @property {() => void} reset - 重置为初始值
 */

/**
 * 提供一个带步长的计数器 composable。
 * @param {number} [initial=0] - 初始值
 * @param {number} [step=1] - 每次递增的步长
 * @returns {CounterState}
 */
export function useCounter(initial = 0, step = 1) {
  /** @type {import("vue").Ref<number>} */
  const count = ref(initial);

  const isPositive = computed(() => count.value > 0);

  function increment() {
    count.value += step;
  }

  function reset() {
    count.value = initial;
  }

  return { count, isPositive, increment, reset };
}
```

### 3. 跨文件类型：让 store / composable 共享同一对象定义

```js
// types/user.mjs

/**
 * @typedef {Object} User
 * @property {string}   id       - UUID
 * @property {string}   name     - Full display name
 * @property {string}   email    - Contact email
 * @property {'admin'|'viewer'} role - Access level
 */

// 在其它文件里这样引用：
// /** @type {import('./types/user.mjs').User} */
```

## 检查清单

- 组件是否使用 `<script setup>`，并把 props / emits 的运行时校验与 JSDoc 契约同时写清楚。
- 每个导出的 composable / store action 是否都带 `@param` / `@returns`，返回结构是否能被 `@typedef` 描述。
- 共享对象形状是否已经抽出为 `@typedef`，而不是在多个文件重复手写字段说明。
- `.vue` / `.js` / `.mjs` 文件里是否仍残留 `lang="ts"`、类型断言、接口、枚举等 TypeScript 语法。
- 测试是否覆盖了组件事件、composable 返回值或 store action 的关键行为，而不是只验证实现细节。
- 若引入外部参考技能，链接是否真实存在，且当前任务确实需要展开到更通用的 JavaScript 模式。

## 反模式

### FAIL: JSDoc 与运行时脱节

```js
defineProps(['userId', 'age']); // 编辑器以为 age 是 number，运行时传 string 也不警告
```

### PASS: JSDoc + 运行时同时声明

```js
/** @type {{userId: string, age: number}} */
defineProps({ userId: { type: String, required: true }, age: { type: Number, required: true } });
```

- composable 返回未约束的巨大对象，调用方不知道哪些字段稳定。
- 为"类型安全"把简单对象抽成独立文件，制造跨目录跳转噪音。
- 使用 `require()` 或 CommonJS 导出，破坏 Vite ESM 一致性。
