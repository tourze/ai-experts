import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const redisPitfallDiagnosticsSkill = defineSkill({
  id: "redis-pitfall-diagnostics",
  description: "当用户遇到 Redis 诡异行为、性能抖动、OOM、key 过期异常、持久化丢数据、主从不一致、复制失败或想系统排查 Redis 坑位时使用。适用于把症状映射到命令复杂度、过期语义、AOF/RDB、主从复制、版本差异和配置契约。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for redis-pitfall-diagnostics.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
