import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
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
    "站点层级和 URL 规划配合 `content-strategy`。",
    "不对排名结果做承诺；SEO 结论要区分\"可执行项\"和\"结果预期\"。",
    "按站点类型使用对应检查项，见 [site-type-checklists](references/site-type-checklists.md)。",
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
      get id() {
        return contentStrategySkill.id;
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "aeo-geo",
      source: new URL("./references/aeo-geo.md", import.meta.url),
      target: "references/aeo-geo.md",
      title: "aeo-geo.md",
      summary: "Reference material for seo.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "programmatic-seo-playbooks",
      source: new URL("./references/programmatic-seo-playbooks.md", import.meta.url),
      target: "references/programmatic-seo-playbooks.md",
      title: "programmatic-seo-playbooks.md",
      summary: "Reference material for seo.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "site-architecture",
      source: new URL("./references/site-architecture.md", import.meta.url),
      target: "references/site-architecture.md",
      title: "site-architecture.md",
      summary: "Reference material for seo.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "site-type-checklists",
      source: new URL("./references/site-type-checklists.md", import.meta.url),
      target: "references/site-type-checklists.md",
      title: "site-type-checklists.md",
      summary: "Reference material for seo.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
