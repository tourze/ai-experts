import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const startupIcpDefinerSkill = defineSkill({
  id: "startup-icp-definer",
  fullName: "理想客户画像",
  description: "当用户要定义理想客户画像、购买中心、目标行业或关键 persona 时使用；帮助把“谁最值得卖”说清楚。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "full-guide",
      source: new URL("./references/full-guide.md", import.meta.url),
      target: "references/full-guide.md",
      title: "full-guide.md",
      summary: "Reference material for startup-icp-definer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for startup-icp-definer.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
