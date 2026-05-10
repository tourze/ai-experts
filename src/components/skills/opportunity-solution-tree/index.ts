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

export const opportunitySolutionTreeSkill = defineSkill({
  id: "opportunity-solution-tree",
  fullName: "机会解决方案树",
  description: "当用户要搭建机会解决方案树、把目标与机会、方案和实验串起来时使用；适合连续发现、需求排序和产品探索决策。",
  useCases: [
    "产品探索、连续发现、OKR 拆解、机会排序和实验规划。",
  ],
  constraints: [
    "树顶必须是单一且可度量的 outcome，不能把功能目标写在最上面。",
    "Opportunity 要从用户问题或欲望出发，不要直接写解决方案。",
    "每条分支最终都应落到可验证实验，而不是停在“以后做”。",
  ],
  checklist: [
    "Outcome、机会、方案、实验四层结构清楚。",
    "机会来自研究证据，而非主观猜想。",
    "方案和实验有优先级与判定标准。",
    "可以直接衔接需求文档或实验计划。",
  ],
  relatedSkills: [
    {
      get id() {
        return createPrdSkill.id;
      },
      reason: "需要把目标与版本规划、PRD 连接起来时，可配合 `create-prd`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "跳过机会层",
      pass: "三层完整",
    }),
    defineAntiPattern({
      fail: "实验无判定",
      pass: "预设阈值 + 样本量",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先定义树顶 outcome：单一、可度量、有时间边界，并说明它和业务目标的关系。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "从研究证据、客户反馈或行为数据中提取 opportunities，写成用户问题、欲望或阻碍。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "为每个高优机会生成多个 solution，不把第一个想到的功能当作唯一答案。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "把 solution 落到 experiments，预设样本、阈值、观察期、风险和决策规则。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "按机会影响、信心、成本和学习价值排序，明确暂缓分支和原因。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "需要进入需求文档或版本规划时联动 `create-prd`，把实验结论转成 PRD 输入。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Outcome -> Opportunities -> Solutions -> Experiments 四层树。",
      "每个机会的证据来源和优先级。",
      "候选方案、实验设计和判定标准。",
      "暂缓分支、风险假设和 PRD/实验计划衔接项。",
    ],
  }),
});
