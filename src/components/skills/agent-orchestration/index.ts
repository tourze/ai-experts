import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const agentOrchestrationSkill = defineSkill({
  id: "agent-orchestration",
  description: "当用户要设计多 Agent 编排、system prompt 架构、状态管理或 Agent 扩展点时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "agent-permission-safety",
      source: new URL("./references/agent-permission-safety.md", import.meta.url),
      target: "references/agent-permission-safety.md",
      title: "agent-permission-safety.md",
      summary: "Reference material for agent-orchestration.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "agent-tool-design",
      source: new URL("./references/agent-tool-design.md", import.meta.url),
      target: "references/agent-tool-design.md",
      title: "agent-tool-design.md",
      summary: "Reference material for agent-orchestration.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "multi-agent",
      source: new URL("./references/multi-agent.md", import.meta.url),
      target: "references/multi-agent.md",
      title: "multi-agent.md",
      summary: "Reference material for agent-orchestration.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "state-extensibility",
      source: new URL("./references/state-extensibility.md", import.meta.url),
      target: "references/state-extensibility.md",
      title: "state-extensibility.md",
      summary: "Reference material for agent-orchestration.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "system-prompt",
      source: new URL("./references/system-prompt.md", import.meta.url),
      target: "references/system-prompt.md",
      title: "system-prompt.md",
      summary: "Reference material for agent-orchestration.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for agent-orchestration.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
