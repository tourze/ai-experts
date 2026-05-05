import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const complexityReducerSkill = defineSkill({
  id: "complexity-reducer",
  description: "当代码过于复杂、嵌套太深、函数太长、耦合严重，或用户要求简化代码、清理命名、降低复杂度时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scriptRoots: [
    defineSkillScriptRoot({
      source: new URL("./scripts/", import.meta.url),
      target: "scripts",
    }),
  ],
  scripts: [
    defineSkillScript({
      id: "complexity-report",
      entry: new URL("./scripts/complexity_report.mjs", import.meta.url),
      target: "scripts/complexity_report.mjs",
      runtime: "node",
      bundle: false,
      description: "Script complexity_report.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "go",
      source: new URL("./references/go.md", import.meta.url),
      target: "references/go.md",
      title: "go.md",
      summary: "Reference material for complexity-reducer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "patterns",
      source: new URL("./references/patterns.md", import.meta.url),
      target: "references/patterns.md",
      title: "patterns.md",
      summary: "Reference material for complexity-reducer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "python",
      source: new URL("./references/python.md", import.meta.url),
      target: "references/python.md",
      title: "python.md",
      summary: "Reference material for complexity-reducer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "rust",
      source: new URL("./references/rust.md", import.meta.url),
      target: "references/rust.md",
      title: "rust.md",
      summary: "Reference material for complexity-reducer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "task-closure",
      source: new URL("./references/task-closure.md", import.meta.url),
      target: "references/task-closure.md",
      title: "task-closure.md",
      summary: "Reference material for complexity-reducer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "typescript",
      source: new URL("./references/typescript.md", import.meta.url),
      target: "references/typescript.md",
      title: "typescript.md",
      summary: "Reference material for complexity-reducer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "verification-checklist",
      source: new URL("./references/verification-checklist.md", import.meta.url),
      target: "references/verification-checklist.md",
      title: "verification-checklist.md",
      summary: "Reference material for complexity-reducer.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for complexity-reducer.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
