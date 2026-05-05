import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { seoSkill } from "../seo/index";

export const contentStrategySkill = defineSkill({
  id: "content-strategy",
  fullName: "内容策略（content-strategy）",
  description: "当用户要制定内容策略、栏目规划、内容支柱、选题池、编辑节奏、内容多平台分发改编、主题集群设计，或 SEO 内容质量评分时使用。",
  useCases: [
    "从零规划内容方向、内容支柱和季度选题。",
    "判断“该写什么”而不是“这篇怎么改”。",
    "需要把品牌叙事、搜索流量和销售线索整合成一套发布计划。",
  ],
  constraints: [
    "先定义目标受众、业务目标和差异化，再排选题。",
    "每个选题都要说明它服务搜索、分享、教育还是转化，不能只看“感觉能写”。",
    "内容策略要和站点结构、分发渠道、复用方式配套考虑。",
    "若任务转向具体页面优化，配合 `seo`。",
  ],
  checklist: [
    "是否明确业务目标、受众层级和内容支柱。",
    "是否区分短期获客内容与长期品牌内容。",
    "是否说明更新频率、负责角色和复用方式。",
    "是否把内容与 CTA、产品页、站点结构关联起来。",
  ],
  relatedSkills: [
    {
      get id() {
        return seoSkill.id;
      },
      reason: "若任务转向具体页面优化，配合 `seo`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "只堆主题词",
      pass: "主题 + 读者 + 意图 + CTA",
    }),
    defineAntiPattern({
      fail: "全 SEO 化",
      pass: "三类平衡",
    }),
    defineAntiPattern({
      fail: "无视发布能力",
      pass: "按产能定节奏",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "content-calendar-methodology",
      source: new URL("./references/content-calendar-methodology.md", import.meta.url),
      target: "references/content-calendar-methodology.md",
      title: "content-calendar-methodology.md",
      summary: "内容日历方法论：选题规划、发布时间表与编辑节奏管理。",
      loadWhen: "需要制定季度选题计划或规划内容发布节奏时读取。",
    }),
    defineReference({
      id: "content-repurpose",
      source: new URL("./references/content-repurpose.md", import.meta.url),
      target: "references/content-repurpose.md",
      title: "content-repurpose.md",
      summary: "内容多平台分发改编策略：一份内容如何适配不同渠道。",
      loadWhen: "需要将同一内容分发到多个平台或做跨渠道改编时读取。",
    }),
    defineReference({
      id: "domain-name-brainstormer",
      source: new URL("./references/domain-name-brainstormer.md", import.meta.url),
      target: "references/domain-name-brainstormer.md",
      title: "domain-name-brainstormer.md",
      summary: "域名头脑风暴方法指南：品牌命名策略与域名可用性评估。",
      loadWhen: "需要为新品牌或产品构思域名方案时读取。",
    }),
    defineReference({
      id: "headless-cms",
      source: new URL("./references/headless-cms.md", import.meta.url),
      target: "references/headless-cms.md",
      title: "headless-cms.md",
      summary: "Headless CMS 选型指南与内容架构设计原则。",
      loadWhen: "需要评估内容管理系统或设计内容基础设施时读取。",
    }),
    defineReference({
      id: "seo-content-scoring",
      source: new URL("./references/seo-content-scoring.md", import.meta.url),
      target: "references/seo-content-scoring.md",
      title: "seo-content-scoring.md",
      summary: "SEO 内容质量评分体系：关键词相关性、可读性、原创性与 EEAT 评估。",
      loadWhen: "需要评估内容 SEO 质量或为内容评分定标时读取。",
    }),
    defineReference({
      id: "topic-cluster",
      source: new URL("./references/topic-cluster.md", import.meta.url),
      target: "references/topic-cluster.md",
      title: "topic-cluster.md",
      summary: "主题集群设计方法：支柱页面、集群内容与内部链接策略。",
      loadWhen: "需要设计内容主题集群或规划 SEO 支柱页面时读取。",
    }),
  ],
});
