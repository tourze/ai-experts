import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const redisPitfallDiagnosticsSkill = defineSkill({
  id: "redis-pitfall-diagnostics",
  fullName: "Redis Pitfall Diagnostics",
  description: "当用户遇到 Redis 诡异行为、性能抖动、OOM、key 过期异常、持久化丢数据、主从不一致、复制失败或想系统排查 Redis 坑位时使用。适用于把症状映射到命令复杂度、过期语义、AOF/RDB、主从复制、版本差异和配置契约。",
  useCases: [
    "key 设置了 TTL 后变成不过期，或大量 key 过期时间异常。",
    "Redis 延迟抖动、单命令阻塞、`SLOWLOG` 出现 `DEL` / `KEYS` / `SETBIT` / `RANDOMKEY` / `MONITOR`。",
    "RDB / AOF / rewrite / `fork` 期间 OOM、卡顿或数据丢失窗口不符合预期。",
    "Sentinel / replica / Cluster 场景下主从数据不一致、故障切换后缓存雪崩、全量同步反复失败。",
    "需要把线上症状整理成可验证假设，而不是凭经验罗列 Redis 常识。",
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
      summary: "Reference material for redis-pitfall-diagnostics.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
