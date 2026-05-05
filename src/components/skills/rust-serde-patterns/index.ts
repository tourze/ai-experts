import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const rustSerdePatternsSkill = defineSkill({
  id: "rust-serde-patterns",
  description: "当用户需要设计或调试 serde 序列化/反序列化逻辑时使用；涉及 serde derive 属性、enum 标签策略或自定义 Serializer 时触发。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "patterns",
      source: new URL("./references/patterns.md", import.meta.url),
      target: "references/patterns.md",
      title: "patterns.md",
      summary: "Reference material for rust-serde-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for rust-serde-patterns.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
