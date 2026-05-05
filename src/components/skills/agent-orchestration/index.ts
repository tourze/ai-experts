import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";

export const agentOrchestrationSkill = defineSkill({
  id: "agent-orchestration",
  fullName: "Agent Orchestration",
  description: "当用户要设计多 Agent 编排、system prompt 架构、状态管理或 Agent 扩展点时使用。",
  useCases: [
    "设计多 Agent 系统：子 Agent 职责划分、fork vs fresh 决策、隔离策略。",
    "构建 system prompt 架构：静态/动态分离、缓存边界、模块化段函数。",
    "设计 Agent 状态管理：四种状态生命周期、层级配置、记忆提取。",
    "规划 Agent 扩展点：协议（MCP）、事件（Hooks）、声明式（Skills）。",
    "需要与 [agent-tool-design](references/agent-tool-design.md) 联动做工具加载策略。",
  ],
  constraints: [
    "**铁律：Fork vs Fresh 必须显式决策**——子 Agent 继承父上下文（fork）还是独立启动（fresh）不能隐含，必须按风险和隔离需求明确选择。",
    "System prompt 必须有缓存边界：静态段在前（可缓存），动态段在后，两者不能混排。",
    "每个 Agent 必须有 `max_turns` 限制，防止无限循环。",
    "状态按生命周期分四层（turn/session/persistent/project），禁止混用。",
    "扩展通过协议和事件，不通过继承或核心代码修改。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "**隐式 fork**：子 Agent 默认继承父上下文 → 风险操作污染父状态，无法回滚。",
      pass: "显式选择 fork/fresh/worktree，并记录隔离理由。",
    }),
    defineAntiPattern({
      fail: "**无 max_turns**：Agent 陷入循环时无熔断 → 无限消耗 token 和时间。",
      pass: "为每个 Agent 设置 max_turns、超时和取消路径。",
    }),
    defineAntiPattern({
      fail: "**阻塞等待子 Agent**：长任务阻塞主循环 → 用户体验差。应用后台执行 + 任务跟踪。",
      pass: "后台执行长任务，提供任务状态、取消和结果持久化。",
    }),
    defineAntiPattern({
      fail: "**单体 prompt 字符串**：不可缓存、不可测试、不可替换，每次改动都是手术。",
      pass: "拆成静态/动态段并设置缓存边界，每段可独立测试。",
    }),
  ],
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
  ],
});
