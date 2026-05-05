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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
