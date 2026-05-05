import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const engineeringRetroSkill = defineSkill({
  id: "engineering-retro",
  description: "当用户需要基于 git log 回顾近期开发进度、提交节奏、热点文件、协作模式或工程复盘指标时使用。也用于从代码变更提炼工程经验。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "anti-patterns",
      source: new URL("./references/anti-patterns.md", import.meta.url),
      target: "references/anti-patterns.md",
      title: "anti-patterns.md",
      summary: "Reference material for engineering-retro.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "lesson-learned",
      source: new URL("./references/lesson-learned.md", import.meta.url),
      target: "references/lesson-learned.md",
      title: "lesson-learned.md",
      summary: "Reference material for engineering-retro.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "se-principles",
      source: new URL("./references/se-principles.md", import.meta.url),
      target: "references/se-principles.md",
      title: "se-principles.md",
      summary: "Reference material for engineering-retro.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for engineering-retro.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
