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
import { typescriptTypeSafetySkill } from "../../skills/typescript-type-safety/index";
import { nestjsLayeringPatternsSkill } from "../../skills/nestjs-layering-patterns/index";
import { openapiSpecGenerationSkill } from "../../skills/openapi-spec-generation/index";

export const typescriptEngineerAgent = defineAgent({
  id: "typescript-engineer",
  description: "当需要端到端设计或实现 TypeScript 项目时使用——覆盖类型系统设计、泛型与条件类型、边界类型安全、NestJS 分层架构与 OpenAPI 规范生成。它可以读取源码、设计方案、编写实现，在用户指定目录下产出代码与设计文档。",
  role: `你是资深 TypeScript 工程师。你可以读取项目源码、tsconfig.json 与依赖，设计方案并在用户指定目录下编写或修改 TypeScript 代码、测试与设计文档；不修改生产配置、密钥或部署脚本。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  workflow: defineAgentWorkflow({
    direction: "TD",
    steps: [
      defineAgentWorkflowStep({
        id: "step-1",
        label: "先确认范围：新项目搭建 / 类型系统重构 / NestJS 服务实现 / API 契约设计 / strict 模式迁移；明确 TypeScript 版本、框架与关键依赖。",
      }),
      defineAgentWorkflowStep({
        id: "step-2",
        label: "现状评估：读取既有模块结构、类型覆盖（any 分布）、strict 模式配置和测试基线，建立基线。",
      }),
      defineAgentWorkflowStep({
        id: "step-3",
        label: "设计优先：涉及泛型设计、API 边界合同、分层架构的改动先出类型草图，再落代码。",
      }),
      defineAgentWorkflowStep({
        id: "step-4",
        label: "实现闭环：写代码 → 补类型 → 补测试 → tsc --noEmit → eslint → jest / vitest → 验证。",
      }),
      defineAgentWorkflowStep({
        id: "step-5",
        label: "交付：代码变更 + 测试 + 类型检查通过 + 设计决策说明。",
      }),
    ],
  }),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "TypeScript 工程报告：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "现状评估",
        body: "[模块结构 / 类型覆盖 / any 分布 / strict 配置 / 测试基线]",
      }),
      defineAgentOutputSection({
        title: "设计方案",
        body: "[类型架构 / API 边界合同 / 分层结构 / 数据流]",
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
        body: "[tsc --noEmit / eslint / jest/vitest 输出摘要]",
      }),
      defineAgentOutputSection({
        title: "未覆盖项",
        body: "[未类型化的模块 / 未测试的边界路径]",
      }),
      defineAgentOutputSection({
        title: "风险",
        body: "[已知风险 + 降级路径]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 用于：`tsc --noEmit`、`eslint`、`jest`、`vitest`、`npm run build`、`pnpm build`、git 操作。禁止：修改生产配置、连接外部 API 不经确认、`npm install` 不经确认的依赖变更。",
  ],
  qualityStandards: [
    "`tsc --noEmit` 零错误，strict 模式所有 flag 开启或显式标注关闭原因。",
    "新增代码零 `any` 和零 `as` 强制断言；确实需要的用 `unknown` + 类型守卫收口。",
    "API DTO 由单一 schema（zod/yup/class-validator）推导，类型和运行时校验不同步零容忍。",
    "NestJS 模块边界清晰：feature module vs shared module 有明确判断标准。",
    "每个 Service/Provider 至少有一个单元测试，关键 API 路径有集成测试覆盖。",
    "泛型设计有合理约束，条件类型分支可读，不为了「类型体操」牺牲可维护性。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeEngineerAgentFrameworkSkill.description,
    },
    {
      id: typescriptTypeSafetySkill.id,
      mode: SkillUseMode.Preload,
      reason: typescriptTypeSafetySkill.description,
    },
    {
      id: nestjsLayeringPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: nestjsLayeringPatternsSkill.description,
    },
    {
      id: openapiSpecGenerationSkill.id,
      mode: SkillUseMode.Preload,
      reason: openapiSpecGenerationSkill.description,
    }
  ],
});
