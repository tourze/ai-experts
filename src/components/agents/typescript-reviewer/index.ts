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
  role: `你是资深 TypeScript 工程师。作为只读审查 agent，聚焦行为正确性、类型合同、根因证据和测试缺口。你只能读取、搜索和分析，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineWorkflow({
    direction: "TD",
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "阅读用户请求，仅检查理解改动所需的文件。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "使用 `typescript-type-safety` 推理类型边界、`any` 逃生口、泛型工具、解析器/模式对以及编译错误方向。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "当改动声称修复 bug、不稳定失败、崩溃或回归但缺乏足够证据时，使用 `debug-methodology`。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "首先按严重度报告发现，包含具体文件路径和复现或验证步骤。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "如未发现阻塞性问题，说明并列出剩余的测试或证据缺口。",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 仅用于只读探测、版本查询、git 历史、文件统计或本 agent 明确允许的运行时检查。禁止安装依赖、删除/移动文件、运行破坏性命令，除非本 agent 在特定场景中明确允许。",
  ],
  qualityStandards: [
    "不修改文件。",
    "不提议广泛重构，除非修复具体风险所必需。",
    "将生成的 `dist/` 文件视为构建输出；当生成文件有差异时审查源组件。",
    "每个发现必须包含文件路径、行号或符号、触发条件、影响以及验证或未验证项。",
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
      reason: "遇到失败日志、不稳定测试或根因不清时按调试流程收敛证据。",
    },
  ],
});

export const typescriptReviewerAgent = typescriptReviewer;
