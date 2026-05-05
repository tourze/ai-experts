import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const deepCodeReadSkill = defineSkill({
  id: "deep-code-read",
  description: "当用户要深度理解不熟悉代码库，并生成可复用的认知型 skill 文件时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "agent-a-prompt",
      source: new URL("./references/agent-a-prompt.md", import.meta.url),
      target: "references/agent-a-prompt.md",
      title: "agent-a-prompt.md",
      summary: "Reference material for deep-code-read.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "agent-b-prompt",
      source: new URL("./references/agent-b-prompt.md", import.meta.url),
      target: "references/agent-b-prompt.md",
      title: "agent-b-prompt.md",
      summary: "Reference material for deep-code-read.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "agent-c-prompt",
      source: new URL("./references/agent-c-prompt.md", import.meta.url),
      target: "references/agent-c-prompt.md",
      title: "agent-c-prompt.md",
      summary: "Reference material for deep-code-read.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "repo-analyzer",
      source: new URL("./references/repo-analyzer.md", import.meta.url),
      target: "references/repo-analyzer.md",
      title: "repo-analyzer.md",
      summary: "Reference material for deep-code-read.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "wiki-researcher",
      source: new URL("./references/wiki-researcher.md", import.meta.url),
      target: "references/wiki-researcher.md",
      title: "wiki-researcher.md",
      summary: "Reference material for deep-code-read.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "workflow",
      source: new URL("./references/workflow.md", import.meta.url),
      target: "references/workflow.md",
      title: "workflow.md",
      summary: "Reference material for deep-code-read.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for deep-code-read.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
