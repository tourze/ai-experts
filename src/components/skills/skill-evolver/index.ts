import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const skillEvolverSkill = defineSkill({
  id: "skill-evolver",
  description: "当需要把一个 skill 的优势迁移到另一个 skill、对比两个 skill 的真实任务表现、提炼可移植模式或做 skill A/B 进化时使用；如果只是创建新 skill，改用 `skill-creator`。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "migration-protocol",
      source: new URL("./references/migration-protocol.md", import.meta.url),
      target: "references/migration-protocol.md",
      title: "migration-protocol.md",
      summary: "Reference material for skill-evolver.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for skill-evolver.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
