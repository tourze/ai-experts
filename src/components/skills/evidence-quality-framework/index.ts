import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const evidenceQualityFrameworkSkill = defineSkill({
  id: "evidence-quality-framework",
  description: "当代码审查、安全审计、事故复盘、研究分析或战略分析需要把每条结论显式标注为事实/推断/假设，并将发现绑定到可核验定位（文件:行 / log / commit / metric）时使用。消除\"印象式\"断言与无锚结论。",
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
      summary: "Reference material for evidence-quality-framework.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "binding-examples",
      source: new URL("./references/binding-examples.md", import.meta.url),
      target: "references/binding-examples.md",
      title: "binding-examples.md",
      summary: "Reference material for evidence-quality-framework.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "tri-state-examples",
      source: new URL("./references/tri-state-examples.md", import.meta.url),
      target: "references/tri-state-examples.md",
      title: "tri-state-examples.md",
      summary: "Reference material for evidence-quality-framework.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for evidence-quality-framework.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
