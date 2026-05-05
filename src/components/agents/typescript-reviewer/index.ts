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
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Grep, KnownTool.Glob, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
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
