import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const leadResearchAssistantSkill = defineSkill({
  id: "lead-research-assistant",
  description: "在需要定义 ICP、寻找高质量目标客户、筛选公司名单，或深挖已有账号的联系人与买家信号时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "account-research-guide",
      source: new URL("./references/account-research-guide.md", import.meta.url),
      target: "references/account-research-guide.md",
      title: "account-research-guide.md",
      summary: "Reference material for lead-research-assistant.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for lead-research-assistant.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
