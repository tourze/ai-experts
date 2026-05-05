import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { redisDataModelingSkill } from "../redis-data-modeling/index";

export const redisClusterHaSkill = defineSkill({
  id: "redis-cluster-ha",
  fullName: "Redis Cluster & High Availability",
  description: "当用户要部署、运维或排查 Redis Sentinel、Cluster 或持久化策略时使用。适用于高可用架构与容量规划。",
  useCases: [
    "高可用架构选型：Sentinel vs Cluster。",
    "持久化策略配置（RDB / AOF / 混合），平衡数据安全与性能。",
    "maxmemory 和淘汰策略制定，防止 OOM。",
    "慢查询监控和运维基线建立。",
    "分布式锁在集群下的考量参考 `redis-data-modeling`，键分布和锁模式见该 skill。",
    "完整配置和监控脚本见 [references/code-patterns.md](references/code-patterns.md)。",
  ],
  constraints: [
    "Sentinel 至少 3 节点，quorum = `(N/2)+1`（3 节点时 quorum=2）。",
    "Cluster multi-key 操作要求所有 key 在同一 hash slot，用 `{hashtag}` 保证。",
    "生产环境必须开启持久化（至少 AOF），纯内存模式仅用于可丢失缓存。",
    "maxmemory 预留系统内存 20-30%（fork copy-on-write 开销），不设为物理内存 100%。",
    "SLOWLOG 阈值建议 10ms（10000 微秒），定期巡检并优化。",
  ],
  checklist: [
    "Sentinel 是否至少 3 节点，quorum 是否为多数派。",
    "Cluster multi-key 操作是否用了 `{hashtag}`。",
    "持久化是否开启，AOF fsync 是否满足 RPO 要求。",
    "maxmemory 是否预留 fork 开销，淘汰策略是否匹配业务场景。",
    "是否配置 SLOWLOG 监控，是否有定期巡检机制。",
  ],
  relatedSkills: [
    {
      get id() {
        return redisDataModelingSkill.id;
      },
      reason: "分布式锁在集群下的考量参考 `redis-data-modeling`，键分布和锁模式见该 skill。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "code-patterns",
      source: new URL("./references/code-patterns.md", import.meta.url),
      target: "references/code-patterns.md",
      title: "code-patterns.md",
      summary: "Reference material for redis-cluster-ha.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
