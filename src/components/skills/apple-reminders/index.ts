import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const appleRemindersSkill = defineSkill({
  id: "apple-reminders",
  description: "当用户要查看、创建、完成、删除或管理 Apple Reminders 提醒事项时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for apple-reminders.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
