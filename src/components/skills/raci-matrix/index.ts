import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const raciMatrixSkill = defineSkill({
  id: "raci-matrix",
  fullName: "RACI 责任矩阵",
  description: "当用户要用 RACI/RASCI 明确角色分工、职责归属、审批流程或责任矩阵时使用。",
  useCases: [
    "新项目启动时明确\"谁负责、谁审批、咨询谁、通知谁\"。",
    "解决\"这件事没人管\"或\"这件事太多人管\"的问题。",
    "与 [running-decision-processes](../running-decision-processes/SKILL.md) 配合：RACI 定角色，决策流程定方法。",
  ],
  constraints: [
    "**每个任务只能有一个 A（Accountable）**——这是 RACI 最硬的规则。多个 A = 无人负责。",
    "R 可以多个（执行者），C 每任务不超过 3 个（否则决策变慢），I 是单向通知不需征求意见。",
    "健康检查要关注：某人 A 太多（瓶颈）、某行无 A（失控）、C 过多（决策慢）、某人无角色（冗余）。",
    "**RACI 是活文档不是一次性表格**：组织变动、人员变动时必须更新，过期的 RACI 比没有更危险（以为有人管但其实没人管）。",
    "**跨部门任务的 A 最难定**：默认放在对结果最有利害关系的人身上，不是级别最高的人。级别高但不 care 的 A = 形同虚设。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
