import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const systemDesignSkill = defineSkill({
  id: "system-design",
  description: "在需要设计系统、服务、存储、接口和边界时使用；强调需求澄清、高层方案、关键细节、可靠性和权衡。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "ddia-systems",
      source: new URL("./references/ddia-systems.md", import.meta.url),
      target: "references/ddia-systems.md",
      title: "ddia-systems.md",
      summary: "Reference material for system-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for system-design.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
