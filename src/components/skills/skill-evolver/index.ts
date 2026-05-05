import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const skillEvolverSkill = defineSkill({
  id: "skill-evolver",
  fullName: "Skill Evolver",
  description: "当需要把一个 skill 的优势迁移到另一个 skill、对比两个 skill 的真实任务表现、提炼可移植模式或做 skill A/B 进化时使用；如果只是创建新 skill，改用 `skill-creator`。",
  useCases: [
    "当需要把一个 skill 的优势迁移到另一个 skill、对比两个 skill 的真实任务表现、提炼可移植模式或做 skill A/B 进化时使用；如果只是创建新 skill，改用 `skill-creator`。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
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
  ],
});
