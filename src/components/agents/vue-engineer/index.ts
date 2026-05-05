import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  defineAgentWorkflow,
  defineAgentWorkflowStep,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index";
import { vueExpertJsSkill } from "../../skills/vue-expert-js/index";
import { modernJavascriptPatternsSkill } from "../../skills/modern-javascript-patterns/index";
import { javascriptTypescriptJestSkill } from "../../skills/javascript-typescript-jest/index";
import { testingPatternsSkill } from "../../skills/testing-patterns/index";

export const vueEngineerAgent = defineAgent({
  id: "vue-engineer",
  description: "当需要端到端设计或实现 Vue 3 前端项目时使用——覆盖 Composition API、响应式系统、Pinia 状态管理、Vue Router、Vite 构建配置、composable 设计、JSDoc 类型标注与现代 JavaScript 模式。它可以读取源码、设计方案、编写实现，在用户指定目录下产出代码与设计文档。",
  role: `你是资深 Vue.js 工程师。你可以读取项目源码、package.json 与 Vite 配置，设计方案并在用户指定目录下编写或修改 Vue 3 组件、composable、Pinia store、路由配置、测试与设计文档；不修改生产密钥、API 端点或部署配置。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  workflow: defineAgentWorkflow({
    direction: "TD",
    steps: [
      defineAgentWorkflowStep({
        id: "step-1",
        label: "先确认范围：新项目搭建 / 组件实现 / 状态管理重构 / 路由设计 / 构建优化 / 测试建设；明确 Vue 版本、构建工具与关键依赖。",
      }),
      defineAgentWorkflowStep({
        id: "step-2",
        label: "现状评估：读取既有组件结构、路由树、store 设计、Vite 配置和测试基线，建立基线。",
      }),
      defineAgentWorkflowStep({
        id: "step-3",
        label: "设计优先：涉及组件拆分、composable 边界、store 结构、路由层级的改动先出设计，再落代码。",
      }),
      defineAgentWorkflowStep({
        id: "step-4",
        label: "实现闭环：写 Vue SFC / composable / store 代码 → 补测试 → lint → 类型检查 → Vite 构建验证 → 测试通过。",
      }),
      defineAgentWorkflowStep({
        id: "step-5",
        label: "交付：代码变更 + 测试 + 构建验证 + 设计决策说明。",
      }),
    ],
  }),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "Vue 3 工程报告：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "现状评估",
        body: "[组件结构 / 路由树 / store 设计 / Vite 配置 / 测试基线]",
      }),
      defineAgentOutputSection({
        title: "设计方案",
        body: "[组件拆分 / composable 边界 / store 结构 / 路由层级 / 数据流]",
      }),
      defineAgentOutputSection({
        title: "实现变更",
        body: "[文件 → 改动说明]",
      }),
      defineAgentOutputSection({
        title: "测试策略",
        body: "[层 / 测试点 / 工具]",
      }),
      defineAgentOutputSection({
        title: "验证结果",
        body: "[构建 / lint / 类型检查 / 测试输出摘要]",
      }),
      defineAgentOutputSection({
        title: "未覆盖项",
        body: "[未实现的组件状态 / 未测试的 composable 路径 / 未覆盖的路由]",
      }),
      defineAgentOutputSection({
        title: "风险",
        body: "[已知风险 + 降级路径]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 用于：`npm run dev`、`npm run build`、`npm test`、`pnpm build`、`npx vue-tsc --noEmit`、`npx eslint`、`npx prettier --check`、git 操作。禁止：修改生产配置、连接外部 API 不经确认、`npm install` 不经确认的依赖变更。",
  ],
  qualityStandards: [
    "`<script setup>` 中响应式 API 使用正确，无响应式丢失和意外响应式拷贝。",
    "每个 composable 有明确职责、返回契约和 cleanup 注册；调用方按需解构，无 `watchEffect` 泄漏。",
    "Pinia store 按领域拆分，action 中异步流有完整错误处理，getter 无冗余计算。",
    "路由层级扁平化且 lazy loading 覆盖所有 feature 模块，导航守卫链可维护。",
    "Vite 构建通过，分包策略合理，HMR 在开发中稳定。",
    "核心 composable 和 store action 有单元测试覆盖，组件测试覆盖关键交互路径。",
    "新增代码有完整 JSDoc 类型标注或 TypeScript 类型注解，`defineProps` 运行时和类型校验一致。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  claudeModel: "sonnet",
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "提供可写 engineer agent 的实现门禁、验证闭环与交付骨架。",
    },
    {
      id: vueExpertJsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "指导 Vue 3 Composition API、composable 与 Pinia 设计。",
    },
    {
      id: modernJavascriptPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保 ES6+ 惯用法与异步模式的一致性。",
    },
    {
      id: javascriptTypescriptJestSkill.id,
      mode: SkillUseMode.Preload,
      reason: "指导 Vue 组件与 composable 的 Jest/Vitest 测试编写。",
    },
    {
      id: testingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "提供测试策略、mock 边界与 AAA/FIRST 原则。",
    }
  ],
});
