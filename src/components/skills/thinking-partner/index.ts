import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { grillMeSkill } from "../grill-me/index";
import { priorityJudgeSkill } from "../priority-judge/index";

export const thinkingPartnerSkill = defineSkill({
  id: "thinking-partner",
  fullName: "思考拍档",
  description: "当用户思路混乱、不知道怎么办、需要有人一起理清局面和锁定核心问题时使用。用户提到\"我现在很乱\"\"帮我理一理\"\"我卡住了\"时触发。",
  useCases: [
    "用户说“我现在很乱”“不知道怎么办”“帮我理一理”“我卡住了”。",
    "局面里同时混着目标、限制、情绪和执行问题，需要先找主导矛盾。",
    "用户需要有人一起思考，而不是直接听一堆标准答案。",
    "如果用户其实只是要给任务排先后，优先转到 `priority-judge`。",
    "如果用户已经有明确方案，只想做压力测试，转到 `grill-me`。",
    "如果用户想通过被提问来自己发现答案，转到 [socratic-teaching](references/socratic-teaching.md)。",
  ],
  constraints: [
    "严格按 5 个阶段推进：信息获取 → 锁定核心问题 → 拆解卡点 → 共创解法 → 落地计划。",
    "在锁定核心问题前，不允许直接给方案；在信息获取阶段，只提问、不抢答。",
    "每轮最多问 1-3 个高价值问题，优先澄清目标、约束、已尝试路径。",
    "用户补充新信息时，要判断它是会改变结论的信号，还是执行层面的噪音。",
    "当用户被细节带偏时，要明确指出“这是次要问题”，并把对话拉回核心。",
    "如果判断被新证据推翻，必须直接修正，不要硬撑原结论。",
  ],
  checklist: [
    "是否已经明确当前所处阶段。",
    "是否拿到了目标、约束、已尝试路径三类基础信息。",
    "是否说清“为什么这个才是核心问题”。",
    "是否把表面现象和根因分开。",
    "是否把方案压缩到 1-2 条主路径。",
    "是否明确了“做什么”和“不做什么”。",
  ],
  relatedSkills: [
    {
      get id() {
        return grillMeSkill.id;
      },
      reason: "如果用户已经有明确方案，只想做压力测试，转到 `grill-me`。",
    },
    {
      get id() {
        return priorityJudgeSkill.id;
      },
      reason: "如果用户其实只是要给任务排先后，优先转到 `priority-judge`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "一上来就给答案",
      pass: "先问后答",
    }),
    defineAntiPattern({
      fail: "被质疑立刻退让",
      pass: "有条件修正",
    }),
    defineAntiPattern({
      fail: "意图错配",
      pass: "先复述目标和决策点，再选择提问、反驳或共创模式。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "阶段 1 信息获取：每轮最多问 1-3 个高价值问题，确认目标、约束、已尝试路径和最卡的一步。",
      "阶段 2 锁定核心问题：说明真正卡住的不是表面 X 而是 Y，并给出为什么 Y 决定后续问题。",
      "阶段 3 拆解卡点：把表面现象、中层障碍和根因分开；新信息能推翻判断时直接修正。",
      "阶段 4/5 共创解法与落地计划：压缩到 1-2 条主路径，明确先做什么、暂不做什么和下次复盘点。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "当前阶段、已确认目标/约束/尝试路径和核心问题判断。",
      "表面现象、中层障碍、根因和会改变结论的关键信号。",
      "1-2 条主路径、本周行动、暂不做事项和复盘点。",
    ],
  }),
  references: [
    defineReference({
      id: "socratic-teaching",
      source: new URL("./references/socratic-teaching.md", import.meta.url),
      target: "references/socratic-teaching.md",
      title: "socratic-teaching.md",
      summary: "苏格拉底式提问教学法指南，通过提问引导对方自己发现答案。",
      loadWhen: "需要转向提问模式引导用户自己理清思路而非直接给答案时读取。",
    }),
  ],
});
