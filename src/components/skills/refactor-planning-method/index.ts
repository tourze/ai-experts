import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const refactorPlanningMethodSkill = defineSkill({
  id: "refactor-planning-method",
  fullName: "重构计划方法论",
  description: "当需要为既有代码制定系统化重构计划时使用；提供基线建立、多视角问题验证、接缝识别和增量拆步的完整方法论。",
  useCases: [
    "当需要为既有代码制定系统化重构计划时使用；提供基线建立、多视角问题验证、接缝识别和增量拆步的完整方法论。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
