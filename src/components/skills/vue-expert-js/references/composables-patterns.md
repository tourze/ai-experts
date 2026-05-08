# Composables 模式

---

## 基本 Composable 结构

```javascript
// composables/useToggle.js
import { ref } from 'vue'

/**
 * @typedef {Object} UseToggleReturn
 * @property {import('vue').Ref<boolean>} value
 * @property {() => void} toggle
 */

/**
 * @param {boolean} [initialValue=false]
 * @returns {UseToggleReturn}
 */
export function useToggle(initialValue = false) {
  const value = ref(initialValue)
  const toggle = () => { value.value = !value.value }
  return { value, toggle }
}
```

---

## Ref vs Reactive

```javascript
import { ref, reactive, toRefs, toValue } from 'vue'

// 对基本类型、可重新赋值值、composable 返回值使用 ref
/** @type {import('vue').Ref<number>} */
const count = ref(0)

// 对具有嵌套属性的复杂对象使用 reactive
/** @type {{ email: string, password: string }} */
const form = reactive({ email: '', password: '' })

// 将 reactive 转换为 refs 以便解构
const { email, password } = toRefs(form)

// 解包 ref 或返回普通值
/** @param {number | import('vue').Ref<number>} maybeRef */
function double(maybeRef) {
  return toValue(maybeRef) * 2
}
```

---

## 生命周期 Hooks

```javascript
// composables/useEventListener.js
import { onMounted, onUnmounted, toValue } from 'vue'

/**
 * @template {keyof WindowEventMap} K
 * @param {K} event
 * @param {(ev: WindowEventMap[K]) => void} handler
 * @param {EventTarget | import('vue').Ref<EventTarget>} [target=window]
 */
export function useEventListener(event, handler, target = window) {
  onMounted(() => toValue(target).addEventListener(event, handler))
  onUnmounted(() => toValue(target).removeEventListener(event, handler))
}
```

```javascript
// 生命周期感知的异步（防止卸载后更新状态）
import { ref, onUnmounted } from 'vue'

export function useAsyncState(fn) {
  const data = ref(null)
  const loading = ref(false)
  let isMounted = true

  onUnmounted(() => { isMounted = false })

  async function execute() {
    loading.value = true
    try {
      const result = await fn()
      if (isMounted) data.value = result
    } finally {
      if (isMounted) loading.value = false
    }
  }

  return { data, loading, execute }
}
```

---

## 共享状态（单例）

```javascript
// composables/useNotifications.js
import { ref, readonly } from 'vue'

// 模块级状态 = 跨所有组件共享的单例
/** @type {import('vue').Ref<Array<{id: string, message: string}>>} */
const notifications = ref([])

export function useNotifications() {
  /** @param {string} message */
  function notify(message) {
    const id = Date.now().toString()
    notifications.value.push({ id, message })
    setTimeout(() => dismiss(id), 5000)
  }

  /** @param {string} id */
  function dismiss(id) {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  return {
    notifications: readonly(notifications),
    notify,
    dismiss
  }
}
```

---

## 可取消的异步

```javascript
// composables/useCancellableFetch.js
import { ref, onUnmounted } from 'vue'

export function useCancellableFetch() {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(false)
  /** @type {AbortController | null} */
  let controller = null

  /** @param {string} url */
  async function execute(url) {
    controller?.abort()
    controller = new AbortController()
    loading.value = true
    error.value = null

    try {
      const res = await fetch(url, { signal: controller.signal })
      data.value = await res.json()
    } catch (e) {
      if (/** @type {Error} */ (e).name !== 'AbortError') {
        error.value = /** @type {Error} */ (e)
      }
    } finally {
      loading.value = false
    }
  }

  onUnmounted(() => controller?.abort())

  return { data, error, loading, execute }
}
```

---

## 快速参考

| 模式 | 使用场景 |
|------|----------|
| `ref()` | 基本类型、传给/来自 composable 的值 |
| `reactive()` | 具有嵌套响应式的对象 |
| `toRefs()` | 解构 reactive 时保持响应式 |
| `toValue()` | 解包 ref 或返回普通值 |
| 模块级 ref | 单例共享状态 |
| 工厂函数 | 每个组件的新实例 |
| `onUnmounted` | 清理定时器、监听器、AbortController |
