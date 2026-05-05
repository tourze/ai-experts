import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const appleNotesSkill = defineSkill({
  id: "apple-notes",
  description: "当用户需要查看、搜索、编辑或导出 Apple Notes 备忘录时使用。",
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
      summary: "Eval cases for apple-notes.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
