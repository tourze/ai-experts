import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const pragmaticProgrammerSkill = defineSkill({
  id: "pragmatic-programmer",
  description: "当用户要用务实工程原则判断抽象是否过度、DRY/YAGNI 取舍、tracer bullet 路径或协作方式时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "broken-windows",
      source: new URL("./references/broken-windows.md", import.meta.url),
      target: "references/broken-windows.md",
      title: "broken-windows.md",
      summary: "Reference material for pragmatic-programmer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "contracts-assertions",
      source: new URL("./references/contracts-assertions.md", import.meta.url),
      target: "references/contracts-assertions.md",
      title: "contracts-assertions.md",
      summary: "Reference material for pragmatic-programmer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "dry-orthogonality",
      source: new URL("./references/dry-orthogonality.md", import.meta.url),
      target: "references/dry-orthogonality.md",
      title: "dry-orthogonality.md",
      summary: "Reference material for pragmatic-programmer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "estimation-portfolio",
      source: new URL("./references/estimation-portfolio.md", import.meta.url),
      target: "references/estimation-portfolio.md",
      title: "estimation-portfolio.md",
      summary: "Reference material for pragmatic-programmer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "reversibility",
      source: new URL("./references/reversibility.md", import.meta.url),
      target: "references/reversibility.md",
      title: "reversibility.md",
      summary: "Reference material for pragmatic-programmer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "tracer-bullets",
      source: new URL("./references/tracer-bullets.md", import.meta.url),
      target: "references/tracer-bullets.md",
      title: "tracer-bullets.md",
      summary: "Reference material for pragmatic-programmer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for pragmatic-programmer.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
