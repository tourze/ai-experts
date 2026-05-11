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
import { webContentFetcherSkill } from "../web-content-fetcher/index";

export const deepResearchSkill = defineSkill({
  id: "deep-research",
  fullName: "深度研究",
  description: "当需要联网做事实研究、概念解释、竞品比较、趋势梳理或基于外部信息的前置调研时使用；涉及中文平台数据生态（微信公众号、抖音、大众点评、微博、B 站、小红书等）需要按母公司归属判断主源时也用。",
  useCases: [
    "用户明确要求“研究 / 调查 / 比较 / 解释”某个外部主题，且答案依赖联网信息。",
    "需要为报告、文章、方案、演示或内容创作准备事实基础。",
    "话题包含时效性、争议性或多视角信息，单次搜索不足以覆盖。",
    "如果问题是”某个代码库里的 X 怎么工作”，不要用本 skill，用代码库分析工具。",
  ],
  constraints: [
    "先铺开全景，再钻重点，不要一上来只盯一个关键词。",
    "每一轮检索都要回答三个问题：我已经确认了什么、还缺什么、下一轮搜什么。",
    "对“今天 / 最近 / 最新 / 本周”类问题，必须使用 `<current_date>` 里的真实日期生成查询词。",
    "关键来源要读全文，不要只看搜索摘要；优先官方文档、论文、公告、权威媒体。",
    "明确区分“来源明确给出的事实”和“基于多来源推断的结论”。",
    "结论阶段必须保留来源链路，避免把搜索过程写成流水账。",
  ],
  checklist: [
    "是否至少完成了 3 个不同角度的检索，而不是同义词重复搜索。",
    "是否读取了最关键来源的正文，而不只是摘要。",
    "是否覆盖了事实、案例、趋势、限制和争议点。",
    "是否把日期粒度与用户问题对齐。",
    "关键事实是否有 2-3 个独立来源支持（chain-of-verification）。",
    "是否已经准备好对结果进行归纳总结。",
  ],
  relatedSkills: [
    {
      get skill() {
        return webContentFetcherSkill;
      },
      reason: "用户已经给出具体 URL，或需要抓取关键页面全文沉淀可引用材料时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "只搜一次就写结论",
      pass: "多轮分角度检索",
    }),
    defineAntiPattern({
      fail: "时效问题只搜年份",
      pass: "带具体日期",
    }),
    defineAntiPattern({
      fail: "只找支持论据",
      pass: "主动找反例",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先铺开全景，确认主题边界、主要分支、关键参与方和需要回答的问题，不一上来盯单个关键词。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "第二轮按分支纵深检索，补齐事实、案例、数据、限制条件、反例和争议点。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "第三轮做交叉验证和 Chain-of-Verification：关键事实用 2-3 个独立来源确认并记录分歧。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "时效问题用 current_date 生成具体日期查询；高风险声明优先官方、论文、公告或权威媒体。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "中文平台内容先按母公司/生态判断主源，必要时读取 chinese-platform-routing；关键页面交给 web-content-fetcher 抓正文。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "研究问题、检索角度、查询词、已确认事实、剩余缺口和下一轮搜索计划。",
      "关键来源、权威性分级、交叉验证结果、分歧、争议点和时效说明。",
      "最终归纳、来源链路、事实/推断区分和可引用材料清单。",
    ],
  }),
  references: [
    defineReference({
      id: "chinese-platform-routing",
      source: new URL("./references/chinese-platform-routing.md", import.meta.url),
      target: "references/chinese-platform-routing.md",
      title: "chinese-platform-routing.md",
      summary: "中文互联网平台（微信公众号、抖音、小红书等）的母公司归属与数据源路由规则。",
      loadWhen: "需要判断中文平台数据的主源归属或在多平台间路由搜索策略时读取。",
    }),
    defineReference({
      id: "knowledge-synthesis",
      source: new URL("./references/knowledge-synthesis.md", import.meta.url),
      target: "references/knowledge-synthesis.md",
      title: "knowledge-synthesis.md",
      summary: "多来源信息的交叉验证、矛盾处理和综合性结论的构建方法。",
      loadWhen: "需要融合多个检索来源的信息形成结构化结论或处理信息矛盾时读取。",
    }),
    defineReference({
      id: "technology-search",
      source: new URL("./references/technology-search.md", import.meta.url),
      target: "references/technology-search.md",
      title: "technology-search.md",
      summary: "面向技术主题的多角度检索策略与信息来源优先级指南。",
      loadWhen: "需要搜索技术概念、工具或框架的权威信息并评估可信度时读取。",
    }),
  ],
});
