import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { proposalWriterSkill } from "../proposal-writer/index";
import { userGuideWritingSkill } from "../user-guide-writing/index";

export const docCoauthoringSkill = defineSkill({
  id: "doc-coauthoring",
  fullName: "文档共创",
  description: "当用户要协作撰写文档、方案、技术设计、决策记录或其他结构化材料时使用。",
  useCases: [
    "用户手里有零散素材，需要共同整理成可读、可评审、可交付的文档。",
    "文档类型可以是技术设计、项目方案、研究备忘录、培训材料、用户指南。",
    "用户需要“边问边补、边写边校”，而不是一次性生成完稿。",
    "若文档偏正式提案，可接续 `proposal-review` 或 `proposal-writer`。",
  ],
  constraints: [
    "先收集上下文和读者信息，再决定结构；不要盲写。",
    "每一轮只推进一个明确目标：补背景、定结构、写章节、做验收。",
    "对缺失信息要显式标注“待确认”，但不要把未确认内容包装成事实。",
    "交付前必须做一次读者视角检查：读者是谁、读完要做什么、还缺什么。",
  ],
  checklist: [
    "是否明确文档目标、目标读者、截止时间和使用场景。",
    "是否先列出目录、边界和未决问题，而不是直接写长文。",
    "是否把“事实输入”“作者判断”“后续行动”分层表达。",
    "是否记录了需要用户补充的材料，而不是把缺口藏在正文里。",
  ],
  relatedSkills: [
    {
      get id() {
        return proposalWriterSkill.id;
      },
      reason: "若文档偏正式提案，可接续 `proposal-review` 或 `proposal-writer`。",
    },
    {
      get id() {
        return userGuideWritingSkill.id;
      },
      reason: "交付后若还要延展成用户手册，可转给 `user-guide-writing`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "原料堆砌",
      pass: "结构 → 缺口 → 章节",
    }),
    defineAntiPattern({
      fail: "虚构背景",
      pass: "显式标 [待确认]",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认文档类型、目标读者、已有素材、截止时间、使用场景和本轮目标。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "先产出目录、边界、事实输入、作者判断和待确认问题，不直接写成大段完稿。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "按收集背景与目标、列目录与缺口、逐章起草、读者视角复核、定稿交接推进。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "每轮只推进一个明确目标；缺失信息标为待确认，不把未确认内容包装成事实。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "文档结构、章节草稿或定稿，以及每轮推进目标。",
      "事实输入、作者判断、待确认问题和后续行动的分层清单。",
      "读者视角复核结论：读者是谁、读完要做什么、还缺什么。",
    ],
  }),
});
