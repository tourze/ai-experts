import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const docCoauthoringSkill = defineSkill({
  id: "doc-coauthoring",
  description: "当用户要协作撰写文档、方案、技术设计、决策记录或其他结构化材料时使用。",
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
      summary: "Eval cases for doc-coauthoring.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
