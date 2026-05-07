import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { errorHandlingPatternsSkill } from "../error-handling-patterns/index";
import { protocolFreezingPatternsSkill } from "../protocol-freezing-patterns/index";
import { softwareDesignSkill } from "../software-design/index";
import { systemDesignSkill } from "../system-design/index";

export const architectureDecisionRecordsSkill = defineSkill({
  id: "architecture-decision-records",
  fullName: "架构决策记录与系统边界分析",
  description:
    "当用户需要为架构决策写 ADR、做系统边界分析（服务划分/数据所有权/一致性边界）、设计接口契约（版本策略/向后兼容/breaking change 流程）、管理复杂度（深模块/信息隐藏）或制定弹性策略（超时/重试/熔断/降级）时使用。与 system-design 互补：后者给架构全貌，本 skill 给决策方法与契约模板。",
  useCases: [
    "需要把架构决策写成 ADR（Architecture Decision Record）格式",
    "系统边界模糊：服务该拆还是该合、数据归谁、一致性怎么保证",
    "接口需要版本策略和 breaking change 治理流程",
    '方案评审时需要显式写 trade-off，不用"最佳实践"搪塞',
    "弹性策略设计：超时、重试、熔断、降级的边界和组合",
  ],
  constraints: [
    "每个 ADR 必须包含 Context、Decision、Consequences 和被放弃选项；不能写成单方案公告。",
    "服务边界必须同时看数据所有权、变更节奏、弹性需求和一致性成本。",
    "对外 API、移动端 API 或跨团队契约必须写清版本策略、兼容期和 breaking change 流程。",
    "弹性策略必须有具体超时、重试、熔断、降级配置和幂等前提。",
    "复杂度管理优先深模块和信息隐藏，不把薄转发包装成架构抽象。",
  ],
  checklist: [
    "每个决策有显式的 Context → Decision → Consequences。",
    '抛弃的选项和理由已记录，不在 ADR 中留"唯一方案"。',
    "服务边界分析覆盖了数据所有权、变更节奏和弹性需求三个维度。",
    "对外 API 有明确的版本策略和 breaking change 流程。",
    '超时/重试/熔断/降级有具体数值，不是"设一个合理的值"。',
    "关键假设标注了不成立时的降级路径。",
  ],
  relatedSkills: [
    {
      get id() {
        return softwareDesignSkill.id;
      },
      reason: "需要拆模块职责、信息隐藏、深模块或局部设计原则时联动。",
    },
    {
      get id() {
        return protocolFreezingPatternsSkill.id;
      },
      reason: "接口线格式、版本冻结、向后兼容或 breaking change 治理时联动。",
    },
    {
      get id() {
        return errorHandlingPatternsSkill.id;
      },
      reason: "决策涉及错误分层、传播、重试条件或错误码兼容时联动。",
    },
    {
      get id() {
        return systemDesignSkill.id;
      },
      reason: "需要先做系统架构全貌、容量、数据流或组件关系设计时联动。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "把架构选择、系统边界、接口契约和弹性策略写成可审查、可追溯、可回滚的决策记录。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先写 ADR 三段：Context、Decision、Consequences，并列出未选方案和放弃理由。",
      "服务边界按数据 owner、变更节奏、SLA/扩容、跨服务事务和查询代价判断拆合。",
      "数据所有权坚持单写 owner；跨服务读用 API、事件、read model 或 materialized view，不用缓存偷换 owner。",
      "接口契约按调用方可控性选择不版本化、URL/header 版本化或兼容过渡期。",
      "Breaking change 先发布新接口或字段，监控旧调用量，通知迁移，降至阈值后 deprecated，再移除。",
      "弹性四件套分别定超时、重试、熔断和降级；写清幂等前提、数值、作用域和失败时行为。",
      "需要模板或反模式时读取 contract-templates。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "ADR：Context、Decision、Consequences、备选方案、取舍和假设失效时降级路径。",
      "边界分析：服务拆合判断、数据 owner、跨服务读写、一致性和查询代价。",
      "契约与弹性方案：版本策略、breaking change 流程、超时/重试/熔断/降级参数和复杂度取舍。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "contract-templates",
      source: new URL("./references/contract-templates.md", import.meta.url),
      target: "references/contract-templates.md",
      title: "contract-templates.md",
      summary: "ADR 模板、决策记录格式与 Y 语句编写规范。",
      loadWhen:
        "需要创建或审查架构决策记录时读取。",
    }),
  ],
});
