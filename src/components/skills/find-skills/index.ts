import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const findSkillsSkill = defineSkill({
  id: "find-skills",
  fullName: "Find Skills",
  description: "当用户要查找适合任务的 skill、询问如何做某类工作或是否存在相关 skill 时使用。已知 skill 名称直接调用时不需要。",
  useCases: [
    "当用户要查找适合任务的 skill、询问如何做某类工作或是否存在相关 skill 时使用。已知 skill 名称直接调用时不需要。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "search-guide",
      source: new URL("./references/search-guide.md", import.meta.url),
      target: "references/search-guide.md",
      title: "search-guide.md",
      summary: "Reference material for find-skills.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
