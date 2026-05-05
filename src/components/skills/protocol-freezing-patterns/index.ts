import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const protocolFreezingPatternsSkill = defineSkill({
  id: "protocol-freezing-patterns",
  description: "在需要管理协议版本冻结、线格式演进、向后兼容、版本协商和 breaking change 流程时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "field-evolution",
      source: new URL("./references/field-evolution.md", import.meta.url),
      target: "references/field-evolution.md",
      title: "field-evolution.md",
      summary: "Reference material for protocol-freezing-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "golden-file-testing",
      source: new URL("./references/golden-file-testing.md", import.meta.url),
      target: "references/golden-file-testing.md",
      title: "golden-file-testing.md",
      summary: "Reference material for protocol-freezing-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "version-negotiation",
      source: new URL("./references/version-negotiation.md", import.meta.url),
      target: "references/version-negotiation.md",
      title: "version-negotiation.md",
      summary: "Reference material for protocol-freezing-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "versioned-envelope",
      source: new URL("./references/versioned-envelope.md", import.meta.url),
      target: "references/versioned-envelope.md",
      title: "versioned-envelope.md",
      summary: "Reference material for protocol-freezing-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for protocol-freezing-patterns.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
