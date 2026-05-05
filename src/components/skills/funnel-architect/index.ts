import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const funnelArchitectSkill = defineSkill({
  id: "funnel-architect",
  description: "当用户要设计销售漏斗、价值阶梯、落地页序列或线索转化路径时使用；帮助梳理入口、承接、报价与升级路径。",
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
      summary: "Eval cases for funnel-architect.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
