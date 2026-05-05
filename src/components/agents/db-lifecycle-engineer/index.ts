import {
  AgentSandbox,
  defineAgent,
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
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
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
