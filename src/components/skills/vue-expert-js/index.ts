import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { javascriptTypescriptJestSkill } from "../javascript-typescript-jest/index";
import { modernJavascriptPatternsSkill } from "../modern-javascript-patterns/index";

export const vueExpertJsSkill = defineSkill({
  id: "vue-expert-js",
  fullName: "Vue Expert（JavaScript）",
  description: "当用户用 JavaScript 编写 Vue 3、Pinia、composable、JSDoc 或 Vite 相关代码时使用。",
  useCases: [
    "需要用纯 JavaScript 编写 Vue 3 组件、composable、Pinia store 或 Vite 配置。",
    "项目明确不启用 TypeScript，但仍要求通过 `@typedef`、`@param`、`@returns`、`@type` 保持 API 自描述。",
    "需要把 Vue 2 Options API 逐步迁移到 Vue 3 Composition API，并保持文件仍为 `.js` / `.mjs` / `.vue`。",
    "需要为 Vue JavaScript 代码补 Vitest 测试时，联动 `javascript-typescript-jest`。",
    "涉及更广义的 ES 模块、异步流程或数据变换时，联动 `modern-javascript-patterns`。",
    "需要展开某一专题时，按需查阅：\n- [JSDoc 标注参考](references/jsdoc-typing.md)\n- [Composable 模式](references/composables-patterns.md)\n- [组件结构](references/component-architecture.md)\n- [状态管理](references/state-management.md)\n- [测试模式](references/testing-patterns.md)",
  ],
  constraints: [
    "统一使用 Vue 3 Composition API 与 `<script setup>`；不要回退到 Options API 作为默认实现。",
    "禁止使用 TypeScript 语法：不写 `lang=\"ts\"`、不写 `.ts` / `.tsx`，也不在 JavaScript 文件里塞入 TS-only 语法。",
    "公开 API 必须带 JSDoc：组件 props / emits、导出函数、store action、公共 composable 返回值都要能从注释看出契约。",
    "复杂对象形状用 `@typedef` 明确声明；跨文件复用的类型通过 `import('./path').TypeName` 引用，不复制粘贴类型描述。",
    "`.mjs` 只在需要显式 ESM 边界时使用；普通浏览器端模块沿用项目既有 `.js` 约定，不为“看起来更现代”盲目改后缀。",
    "验证顺序固定为“先 JSDoc 完整，再跑测试”；测试失败时优先修逻辑或注释契约不一致，而不是弱化断言。",
  ],
  checklist: [
    "组件是否使用 `<script setup>`，并把 props / emits 的运行时校验与 JSDoc 契约同时写清楚。",
    "每个导出的 composable / store action 是否都带 `@param` / `@returns`，返回结构是否能被 `@typedef` 描述。",
    "共享对象形状是否已经抽出为 `@typedef`，而不是在多个文件重复手写字段说明。",
    "`.vue` / `.js` / `.mjs` 文件里是否仍残留 `lang=\"ts\"`、类型断言、接口、枚举等 TypeScript 语法。",
    "测试是否覆盖了组件事件、composable 返回值或 store action 的关键行为，而不是只验证实现细节。",
    "若引入外部参考技能，链接是否真实存在，且当前任务确实需要展开到更通用的 JavaScript 模式。",
  ],
  relatedSkills: [
    {
      get id() {
        return javascriptTypescriptJestSkill.id;
      },
      reason: "Vue JavaScript 组件、composable 或 Pinia store 需要 Vitest / Jest 测试边界时联动。",
    },
    {
      get id() {
        return modernJavascriptPatternsSkill.id;
      },
      reason: "Vue 代码涉及 ES 模块、异步流程、数据转换或现代 JavaScript 重构时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "JSDoc 与运行时脱节",
      pass: "JSDoc + 运行时同时声明",
    }),
    defineAntiPattern({
      fail: "composable 返回未约束的巨大对象",
      pass: "用稳定返回契约和 @typedef 收口",
    }),
    defineAntiPattern({
      fail: "简单对象过度抽类型文件",
      pass: "只抽跨文件复用的对象形状",
    }),
    defineAntiPattern({
      fail: "Vite 代码使用 require/CommonJS",
      pass: "保持 ESM 导入导出一致",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认项目保持 JavaScript，不引入 TS-only 语法，再识别组件、composable、store 或 Vite 配置边界。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "组件 props / emits 同时声明运行时约束和 JSDoc 契约；复杂对象用 `@typedef` 收口。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "公共 composable 和 store action 必须有 `@param` / `@returns`，跨文件共享类型用 `import('./path').TypeName`。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "组件、composable、跨文件 typedef 示例读取 `jsdoc-component-patterns`；深入主题读取 JSDoc / composable / state / testing references。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Vue 组件、props / emits、composable、Pinia store 和 JSDoc 契约设计。",
      "TS-only 语法清理、跨文件 typedef、ESM 后缀和 Vite 一致性建议。",
      "需要补的 Vitest 测试、运行时校验和文档契约风险。",
    ],
  }),
  references: [
    defineReference({
      id: "jsdoc-component-patterns",
      source: new URL("./references/jsdoc-component-patterns.md", import.meta.url),
      target: "references/jsdoc-component-patterns.md",
      title: "Vue JavaScript JSDoc 组件模式",
      summary: "Vue 3 props/emits、composable 返回契约和跨文件 typedef 示例。",
      loadWhen: "需要快速在 Vue JavaScript 代码中补 JSDoc 类型契约时读取。",
    }),
    defineReference({
      id: "component-architecture",
      source: new URL("./references/component-architecture.md", import.meta.url),
      target: "references/component-architecture.md",
      title: "component-architecture.md",
      summary: "Vue 3 组件架构模式，包括结构分层、props/emit 设计和文件组织规范。",
      loadWhen: "需要设计组件层次结构或审查组件间的通信方式时读取。",
    }),
    defineReference({
      id: "composables-patterns",
      source: new URL("./references/composables-patterns.md", import.meta.url),
      target: "references/composables-patterns.md",
      title: "composables-patterns.md",
      summary: "Vue 3 Composable 模式的最佳实践，包括状态封装、生命周期管理和跨组件复用。",
      loadWhen: "需要编写可复用的 composable 逻辑或重构组件内的自定义 Hook 时读取。",
    }),
    defineReference({
      id: "jsdoc-typing",
      source: new URL("./references/jsdoc-typing.md", import.meta.url),
      target: "references/jsdoc-typing.md",
      title: "jsdoc-typing.md",
      summary: "JSDoc 类型标注指南，包括 @typedef、@param、@returns 和跨文件类型引用。",
      loadWhen: "需要在纯 JavaScript 项目中通过 JSDoc 保持类型契约时读取。",
    }),
    defineReference({
      id: "state-management",
      source: new URL("./references/state-management.md", import.meta.url),
      target: "references/state-management.md",
      title: "state-management.md",
      summary: "Vue 3 状态管理方案对比与 Pinia 使用模式。",
      loadWhen: "需要设计全局或模块级状态管理方案时读取。",
    }),
    defineReference({
      id: "vue-testing-patterns",
      source: new URL("./references/testing-patterns.md", import.meta.url),
      target: "references/testing-patterns.md",
      title: "testing-patterns.md",
      summary: "Vue 3 JavaScript 项目的 Vitest 测试模式，包括组件、composable 和 store 的测试方法。",
      loadWhen: "需要为 Vue JavaScript 组件、composable 或 Pinia store 编写测试时读取。",
    }),
  ],
});
