import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { runningDecisionProcessesSkill } from "../running-decision-processes/index";

export const raciMatrixSkill = defineSkill({
  id: "raci-matrix",
  fullName: "RACI 责任矩阵",
  description: "当用户要用 RACI/RASCI 明确角色分工、职责归属、审批流程或责任矩阵时使用。",
  useCases: [
    "新项目启动时明确\"谁负责、谁审批、咨询谁、通知谁\"。",
    "解决\"这件事没人管\"或\"这件事太多人管\"的问题。",
    "与 `running-decision-processes` 配合：RACI 定角色，决策流程定方法。",
  ],
  constraints: [
    "**每个任务只能有一个 A（Accountable）**——这是 RACI 最硬的规则。多个 A = 无人负责。",
    "R 可以多个（执行者），C 每任务不超过 3 个（否则决策变慢），I 是单向通知不需征求意见。",
    "健康检查要关注：某人 A 太多（瓶颈）、某行无 A（失控）、C 过多（决策慢）、某人无角色（冗余）。",
    "**RACI 是活文档不是一次性表格**：组织变动、人员变动时必须更新，过期的 RACI 比没有更危险（以为有人管但其实没人管）。",
    "**跨部门任务的 A 最难定**：默认放在对结果最有利害关系的人身上，不是级别最高的人。级别高但不 care 的 A = 形同虚设。",
    "不适用场景：极度扁平组织（< 10 人、全员全栈）角色边界模糊是特性不是 bug，RACI 会引入不必要的官僚。",
  ],
  checklist: [
    "每行有且仅有一个 A。",
    "没有\"无人负责\"的空行。",
    "没有人在所有任务上都是 A（权力过于集中）。",
    "C 的数量合理（每任务不超过 3 个）。",
  ],
  relatedSkills: [
    {
      get id() {
        return runningDecisionProcessesSkill.id;
      },
      reason: "与 `running-decision-processes` 配合：RACI 定角色，决策流程定方法。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "所有人都是 R",
      pass: "职责明确",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "把任务、决策和角色整理成 RACI 责任矩阵，消除无人负责、多人审批和协作过载的问题。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先列出需要明确职责的任务、决策或流程节点，并确认参与角色而不是具体人名。",
      "为每行分配 R/A/C/I：R 可多个，A 必须且只能一个，C 控制在必要少数，I 只接收通知。",
      "逐行检查：是否无 A、多个 A、所有人都是 R、C 过多或关键角色缺席。",
      "纵向检查角色负载：谁 A 太多形成瓶颈，谁长期无角色，谁在跨部门事项里缺少结果责任。",
      "对跨部门任务，把 A 放给最关心结果且能推动结果的人，而不是默认给职级最高者。",
      "定义更新触发条件：组织调整、人员变动、流程变化或关键职责争议。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "任务/决策 × 角色的 RACI 表。",
      "矩阵健康检查问题：无 A、多 A、C 过多、瓶颈角色和冗余角色。",
      "职责冲突或协作断点的修复建议。",
      "RACI 更新规则和责任人。",
    ],
  }),
  tools: [],
});
