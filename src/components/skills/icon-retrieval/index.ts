import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { procedureUse, iconRetrievalSearch } from "../../procedures/index";

import { designSystemPatternsSkill } from "../design-system-patterns/index";
import { figmaImplementDesignSkill } from "../figma-implement-design/index";

export const iconRetrievalSkill = defineSkill({
  id: "icon-retrieval",
  fullName: "图标检索",
  description: "当需要搜索图标、查找 SVG 或批量筛选图标候选时使用。",
  useCases: [
    "需要快速搜索某个概念对应的 SVG 图标。",
    "需要把图标结果直接嵌入前端代码、设计系统或可视化页面。",
    "需要给设计稿实现、组件开发或信息图挑选多个候选图标。",
  ],
  constraints: [
    "用具体语义词搜索，优先业务概念而不是泛词；例如 `security shield` 比 `icon` 更有效。",
    "`topK` 必须是正整数，默认值是 `5`。",
    "返回的是原始 SVG 字符串，落库前要按项目的安全与样式规范处理。",
    "先确认图标风格与现有设计系统匹配，再决定是否采用。",
    "图标用于界面时，优先与 `design-system-patterns` 的尺寸、颜色和语义体系一致。",
  ],
  checklist: [
    "搜索词足够具体，已拿到 3-5 个可比较候选。",
    "`topK` 设定合理，没有盲目拉取过多结果。",
    "SVG 已经过滤、压缩或纳入项目统一图标组件。",
    "图标尺寸、线宽、圆角和视觉风格与现有系统一致。",
    "图标语义明确，不会误导用户。",
  ],
  relatedSkills: [
    {
      get id() {
        return figmaImplementDesignSkill.id;
      },
      reason: "设计稿实现时需要把检索到的图标映射到 Figma 资产、组件或视觉状态时联动。",
    },
    {
      get id() {
        return designSystemPatternsSkill.id;
      },
      reason: "图标用于界面时，优先与 `design-system-patterns` 的尺寸、颜色和语义体系一致。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "宽泛关键词",
      pass: "业务语义词",
    }),
    defineAntiPattern({
      fail: "混线宽混风格",
      pass: "锁定单一图标系",
    }),
    defineAntiPattern({
      fail: "装饰图标无文字",
      pass: "aria-label + 视觉图标",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先把用户需求转成具体业务语义词，优先搜索 security shield、document upload 这类概念词。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "调用 icon-retrieval-search，topK 必须是正整数；默认先拿 3-5 个可比较候选。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "结果中的 SVG 是原始字符串，落库或渲染前必须按项目安全、压缩、颜色和包装器规范处理。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "用于界面前检查尺寸、线宽、圆角、语义、可访问名称和与现有设计系统的一致性。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "查询词、topK、候选 URL、SVG 摘要和采用/淘汰理由。",
      "图标风格、尺寸、线宽、颜色、语义和可访问性检查结果。",
      "进入统一 Icon 包装器、设计系统 token 或 Figma 实现的后续处理建议。",
    ],
  }),
  procedures: [
    procedureUse(iconRetrievalSearch),
  ],
});
