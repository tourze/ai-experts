import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const speckitCheckerSkill = defineSkill({
  id: "speckit-checker",
  description: "当用户要检测项目技术栈并运行可用静态检查、lint、typecheck 或测试前质量门禁时使用。",
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
      summary: "Eval cases for speckit-checker.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
