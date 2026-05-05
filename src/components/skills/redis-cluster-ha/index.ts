import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const redisClusterHaSkill = defineSkill({
  id: "redis-cluster-ha",
  fullName: "Redis Cluster & High Availability",
  description: "当用户要部署、运维或排查 Redis Sentinel、Cluster 或持久化策略时使用。适用于高可用架构与容量规划。",
  useCases: [
    "高可用架构选型：Sentinel vs Cluster。",
    "持久化策略配置（RDB / AOF / 混合），平衡数据安全与性能。",
    "maxmemory 和淘汰策略制定，防止 OOM。",
    "慢查询监控和运维基线建立。",
    "分布式锁在集群下的考量参考 [redis-data-modeling](../redis-data-modeling/SKILL.md)，键分布和锁模式见该 skill。",
    "完整配置和监控脚本见 [references/code-patterns.md](references/code-patterns.md)。",
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
