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
  constraints: [
    "不凭直觉重构：没有多视角交叉验证的问题不进拆步计划。",
    "不跳过测试基线：无测试的模块先补测试再重构。",
    "不做不可逆大改：每步必须可独立 revert。",
    "不改行为：重构不改变外部可观测行为；行为变更走 feature 分支。",
    "执行时遵循正文中的流程、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
