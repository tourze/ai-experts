import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const pdcaCycleSkill = defineSkill({
  id: "pdca-cycle",
  fullName: "PDCA 循环",
  description: "当用户要用 PDCA 做持续改进、质量管理、运营优化或闭环问题解决时使用。",
  useCases: [
    "运营流程的持续改进（每轮解决一个问题，螺旋上升）。",
    "质量管理和 SLA 达标。",
    "与 [fishbone-diagram](../fishbone-diagram/SKILL.md) 配合：Plan 阶段用鱼骨图找原因。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
