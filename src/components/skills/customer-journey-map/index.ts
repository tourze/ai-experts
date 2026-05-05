import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const customerJourneyMapSkill = defineSkill({
  id: "customer-journey-map",
  description: "当用户需要绘制用户旅程地图、触点链路、情绪曲线，做 Mom Test 客户访谈验证需求，或设计 NPS/PMF 调研问卷时使用（旅程可视化层）。客户研究与 persona 构建用 `customer-research`；UX 设计输入用 `ux-researcher-designer`。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "designing-surveys",
      source: new URL("./references/designing-surveys.md", import.meta.url),
      target: "references/designing-surveys.md",
      title: "designing-surveys.md",
      summary: "Reference material for customer-journey-map.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "mom-test",
      source: new URL("./references/mom-test.md", import.meta.url),
      target: "references/mom-test.md",
      title: "mom-test.md",
      summary: "Reference material for customer-journey-map.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for customer-journey-map.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
