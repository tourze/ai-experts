import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const userGuideWritingSkill = defineSkill({
  id: "user-guide-writing",
  fullName: "用户指南写作",
  description: "当用户要编写面向最终用户的使用指南、教程、上手手册、FAQ 或帮助中心内容时使用。该技能强调任务导向、截图规划和低门槛表达。",
  useCases: [
    "文档读者是终端用户、业务用户、客户支持对象，而不是研发同事。",
    "需要写 onboarding、操作手册、教程、常见问题、故障排查或培训资料。",
    "用户希望内容“能照着做”，而不是高层概述。",
    "如果当前还在收集素材和结构，可先用 [doc-coauthoring](../doc-coauthoring/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
