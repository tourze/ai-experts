import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";

export const systemDesignSkill = defineSkill({
  id: "system-design",
  fullName: "system-design",
  description: "在需要设计系统、服务、存储、接口和边界时使用；强调需求澄清、高层方案、关键细节、可靠性和权衡。",
  useCases: [
    "适合系统设计题、平台方案、服务拆分、API 设计、数据模型和可靠性策略。",
    "适合把业务目标转成组件、数据流、协议、状态和扩展路线。",
    "交叉引用：数据系统细节配合 [references/ddia-systems.md](references/ddia-systems.md)；计划化落地配合 `task-decomposer`。",
  ],
  constraints: [
    "必须先问清功能需求、非功能需求和约束，再谈架构。",
    "每个关键决策都要配 trade-off，不能只报方案名。",
    "高层设计和深挖细节要分层表达，避免一开始就陷入实现。",
    "明确指出哪些结论依赖当前规模，未来增长后需复审。",
  ],
  checklist: [
    "是否明确了功能、延迟、吞吐、可用性、成本等约束。",
    "是否画清组件边界、数据流和责任归属。",
    "是否说明缓存、队列、索引、容灾和监控策略。",
    "是否标记未来扩展点和需要重审的假设。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "不问需求直接微服务：没问 QPS、团队规模、一致性。10 人 100 QPS 不需要这套。",
      pass: "先量化再给方案",
    }),
    defineAntiPattern({
      fail: "只给图不说代价",
      pass: "每个决策配代价",
    }),
  ],
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
      summary: "《Designing Data-Intensive Applications》核心系统设计概念摘要，包含数据系统、存储引擎和分布式策略。",
      loadWhen: "需要深入理解数据系统细节或参考 DDIA 中的设计模式时读取。",
    }),
  ],
});
