import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const chromeDevtoolsSkill = defineSkill({
  id: "chrome-devtools",
  fullName: "Chrome DevTools",
  description: "当用户要用 Chrome DevTools 做页面调试、网络排障、性能分析或 Lighthouse 审计时使用。",
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
      summary: "Eval cases for chrome-devtools.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
