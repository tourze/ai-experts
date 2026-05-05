import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const embeddingStrategiesSkill = defineSkill({
  id: "embedding-strategies",
  fullName: "embedding-strategies",
  description: "当用户要选择或比较 embedding 模型、切块策略或向量检索方案时使用。",
  useCases: [
    "需要在“效果、成本、维度、语言覆盖、领域适配”之间为 embedding 选型。",
    "需要定义 chunk size、chunk overlap、metadata 策略与 query/document 双塔约束。",
    "检索召回差，但还不能确认问题出在 embedding、切块还是索引层。",
    "相关 skill：[similarity-search-patterns](../similarity-search-patterns/SKILL.md)、[vector-index-tuning](../vector-index-tuning/SKILL.md)、[rag-auditor](../rag-auditor/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
