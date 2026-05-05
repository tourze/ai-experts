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
  constraints: [
    "先定任务，再选模型：FAQ 检索、长文档问答、代码检索、多语种检索的最优解不一样。",
    "embedding 方案必须和距离度量、索引类型、chunk 规则一起设计，不能单独讨论。",
    "文档切块要优先尊重语义边界，其次再谈 token 上限。",
    "检索质量要通过离线样本评估，不要凭主观感觉认定某个模型“更懂业务”。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
