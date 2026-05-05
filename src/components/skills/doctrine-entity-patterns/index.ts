import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const doctrineEntityPatternsSkill = defineSkill({
  id: "doctrine-entity-patterns",
  fullName: "Doctrine Entity Patterns",
  description: "当用户要设计或审查 Doctrine ORM Entity、关联关系、Repository 或 Migration 时使用。",
  useCases: [
    "新建或审查 Entity 列映射、关联、索引、Repository 和 Migration。",
    "排查 N+1、懒加载异常、级联删除或 UnitOfWork 性能问题。",
    "批处理联动 [doctrine-batch-processing](../doctrine-batch-processing/SKILL.md)；Bundle 组织联动 [symfony-bundle-architecture](../symfony-bundle-architecture/SKILL.md)。完整示例见 [reference.md](reference.md)。",
  ],
  constraints: [
    "用 PHP 8 Attributes 映射，不用注解。",
    "ID 生成策略必须显式声明。",
    "关联必须明确 `cascade`、`orphanRemoval` 和反向归属。",
    "时间字段用 `DateTimeImmutable`。",
    "Repository 继承 `ServiceEntityRepository`；Migration 只做结构变更。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
