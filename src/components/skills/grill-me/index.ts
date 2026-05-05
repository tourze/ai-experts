import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const grillMeSkill = defineSkill({
  id: "grill-me",
  description: "当需要对方案、设计或决策做高压质询来压实假设时使用。用户提到\"grill me\"\"狠狠质问我\"\"压力测试这个方案\"时触发。",
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
      summary: "Eval cases for grill-me.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
