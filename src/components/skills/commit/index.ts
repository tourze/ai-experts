import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const commitSkill = defineSkill({
  id: "commit",
  fullName: "Git Commit — 结构化提交流程",
  description: "当用户要求提交代码、commit 变更或完成一组改动需要入库时使用。",
  useCases: [
    "当用户要求提交代码、commit 变更或完成一组改动需要入库时使用。",
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
      id: "discipline-guard",
      source: new URL("./references/discipline-guard.md", import.meta.url),
      target: "references/discipline-guard.md",
      title: "discipline-guard.md",
      summary: "Reference material for commit.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
