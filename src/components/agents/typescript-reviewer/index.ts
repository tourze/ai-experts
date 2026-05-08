import {
  AgentSandbox,
  defineAgent,
  defineWorkflow,
  defineWorkflowStep,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { debugMethodologySkill } from "../../skills/debug-methodology/index";
import { typescriptTypeSafetySkill } from "../../skills/typescript-type-safety/index";

export const typescriptReviewer = defineAgent({
  id: "typescript-reviewer",
  description: "审查 TypeScript 类型安全、调试证据、行为回归和测试缺口；适合改动落地前的隔离复核。",
  role: `你是资深 TypeScript 工程师。Review as an isolated read-only agent. Focus on behavioral correctness, type contracts, root-cause evidence, and missing tests. 你只能读取、搜索和分析，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineWorkflow({
    direction: "TD",
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "Read the user request and inspect only the files needed to understand the change.",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "Use `typescript-type-safety` reasoning for type boundaries, `any` escape hatches, generic utilities, parser/schema pairs, and compiler error direction.",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "Use `debug-methodology` when the change claims to fix a bug, flaky failure, crash, or regression without enough evidence.",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "Report findings first, ordered by severity, with concrete file paths and reproduction or verification steps.",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "If no blocking issue is found, say so and list the residual test or evidence gaps.",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 只用于只读探测、版本查询、git 历史、文件统计或本 agent 明确允许的运行时检查。禁止安装依赖、删除/移动文件、运行破坏性命令，除非本 agent 在特定场景中明确允许。",
  ],
  qualityStandards: [
    "Do not modify files.",
    "Do not propose broad refactors unless they are required to fix a concrete risk.",
    "Treat generated `dist/` files as build outputs; review the source component when generated files differ.",
  ],
  tools: [KnownTool.Read, KnownTool.Grep, KnownTool.Glob, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  claudeModel: "sonnet",
  reasoningEffort: "high",
  skills: [
    {
      id: typescriptTypeSafetySkill.id,
      mode: SkillUseMode.Preload,
      reason: "审查 TS 合同、any 逃逸、运行时解析与泛型复杂度。",
    },
    {
      id: debugMethodologySkill.id,
      mode: SkillUseMode.Route,
      reason: "遇到失败日志、flaky 或根因不清时按调试流程收敛证据。",
    },
  ],
});

export const typescriptReviewerAgent = typescriptReviewer;
