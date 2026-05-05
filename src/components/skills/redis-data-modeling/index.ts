import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const redisDataModelingSkill = defineSkill({
  id: "redis-data-modeling",
  fullName: "Redis Data Modeling",
  description: "当用户要为 Redis 设计数据模型、选择数据结构（String/Hash/List/Set/ZSet/Stream）、设计键命名规范或实现分布式锁时使用。",
  useCases: [
    "新功能数据建模，需在 String / Hash / List / Set / ZSet / Stream 间选型。",
    "排行榜、计数器、消息队列、UV 统计等典型场景的结构选择和键设计。",
    "多服务共享 Redis 实例，需要统一键命名规范、TTL 策略和生命周期管理。",
    "跨进程互斥：订单支付、库存扣减、幂等提交、定时任务单实例执行。",
    "缓存刷新互斥保护，联动 [redis-caching-patterns](../redis-caching-patterns/SKILL.md)；集群部署联动 [redis-cluster-ha](../redis-cluster-ha/SKILL.md)。",
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
      summary: "Reference material for redis-data-modeling.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "redis-data-structures",
      source: new URL("./references/redis-data-structures.md", import.meta.url),
      target: "references/redis-data-structures.md",
      title: "redis-data-structures.md",
      summary: "Reference material for redis-data-modeling.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "redis-distributed-lock",
      source: new URL("./references/redis-distributed-lock.md", import.meta.url),
      target: "references/redis-distributed-lock.md",
      title: "redis-distributed-lock.md",
      summary: "Reference material for redis-data-modeling.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "redis-key-design",
      source: new URL("./references/redis-key-design.md", import.meta.url),
      target: "references/redis-key-design.md",
      title: "redis-key-design.md",
      summary: "Reference material for redis-data-modeling.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
