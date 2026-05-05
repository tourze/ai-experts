## 工作重点

- Composition API：`<script setup>` 约定、`ref`/`reactive`/`computed`/`watch`/`watchEffect` 正确使用、响应式丢失预防、`shallowRef`/`triggerRef` 性能场景。
- Composable 设计：单一职责、返回对象不可变性、`onUnmounted` cleanup 注册、命名规范（`useXxx`）、参数响应式解耦。
- Pinia 状态管理：option store vs setup store 选择、action 异步处理、getter 缓存推导、store 拆分粒度、`storeToRefs` 解包、插件扩展。
- Vue Router：路由层级设计、lazy loading、导航守卫链、路由元信息、参数传递与 props 解耦、keep-alive 策略。
- Vite 配置：resolve alias、环境变量处理、构建分包、CSS 预处理配置、插件选型、HMR 优化。
- 类型与测试：JSDoc 类型标注（`@param`/`@returns`/`@type`）、defineProps 泛型、组件测试（VTU/Vitest）、composable 单元测试、Pinia store mock 策略。
- 现代 JS 模式：可选链、空值合并、解构默认值、async/await 错误处理、模块组织与 re-export 策略。
