import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const doctrineBatchProcessingSkill = defineSkill({
  id: "doctrine-batch-processing",
  fullName: "Doctrine 批处理",
  description: "当用户要实现或修复 Symfony / Doctrine 批处理、批量导入、数据回填或大数据量写入时使用。",
  useCases: [
    "需要在 Symfony 项目里实现大批量导入、批量更新、数据回填或历史数据迁移。",
    "Doctrine ORM 在长循环中内存上涨、SQL 日志过多、`UnitOfWork` 膨胀或 `flush()` 过慢。",
    "需要判断某段批处理应该继续走 ORM，还是切到 DBAL / 原生 SQL。",
    "如果批处理由异步消息驱动，可联动 [symfony-messenger](../symfony-messenger/SKILL.md)；如果涉及权限边界，可联动 [symfony-voters](../symfony-voters/SKILL.md)。",
    "更细的示例和命令参考见 [reference.md](reference.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Reference material for doctrine-batch-processing.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
