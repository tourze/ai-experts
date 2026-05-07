import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { doctrineBatchProcessingSkill } from "../doctrine-batch-processing/index";
import { symfonyBundleArchitectureSkill } from "../symfony-bundle-architecture/index";

export const doctrineEntityPatternsSkill = defineSkill({
  id: "doctrine-entity-patterns",
  fullName: "Doctrine Entity Patterns",
  description: "当用户要设计或审查 Doctrine ORM Entity、关联关系、Repository 或 Migration 时使用。",
  useCases: [
    "新建或审查 Entity 列映射、关联、索引、Repository 和 Migration。",
    "排查 N+1、懒加载异常、级联删除或 UnitOfWork 性能问题。",
    "批处理联动 `doctrine-batch-processing`；Bundle 组织联动 `symfony-bundle-architecture`。完整示例读取 `entity-reference`。",
  ],
  constraints: [
    "用 PHP 8 Attributes 映射，不用注解。",
    "ID 生成策略必须显式声明。",
    "关联必须明确 `cascade`、`orphanRemoval` 和反向归属。",
    "时间字段用 `DateTimeImmutable`。",
    "Repository 继承 `ServiceEntityRepository`；Migration 只做结构变更。",
  ],
  checklist: [
    "列映射是否用 Attributes 且有 `comment`。",
    "关联是否声明了 `mappedBy`/`inversedBy` 和 `cascade`。",
    "Repository 是否避免了 `findAll()` 和无界查询。",
    "Migration 是否可回滚、有索引和外键。",
    "集合遍历是否用了 `JOIN FETCH` 或 `toIterable()` 防 N+1。",
  ],
  relatedSkills: [
    {
      get id() {
        return symfonyBundleArchitectureSkill.id;
      },
      reason: "Entity 需要进入 Bundle 目录结构、DI 配置或多 Bundle 边界时联动。",
    },
    {
      get id() {
        return doctrineBatchProcessingSkill.id;
      },
      reason: "Repository 查询、数据回填或大批量更新需要批处理策略时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "DateTime 可变日期",
      pass: "DateTimeImmutable",
    }),
    defineAntiPattern({
      fail: "关联缺反向声明",
      pass: "双向声明 + cascade",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "读取目标 Entity、Repository、Migration、调用点和数据库约束；完整代码示例按需读取 `entity-reference`。",
      "审查列映射、ID 策略、时间类型、nullable、索引、唯一约束和注释。",
      "审查关联关系、归属端、反向声明、cascade、orphanRemoval 和懒加载风险。",
      "审查 Repository 查询边界，避免无界 `findAll()`、N+1 和不可分页集合遍历。",
      "审查 Migration 是否只做结构变更、可回滚、包含索引/外键并避免数据副作用。",
      "输出实体设计建议、查询修复点和迁移风险。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Entity 映射与关联审查结果。",
      "Repository 查询边界和性能风险。",
      "Migration 回滚、索引和外键检查。",
      "需要参考的 `entity-reference` 示例和最小修改建议。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "entity-reference",
      source: new URL("./references/entity-reference.md", import.meta.url),
      target: "references/entity-reference.md",
      title: "Doctrine Entity 实现参考",
      summary: "Doctrine Entity、Repository、Migration、关联、索引和验证命令的完整示例。",
      loadWhen: "需要完整 Doctrine Entity / Repository / Migration 代码示例或命令时读取。",
    }),
  ],
});
