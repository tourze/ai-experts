import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const speckitStatusSkill = defineSkill({
  id: "speckit-status",
  fullName: "Speckit Status",
  description: "当用户要查看 Spec Kit 特性进度、完成度、阻塞项、缺失文件或下一步优先级时使用。",
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
      summary: "Eval cases for speckit-status.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
