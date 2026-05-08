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
import { symfonyMessengerSkill } from "../symfony-messenger/index";
import { symfonyVotersSkill } from "../symfony-voters/index";

export const doctrineBatchProcessingSkill = defineSkill({
  id: "doctrine-batch-processing",
  fullName: "Doctrine 批处理",
  description: "当用户要实现或修复 Symfony / Doctrine 批处理、批量导入、数据回填或大数据量写入时使用。",
  useCases: [
    "需要在 Symfony 项目里实现大批量导入、批量更新、数据回填或历史数据迁移。",
    "Doctrine ORM 在长循环中内存上涨、SQL 日志过多、`UnitOfWork` 膨胀或 `flush()` 过慢。",
    "需要判断某段批处理应该继续走 ORM，还是切到 DBAL / 原生 SQL。",
    "如果批处理由异步消息驱动，可联动 `symfony-messenger`；如果涉及权限边界，可联动 `symfony-voters`。",
    "更细的示例和命令参考读取 `implementation-reference`。",
  ],
  constraints: [
    "默认假设数据量会增长：不要用 `findAll()`、不要把全量结果一次性放进内存。",
    "ORM 批处理必须显式控制 `flush()` / `clear()` 节奏，避免 `UnitOfWork` 无限膨胀。",
    "结构变更必须走 migration；不要手改已落库的历史迁移文件来“修补”生产状态。",
    "能用 DBAL 一条 SQL 完成的批量更新，不要为了“统一风格”强行绕回 ORM。",
    "长事务要谨慎：批次大小、锁持有时间和回滚成本必须一起评估。",
  ],
  checklist: [
    "批处理是否避免了 `findAll()`、级联加载和无界集合遍历。",
    "是否为每个批次定义了明确的 `flush()` / `clear()` 节点和批次大小。",
    "SQL 日志、事件监听器和二级缓存是否会放大批处理成本。",
    "迁移是否可回滚、可重复验证，并与生产数据量和锁影响相匹配。",
    "如果批量修改跨越多个表，是否明确了事务边界、索引命中和失败恢复策略。",
  ],
  relatedSkills: [
    {
      get id() {
        return symfonyVotersSkill.id;
      },
      reason: "批处理涉及权限过滤、资源归属或授权后动作时联动。",
    },
    {
      get id() {
        return symfonyMessengerSkill.id;
      },
      reason: "批处理由异步消息、失败队列或消费者驱动时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "findAll + 每条 flush",
      pass: "toIterable + 分批 flush/clear",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认数据量、查询方式、事务范围、锁影响、监听器副作用和是否需要 ORM 生命周期事件。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "ORM 批处理用 `toIterable()`，按批次 `flush()` / `clear()`，必要时收敛 SQL logger 和 UnitOfWork 膨胀。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "能用 DBAL 一条 SQL 完成的批量更新优先走 DBAL / 原生 SQL，不强行绕回 ORM。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "基础 ORM 批处理读取 `orm-batch-patterns`；完整命令、分页和失败模式读取 `implementation-reference`；DBAL / migration 深入读取 `advanced-patterns`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "批处理方案、ORM / DBAL 边界、批次大小和事务策略。",
      "`flush()` / `clear()` 节点、内存风险、锁影响和失败恢复建议。",
      "需要运行的迁移、schema、测试和性能验证命令。",
    ],
  }),
  references: [
    defineReference({
      id: "orm-batch-patterns",
      source: new URL("./references/orm-batch-patterns.md", import.meta.url),
      target: "references/orm-batch-patterns.md",
      title: "Doctrine ORM 批处理模式",
      summary: "toIterable、分批 flush/clear 和基础 ORM 回填示例。",
      loadWhen: "需要快速实现 Doctrine ORM 分批处理或修复 findAll 批处理时读取。",
    }),
    defineReference({
      id: "implementation-reference",
      source: new URL("./references/implementation-reference.md", import.meta.url),
      target: "references/implementation-reference.md",
      title: "Doctrine 批处理实现参考",
      summary: "Doctrine 批处理命令、稳定分页、DBAL 更新、验证命令和失败模式。",
      loadWhen: "需要更完整的 Doctrine 批处理实现、命令或排障清单时读取。",
    }),
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Doctrine ORM 批处理的高级模式，包括 UnitOfWork 控制、DBAL 切换和迁移策略。",
      loadWhen: "需要处理大批量导入、内存优化或判断 ORM 与原生 SQL 的边界时读取。",
    }),
  ],
});
