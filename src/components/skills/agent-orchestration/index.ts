import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
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
    "需要设计工具注册、加载、执行和权限边界策略。",
  ],
  constraints: [
    "**铁律：Fork vs Fresh 必须显式决策**——子 Agent 继承父上下文（fork）还是独立启动（fresh）不能隐含，必须按风险和隔离需求明确选择。",
    "System prompt 必须有缓存边界：静态段在前（可缓存），动态段在后，两者不能混排。",
    "每个 Agent 必须有 `max_turns` 限制，防止无限循环。",
    "状态按生命周期分四层（turn/session/persistent/project），禁止混用。",
    "扩展通过协议和事件，不通过继承或核心代码修改。",
  ],
  checklist: [
    "System prompt 是否有明确的缓存边界？静态段是否真正不变？",
    "每个子 Agent 是否有 max_turns 限制？",
    "fork/fresh 决策是否有明确理由（而非默认值）？",
    "四种状态（turn/session/persistent/project）是否分别用了合适的存储？",
    "后台 Agent 是否有任务跟踪机制（状态查询、取消、输出持久化）？",
    "扩展点是否通过协议/事件暴露，而非要求改核心代码？",
    "每个 prompt 段是否可独立测试？",
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先拆 system prompt：静态角色/规则/工具说明放缓存边界前，动态环境/记忆/任务上下文放边界后。",
      "定义每类子 Agent 的职责、输入、输出、`max_turns`、权限和失败退出条件。",
      "逐个子 Agent 做 fork/fresh/worktree 决策；高风险写入、长任务或需要文件隔离时优先 worktree 或 fresh。",
      "状态按 turn/session/persistent/project 四层落位，跨 Agent 只传消息和结果，不共享可变状态对象。",
      "后台任务必须有任务 ID、状态查询、取消路径、结果持久化和审计记录。",
      "扩展点用 MCP、Hooks、Skills 或声明式配置暴露；需要工具加载细节时读取 agent-tool-design。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Agent 拓扑：角色、职责、输入输出、`max_turns`、权限和隔离模式。",
      "Prompt 架构：静态段、缓存边界、动态段和每段测试方式。",
      "状态与扩展设计：四层状态归属、后台任务跟踪、工具/协议/事件接口和风险控制。",
    ],
  }),
  references: [
    defineReference({
      id: "agent-permission-safety",
      source: new URL("./references/agent-permission-safety.md", import.meta.url),
      target: "references/agent-permission-safety.md",
      title: "agent-permission-safety.md",
      summary: "Agent 权限模型、安全隔离策略与风险操作治理。",
      loadWhen: "需要设计 Agent 权限体系或评估子 Agent 安全隔离策略时读取。",
    }),
    defineReference({
      id: "agent-tool-design",
      source: new URL("./references/agent-tool-design.md", import.meta.url),
      target: "references/agent-tool-design.md",
      title: "agent-tool-design.md",
      summary: "Agent 工具注册、加载执行策略与工具接口设计模式。",
      loadWhen: "需要设计 Agent 工具接口或决定工具加载策略时读取。",
    }),
    defineReference({
      id: "multi-agent",
      source: new URL("./references/multi-agent.md", import.meta.url),
      target: "references/multi-agent.md",
      title: "multi-agent.md",
      summary: "多 Agent 系统架构设计：职责划分、fork/fresh 决策与通信模式。",
      loadWhen: "需要设计多 Agent 协作架构或决定子 Agent 启动策略时读取。",
    }),
    defineReference({
      id: "state-extensibility",
      source: new URL("./references/state-extensibility.md", import.meta.url),
      target: "references/state-extensibility.md",
      title: "state-extensibility.md",
      summary: "Agent 状态生命周期管理、层级配置与记忆提取模式。",
      loadWhen: "需要设计 Agent 状态存储或跨会话记忆方案时读取。",
    }),
    defineReference({
      id: "system-prompt",
      source: new URL("./references/system-prompt.md", import.meta.url),
      target: "references/system-prompt.md",
      title: "system-prompt.md",
      summary: "System prompt 架构设计：静态/动态段分离与缓存边界策略。",
      loadWhen: "需要设计或优化 system prompt 结构以提升缓存命中率时读取。",
    }),
  ],
});
