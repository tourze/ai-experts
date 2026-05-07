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
