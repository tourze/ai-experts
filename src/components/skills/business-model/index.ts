import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const businessModelSkill = defineSkill({
  id: "business-model",
  fullName: "商业模式分析",
  description: "当用户要设计新商业模式、诊断现有产品变现、研究成熟公司商业模式，或用魏朱六要素分析中国市场因果逻辑、做产品-职能-市场铁三角一致性检验时使用。",
  useCases: [
    "`idea_to_model`：新业务、新产品或变现想法，需要生成 `3-5` 个商业模式选项。",
    "`model_diagnosis`：现有产品、网站或公司，需要诊断收入结构、变现缺口和升级机会。",
    "`company_case_study`：成熟公司研究，需要拆解利润池、可迁移经验和环境依赖。",
    "只看竞争结构时转 [porters-five-forces](../porters-five-forces/SKILL.md)；只做定价打包时转 [pricing-strategy](../pricing-strategy/SKILL.md)。",
    "中国市场商业模式因果链推演用[魏朱六要素](references/weizhu-model.md)；快速定位一致性检查用[业务铁三角](references/iron-triangle.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "iron-triangle",
      source: new URL("./references/iron-triangle.md", import.meta.url),
      target: "references/iron-triangle.md",
      title: "iron-triangle.md",
      summary: "Reference material for business-model.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "report-contract",
      source: new URL("./references/report-contract.md", import.meta.url),
      target: "references/report-contract.md",
      title: "report-contract.md",
      summary: "Reference material for business-model.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "weizhu-model",
      source: new URL("./references/weizhu-model.md", import.meta.url),
      target: "references/weizhu-model.md",
      title: "weizhu-model.md",
      summary: "Reference material for business-model.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
