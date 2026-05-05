import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { redisCachingPatternsSkill } from "../redis-caching-patterns/index";
import { redisClusterHaSkill } from "../redis-cluster-ha/index";

export const redisDataModelingSkill = defineSkill({
  id: "redis-data-modeling",
  fullName: "Redis Data Modeling",
  description: "当用户要为 Redis 设计数据模型、选择数据结构（String/Hash/List/Set/ZSet/Stream）、设计键命名规范或实现分布式锁时使用。",
  useCases: [
    "新功能数据建模，需在 String / Hash / List / Set / ZSet / Stream 间选型。",
    "排行榜、计数器、消息队列、UV 统计等典型场景的结构选择和键设计。",
    "多服务共享 Redis 实例，需要统一键命名规范、TTL 策略和生命周期管理。",
    "跨进程互斥：订单支付、库存扣减、幂等提交、定时任务单实例执行。",
    "缓存刷新互斥保护，联动 `redis-caching-patterns`；集群部署联动 `redis-cluster-ha`。",
  ],
  constraints: [
    "**数据结构选型**\n- String 用于简单值和原子计数器（INCR），单 value 建议不超过 10 KB。\n- Hash 用于部分字段读写，字段数 ≤128 且值 ≤64B 时用 listpack 更省内存。\n- ZSet score 是 double，精度有限；高精度排序用 score:timestamp 组合。\n- Stream 消费者组必须显式 XACK，未确认消息留在 PEL 导致内存增长。\n- 选结构前必须明确访问模式（点查 / 范围 / 排序 / 聚合），不仅看数据形状。",
    "**键设计**\n- 键名格式 `{service}:{object_type}:{id}`，冒号分隔，全小写，禁止空格和特殊字符。\n- 生产环境严禁 `KEYS *`，必须用 `SCAN` + `MATCH` + `COUNT`。\n- 所有临时键必须设置 TTL 且带随机抖动，永久键需文档登记。\n- 单 key value 不超过 10 KB（String）或 5000 元素（集合类），超出需拆分。\n- 用 `MEMORY USAGE` 和 `OBJECT ENCODING` 定期审计键内存。",
    "**分布式锁**\n- 获取锁必须用 `SET key value NX EX seconds` 单条原子命令，严禁 `SETNX` + `EXPIRE`。\n- value 必须是唯一 owner token（UUID），释放时 Lua 校验 owner 后再 DEL。\n- 锁超时必须大于业务最大执行时间，或用 watchdog 自动续期。\n- Redlock 需 5 个独立实例，获取多数派（N/2+1）且扣除获取耗时。\n\n详细模式见：[references/redis-data-structures.md](references/redis-data-structures.md)、[references/redis-key-design.md](references/redis-key-design.md)、[references/redis-distributed-lock.md](references/redis-distributed-lock.md)。",
  ],
  relatedSkills: [
    {
      get id() {
        return redisClusterHaSkill.id;
      },
      reason: "缓存刷新互斥保护，联动 `redis-caching-patterns`；集群部署联动 `redis-cluster-ha`。",
    },
    {
      get id() {
        return redisCachingPatternsSkill.id;
      },
      reason: "缓存刷新互斥保护，联动 `redis-caching-patterns`；集群部署联动 `redis-cluster-ha`。",
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
