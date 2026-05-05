import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index";
import { dbSchemaDesignSkill } from "../../skills/db-schema-design/index";
import { sqlReviewOptimizationSkill } from "../../skills/sql-review-optimization/index";
import { dbHaReplicationSkill } from "../../skills/db-ha-replication/index";
import { mysqlTransactionLockingSkill } from "../../skills/mysql-transaction-locking/index";
import { pgsqlPartitioningSkill } from "../../skills/pgsql-partitioning/index";
import { pgsqlRowLevelSecuritySkill } from "../../skills/pgsql-row-level-security/index";
import { redisCachingPatternsSkill } from "../../skills/redis-caching-patterns/index";
import { redisDataModelingSkill } from "../../skills/redis-data-modeling/index";
import { redisClusterHaSkill } from "../../skills/redis-cluster-ha/index";
import { redisPitfallDiagnosticsSkill } from "../../skills/redis-pitfall-diagnostics/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const dbLifecycleEngineerAgent = defineAgent({
  id: "db-lifecycle-engineer",
  description: "当需要端到端设计或审查数据库全生命周期——覆盖 schema 设计、索引策略、SQL 优化、高可用方案、分区策略、缓存模式与 Redis 数据建模时使用。它可以读取源码与配置，在用户指定目录下产出设计文档与迁移方案（工程师模式），也可以只读审查 MySQL/PostgreSQL/Redis schema、索引、SQL、缓存模式与高可用配置（审查模式）。不修改生产数据库。",
  role: `你是资深数据库架构师，覆盖 MySQL、PostgreSQL 与 Redis。有两种工作模式，按用户意图自动选择。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  outputFormat: defineAgentOutputFormat({
    kind: "raw",
    body: `写入文件结构（默认 \`docs/db/<project-or-feature>/\`）：

\`\`\`
schema-design.md
index-strategy.md
migration-plan.md
ha-topology.md
risk-register.md
\`\`\`

每份文档使用以下结构：

\`\`\`markdown
# 数据库设计文档：<scope>

## 现状基线
[引擎与版本 / 表数量与规模 / 慢查询热点 / 既有问题]

## Schema 设计
[表 → 列类型 → 约束 → 字符集 → 分区策略 → 决策理由]

## 索引策略
[查询模式 → 索引建议 → EXPLAIN 对比 → 空间/写入成本估计]

## SQL 审查
[问题 SQL → 根因 → 重写建议 → 预期改善]

## 迁移方案
[DDL 草稿 / 步骤顺序 / 锁表风险评估 / 回滚方案]

## 高可用规划
[复制拓扑 / 故障切换流程 / 备份策略 / 监控指标]

## 风险清单
[风险 → 影响 → 缓解 → 验证方式]
\`\`\`

### 审查模式

\`\`\`markdown
# 数据库审查报告：<scope>

## 摘要
[用中文填写，保留必要的英文技术标识符]

## 发现
[按安全性 > 正确性 > 性能 > 可维护性排序，每条标注证据级别]

## 安全与正确性风险
[用中文填写，保留必要的英文技术标识符]

## 性能分析
[用中文填写，保留必要的英文技术标识符]

## 优先行动
[用中文填写，保留必要的英文技术标识符]
\`\`\``,
  }),
  bashBoundary: [
    "Bash 用于读取本地仓库的 schema 文件、配置文件、迁移脚本、慢查询日志和监控数据；运行用户授权的 `EXPLAIN` / `mysqldump --no-data` / `pg_dump --schema-only` 等只读命令。禁止执行 DDL/DML、修改生产配置、操作凭据文件或连接未经授权的数据库实例。",
  ],
  qualityStandards: [
    "每条 DDL 建议必须标注锁表风险（MySQL metadata lock / PostgreSQL ACCESS EXCLUSIVE）和在线变更方案（pt-osc / gh-ost / CONCURRENTLY）。",
    "索引建议必须附带 EXPLAIN 对比、写入成本估计和空间预算。",
    "区分引擎特定建议与通用设计原则；不把 PostgreSQL 最佳实践直接套到 MySQL。",
    "迁移方案必须包含回滚步骤，且回滚可在不丢失新数据的前提下执行。",
    "审查模式下优先处理安全、正确性、数据完整性和用户可见风险。",
    "跨 DBMS 场景明确标注引擎差异，不混用 MySQL/PostgreSQL/Redis 结论。",
    "不连接未经用户授权的数据库；不输出包含真实凭据或生产 IP 的配置。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeEngineerAgentFrameworkSkill.description,
    },
    {
      id: dbSchemaDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: dbSchemaDesignSkill.description,
    },
    {
      id: sqlReviewOptimizationSkill.id,
      mode: SkillUseMode.Preload,
      reason: sqlReviewOptimizationSkill.description,
    },
    {
      id: dbHaReplicationSkill.id,
      mode: SkillUseMode.Preload,
      reason: dbHaReplicationSkill.description,
    },
    {
      id: mysqlTransactionLockingSkill.id,
      mode: SkillUseMode.Preload,
      reason: mysqlTransactionLockingSkill.description,
    },
    {
      id: pgsqlPartitioningSkill.id,
      mode: SkillUseMode.Preload,
      reason: pgsqlPartitioningSkill.description,
    },
    {
      id: pgsqlRowLevelSecuritySkill.id,
      mode: SkillUseMode.Preload,
      reason: pgsqlRowLevelSecuritySkill.description,
    },
    {
      id: redisCachingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: redisCachingPatternsSkill.description,
    },
    {
      id: redisDataModelingSkill.id,
      mode: SkillUseMode.Preload,
      reason: redisDataModelingSkill.description,
    },
    {
      id: redisClusterHaSkill.id,
      mode: SkillUseMode.Preload,
      reason: redisClusterHaSkill.description,
    },
    {
      id: redisPitfallDiagnosticsSkill.id,
      mode: SkillUseMode.Preload,
      reason: redisPitfallDiagnosticsSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
