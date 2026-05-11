import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { contentStrategySkill } from "../content-strategy/index";

export const seoSkill = defineSkill({
  id: "seo",
  fullName: "搜索引擎优化（seo）",
  description: "当用户要提升搜索可见性、修复技术 SEO、优化元数据、结构化数据、索引策略或 Search Console 问题时使用。",
  useCases: [
    "审计页面是否可抓取、可索引、可规范化。",
    "优化标题、描述、canonical、robots、sitemap 和结构化数据。",
    "评估内容 E-E-A-T 信号和页面级 SEO 质量。",
    "为内容页、产品页或栏目页补齐搜索可见性基础。",
  ],
  constraints: [
    "先确认页面是否值得被索引，再谈标题和关键词。",
    "技术 SEO 改动必须说明影响范围，尤其是 robots、canonical、noindex、重定向。",
    "不对排名结果做承诺；SEO 结论要区分\"可执行项\"和\"结果预期\"。",
    "按站点类型使用对应检查项，必要时读取 `site-type-checklists` reference。",
  ],
  checklist: [
    "是否明确索引策略和 canonical 策略。",
    "是否检查标题/描述/H1/正文与搜索意图的一致性。",
    "是否评估 E-E-A-T 四个维度的信号强度。",
    "是否说明 sitemap、robots 和结构化数据的变更点。",
    "是否按站点类型（SaaS/电商/内容/本地）使用对应检查项。",
    "是否标注需要前端或内容团队配合的部分。",
  ],
  relatedSkills: [
    {
      get skill() {
        return contentStrategySkill;
      },
      reason: "站点层级和 URL 规划配合 `content-strategy`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "关键词堆砌",
      pass: "搜索意图驱动",
    }),
    defineAntiPattern({
      fail: "改完不说回滚",
      pass: "变更清单 + 监控",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先判断页面或站点是否值得被索引，再按可抓取性、可索引性、页面语义、E-E-A-T、结构化数据、内链的顺序审计。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "技术改动必须逐项说明 robots、canonical、noindex、重定向、sitemap 和结构化数据的影响范围与回滚路径。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "E-E-A-T 审计分 Experience、Expertise、Authoritativeness、Trustworthiness 四类证据，不把品牌自述当作外部权威。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "按站点类型读取 site-type-checklists；站点架构读取 site-architecture，程序化 SEO 读取 programmatic-seo-playbooks，AI 搜索优化读取 aeo-geo。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "SEO 审计或改造清单：抓取、索引、canonical、robots、sitemap、结构化数据、内链和页面语义。",
      "E-E-A-T 证据矩阵、站点类型特定检查项、内容质量风险和需要内容策略联动的问题。",
      "程序化 SEO 页面体系、模板风险、独特价值要求、数据来源和子目录/子域取舍建议。",
    ],
  }),
  references: [
    defineReference({
      id: "aeo-geo",
      source: new URL("./references/aeo-geo.md", import.meta.url),
      target: "references/aeo-geo.md",
      title: "aeo-geo.md",
      summary: "AEO（答案引擎优化）和 GEO（生成式引擎优化）的策略与方法。",
      loadWhen: "需要为 AI 搜索和生成式引擎优化内容策略时读取。",
    }),
    defineReference({
      id: "aeo-content-blocks",
      source: new URL("./references/aeo-content-blocks.md", import.meta.url),
      target: "references/aeo-content-blocks.md",
      title: "aeo-content-blocks.md",
      summary: "面向 Featured Snippet、AI Overview 和语音搜索的标准答案块模板。",
      loadWhen: "需要把内容改写成答案引擎容易提取的定义、步骤、对比或 FAQ 块时读取。",
    }),
    defineReference({
      id: "geo-citation-patterns",
      source: new URL("./references/geo-citation-patterns.md", import.meta.url),
      target: "references/geo-citation-patterns.md",
      title: "geo-citation-patterns.md",
      summary: "提升生成式引擎引用概率的证据、统计、专家引言和自包含答案模式。",
      loadWhen: "需要提高品牌或内容在 AI 回答中被引用的概率时读取。",
    }),
    defineReference({
      id: "programmatic-seo-playbooks",
      source: new URL("./references/programmatic-seo-playbooks.md", import.meta.url),
      target: "references/programmatic-seo-playbooks.md",
      title: "programmatic-seo-playbooks.md",
      summary: "规模化程序化 SEO 的策略手册，包含模板生成和内容编排方法。",
      loadWhen: "需要设计大规模程序化 SEO 页面体系或内容模板时读取。",
    }),
    defineReference({
      id: "site-architecture",
      source: new URL("./references/site-architecture.md", import.meta.url),
      target: "references/site-architecture.md",
      title: "site-architecture.md",
      summary: "SEO 友好的网站架构设计原则，包含 URL 结构、导航层级和内部链接策略。",
      loadWhen: "需要规划或审计网站整体架构对搜索可见性的影响时读取。",
    }),
    defineReference({
      id: "site-type-templates",
      source: new URL("./references/site-type-templates.md", import.meta.url),
      target: "references/site-type-templates.md",
      title: "site-type-templates.md",
      summary: "SaaS、电商、内容站和本地服务站点的层级、URL 和页面模板。",
      loadWhen: "需要从站点类型出发快速生成 SEO 架构草案时读取。",
    }),
    defineReference({
      id: "navigation-patterns",
      source: new URL("./references/navigation-patterns.md", import.meta.url),
      target: "references/navigation-patterns.md",
      title: "navigation-patterns.md",
      summary: "主导航、次导航、面包屑、footer 和内链模块的 SEO 导航模式。",
      loadWhen: "需要治理导航过载、点击深度或内部链接分配时读取。",
    }),
    defineReference({
      id: "mermaid-templates",
      source: new URL("./references/mermaid-templates.md", import.meta.url),
      target: "references/mermaid-templates.md",
      title: "mermaid-templates.md",
      summary: "用于表达站点层级、转化路径、内链和迁移计划的 Mermaid 模板。",
      loadWhen: "需要把 SEO 站点架构可视化为 Mermaid 图时读取。",
    }),
    defineReference({
      id: "site-type-checklists",
      source: new URL("./references/site-type-checklists.md", import.meta.url),
      target: "references/site-type-checklists.md",
      title: "site-type-checklists.md",
      summary: "按站点类型（SaaS/电商/内容/本地）分类的 SEO 检查清单。",
      loadWhen: "需要根据具体站点类型执行针对性的 SEO 审计时读取。",
    }),
  ],
});
