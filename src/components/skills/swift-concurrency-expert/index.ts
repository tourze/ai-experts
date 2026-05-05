import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const swiftConcurrencyExpertSkill = defineSkill({
  id: "swift-concurrency-expert",
  fullName: "Swift 并发",
  description: "当用户需要审查或修复 Swift 6.2+ concurrency、actor isolation、Sendable、Task、MainActor 或数据竞争迁移时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "approachable-concurrency",
      source: new URL("./references/approachable-concurrency.md", import.meta.url),
      target: "references/approachable-concurrency.md",
      title: "approachable-concurrency.md",
      summary: "Reference material for swift-concurrency-expert.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "swift-6-2-concurrency",
      source: new URL("./references/swift-6-2-concurrency.md", import.meta.url),
      target: "references/swift-6-2-concurrency.md",
      title: "swift-6-2-concurrency.md",
      summary: "Reference material for swift-concurrency-expert.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "swift-6-2-hang-elimination",
      source: new URL("./references/swift-6-2-hang-elimination.md", import.meta.url),
      target: "references/swift-6-2-hang-elimination.md",
      title: "swift-6-2-hang-elimination.md",
      summary: "Reference material for swift-concurrency-expert.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "swiftui-concurrency-tour-wwdc",
      source: new URL("./references/swiftui-concurrency-tour-wwdc.md", import.meta.url),
      target: "references/swiftui-concurrency-tour-wwdc.md",
      title: "swiftui-concurrency-tour-wwdc.md",
      summary: "Reference material for swift-concurrency-expert.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for swift-concurrency-expert.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
