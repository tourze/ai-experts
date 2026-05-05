import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const speckitDiffSkill = defineSkill({
  id: "speckit-diff",
  fullName: "Speckit Diff",
  description: "当用户要比较规格文档、计划文档或任务文档的版本差异、semantic diff、scope impact 或 test impact 时使用。",
  useCases: [
    "当用户要比较规格文档、计划文档或任务文档的版本差异、semantic diff、scope impact 或 test impact 时使用。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
