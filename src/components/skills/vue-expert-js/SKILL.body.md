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
