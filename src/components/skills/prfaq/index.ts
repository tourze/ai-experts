import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { createPrdSkill } from "../create-prd/index";

export const prfaqSkill = defineSkill({
  id: "prfaq",
  fullName: "PRFAQ（新闻稿 + FAQ）",
  description: "当用户要用 PRFAQ 或 Working Backwards 验证产品想法、对齐团队认知或推动立项时使用。",
  useCases: [
    "新产品/功能立项前，用\"从终点倒推\"的方式验证用户价值主张。",
    "需要在团队或管理层之间对齐\"我们到底要做什么、为谁做\"。",
    "需要先说清为什么做、为谁做和为什么现在做，再进入 PRD。",
  ],
  constraints: [
    "新闻稿必须从**用户视角**写，不是从公司视角；主语是用户，不是\"我们\"。",
    "新闻稿限 1 页（≤500 字）；FAQ 分内部和外部两组，各 3-5 个问题。",
    "如果写不出让人想点击的标题，说明价值主张还不清楚，先退回去想清楚。",
    "FAQ 必须直面最难的问题（\"为什么现在做\"\"为什么是我们\"\"失败了怎么办\"），不允许只放软球。",
  ],
  checklist: [
    "新闻稿从用户视角撰写，主语不是\"我们的产品\"。",
    "标题让目标用户有点击欲望。",
    "内部 FAQ 包含至少一个\"为什么不做\"类的硬问题。",
    "团队读完后能回答\"做什么、为谁做、为什么现在做\"。",
  ],
  relatedSkills: [
    {
      get id() {
        return createPrdSkill.id;
      },
      reason: "PRFAQ 已压实用户价值和立项理由，需要继续写 PRD、需求边界和验收标准时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "公司视角的广告",
      pass: "用户视角的价值",
    }),
    defineAntiPattern({
      fail: "FAQ 全是软球",
      pass: "FAQ 直面硬问题",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认目标用户、痛点、机会窗口、替代方案、成功标准和需要对齐的受众。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "新闻稿从用户视角写，标题不超过 15 字，副标题补目标用户和核心价值，全文控制在 1 页/500 字内。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "正文包含问题段、方案段、用户引言、如何开始和负责人引言；主语是用户，不是公司。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "FAQ 分外部和内部两组，各 3-5 个问题；内部 FAQ 必须直面为什么现在做、为什么是我们、失败怎么办等硬问题。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "写不出让目标用户想点击的标题时，先回退重想价值主张，不进入 PRD。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "PRFAQ 新闻稿：标题、副标题、日期地点、问题、方案、用户引言、如何开始、负责人引言。",
      "外部 FAQ、内部 FAQ、硬问题、风险、资源/ROI、退出策略和竞品解释。",
      "是否进入 create-prd 的判断：用户价值、团队共识、机会窗口和仍需澄清的问题。",
    ],
  }),
});
