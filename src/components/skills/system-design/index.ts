import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { taskDecomposerSkill } from "../task-decomposer/index";

export const systemDesignSkill = defineSkill({
  id: "system-design",
  fullName: "系统设计",
  description: "在需要设计系统、服务、存储、接口和边界时使用；强调需求澄清、高层方案、关键细节、可靠性和权衡。",
  useCases: [
    "适合系统设计题、平台方案、服务拆分、API 设计、数据模型和可靠性策略。",
    "适合把业务目标转成组件、数据流、协议、状态和扩展路线。",
    "适合需要按 Reference Map 深挖数据系统细节和扩展权衡的方案。",
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
  sourceDir: new URL("./", import.meta.url),
  relatedSkills: [
    {
      get skill() {
        return taskDecomposerSkill;
      },
      reason: "系统方案需要转成可执行任务、依赖关系或 Execution Contract 时联动。",
    },
  ],
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先澄清功能需求、非功能需求、规模、团队约束、成本边界和不可接受的失败模式。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "给出高层组件和责任边界，再画清请求路径、异步路径、数据流和外部依赖。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "深入关键细节：数据模型、API/协议、存储、缓存、队列、索引、一致性和幂等策略。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "需要深入数据系统细节时读取 `ddia-systems` reference，并标注哪些结论来自当前规模假设。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "逐项说明可靠性、扩展性、监控、容灾、迁移和安全边界。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "为每个关键决策写 trade-off，并列出未来规模变化后必须复审的假设。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "需求和约束清单。",
      "高层组件图、数据流和责任边界。",
      "数据模型/API/存储/可靠性设计要点。",
      "关键 trade-off、扩展路线和待复审假设。",
    ],
  }),
  references: [
    defineReference({
      id: "ddia-systems",
      source: new URL("./references/ddia-systems.md", import.meta.url),
      target: "references/ddia-systems.md",
      title: "ddia-systems.md",
      summary: "《Designing Data-Intensive Applications》核心系统设计概念摘要，包含数据系统、存储引擎和分布式策略。",
      loadWhen: "需要深入理解数据系统细节或参考 DDIA 中的设计模式时读取。",
    }),
    defineReference({
      id: "storage-engines",
      source: new URL("./references/storage-engines.md", import.meta.url),
      target: "references/storage-engines.md",
      title: "storage-engines.md",
      summary: "存储引擎选型、索引模型、写放大和访问模式权衡。",
      loadWhen: "需要比较 LSM、B-tree、缓存、索引和读写路径时读取。",
    }),
    defineReference({
      id: "replication",
      source: new URL("./references/replication.md", import.meta.url),
      target: "references/replication.md",
      title: "replication.md",
      summary: "主从、多主、leaderless 复制和复制延迟下的一致性策略。",
      loadWhen: "需要设计读写副本、故障切换或 read-after-write 保证时读取。",
    }),
    defineReference({
      id: "partitioning",
      source: new URL("./references/partitioning.md", import.meta.url),
      target: "references/partitioning.md",
      title: "partitioning.md",
      summary: "分区键、热点、再均衡和跨分区查询的系统设计权衡。",
      loadWhen: "数据规模需要水平扩展或出现热点分布风险时读取。",
    }),
    defineReference({
      id: "transactions",
      source: new URL("./references/transactions.md", import.meta.url),
      target: "references/transactions.md",
      title: "transactions.md",
      summary: "事务隔离、并发异常、幂等和分布式事务边界。",
      loadWhen: "需要定义一致性、隔离级别、双写和恢复语义时读取。",
    }),
    defineReference({
      id: "fault-tolerance",
      source: new URL("./references/fault-tolerance.md", import.meta.url),
      target: "references/fault-tolerance.md",
      title: "fault-tolerance.md",
      summary: "故障模型、超时、重试、熔断、恢复和灾备策略。",
      loadWhen: "需要说明系统在网络、节点、依赖或数据故障下如何退化和恢复时读取。",
    }),
    defineReference({
      id: "batch-stream",
      source: new URL("./references/batch-stream.md", import.meta.url),
      target: "references/batch-stream.md",
      title: "batch-stream.md",
      summary: "批处理、流处理、事件日志、重放和 exactly-once 语义边界。",
      loadWhen: "需要设计数据管道、事件驱动架构或批流一体方案时读取。",
    }),
  ],
});
