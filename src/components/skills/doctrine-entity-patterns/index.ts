import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const doctrineEntityPatternsSkill = defineSkill({
  id: "doctrine-entity-patterns",
  fullName: "Doctrine Entity Patterns",
  description: "当用户要设计或审查 Doctrine ORM Entity、关联关系、Repository 或 Migration 时使用。",
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
      summary: "Eval cases for doctrine-entity-patterns.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
