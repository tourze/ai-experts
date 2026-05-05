import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const taskDecomposerSkill = defineSkill({
  id: "task-decomposer",
  fullName: "task-decomposer",
  description: "当用户要把复杂需求拆成任务板、依赖关系、关键路径或并行工作项时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "decomposition-patterns",
      source: new URL("./references/decomposition-patterns.md", import.meta.url),
      target: "references/decomposition-patterns.md",
      title: "decomposition-patterns.md",
      summary: "Reference material for task-decomposer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "dependency-mapping",
      source: new URL("./references/dependency-mapping.md", import.meta.url),
      target: "references/dependency-mapping.md",
      title: "dependency-mapping.md",
      summary: "Reference material for task-decomposer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "edge-case-checklist",
      source: new URL("./references/edge-case-checklist.md", import.meta.url),
      target: "references/edge-case-checklist.md",
      title: "edge-case-checklist.md",
      summary: "Reference material for task-decomposer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "persistent-planning",
      source: new URL("./references/persistent-planning.md", import.meta.url),
      target: "references/persistent-planning.md",
      title: "persistent-planning.md",
      summary: "Reference material for task-decomposer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "sizing-guide",
      source: new URL("./references/sizing-guide.md", import.meta.url),
      target: "references/sizing-guide.md",
      title: "sizing-guide.md",
      summary: "Reference material for task-decomposer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for task-decomposer.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
