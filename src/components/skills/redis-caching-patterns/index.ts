import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const redisCachingPatternsSkill = defineSkill({
  id: "redis-caching-patterns",
  fullName: "Redis Caching Patterns",
  description: "当用户要实现或排查 Redis 缓存旁路、写穿、缓存雪崩或穿透防护时使用。适用于数据库前缓存与热点保护。",
  useCases: [
    "数据库前置缓存层读写策略选型（cache-aside、write-through、write-behind）。",
    "高并发下防缓存击穿（thundering herd），需 singleflight 或锁刷新。",
    "防缓存穿透（恶意请求不存在的 key），需空值缓存或布隆过滤器。",
    "TTL 抖动防雪崩，配合 [redis-data-modeling](../redis-data-modeling/SKILL.md) 的键设计与锁模式。",
  ],
  constraints: [
    "cache-aside 读路径：check cache → miss → query DB → set cache；写路径：先写 DB 再删缓存。",
    "互斥刷新用 `SET key value NX EX seconds`，严禁无保护地并发回源。",
    "穿透防御至少一种：空值缓存（短 TTL）或布隆过滤器。",
    "TTL 必须添加随机抖动，禁止所有键使用相同固定 TTL。",
    "删缓存失败需有补偿（重试队列或 binlog 监听），不能静默忽略。",
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
      summary: "Reference material for redis-caching-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
