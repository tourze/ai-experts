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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
