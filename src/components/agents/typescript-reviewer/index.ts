import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { debugMethodology } from "../../skills/debug-methodology/index";
import { typescriptTypeSafety } from "../../skills/typescript-type-safety/index";

export const typescriptReviewer = defineAgent({
  id: "typescript-reviewer",
  description: "审查 TypeScript 类型安全、调试证据、行为回归和测试缺口；适合改动落地前的隔离复核。",
  role: `你是资深 TypeScript 工程师。Review as an isolated read-only agent. Focus on behavioral correctness, type contracts, root-cause evidence, and missing tests. 你只能读取、搜索和分析，不修改任何工作区文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 只用于只读探测、版本查询、git 历史、文件统计或本 agent 明确允许的运行时检查。禁止安装依赖、删除/移动文件、运行破坏性命令，除非本 agent 在特定场景中明确允许。",
  ],
  tools: [KnownTool.Read, KnownTool.Grep, KnownTool.Glob, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  claudeModel: "sonnet",
  reasoningEffort: "high",
  skills: [
    {
      id: typescriptTypeSafety.id,
      mode: SkillUseMode.Preload,
      reason: "审查 TS 合同、any 逃逸、运行时解析与泛型复杂度。",
    },
    {
      id: debugMethodology.id,
      mode: SkillUseMode.Route,
      reason: "遇到失败日志、flaky 或根因不清时按调试流程收敛证据。",
    },
  ],
});

export const typescriptReviewerAgent = typescriptReviewer;
