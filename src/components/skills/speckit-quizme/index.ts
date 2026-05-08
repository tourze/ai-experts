import {
  InvocationPolicy,
  Platform,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";

export const speckitQuizmeSkill = defineSkill({
  id: "speckit-quizme",
  fullName: "Speckit Quizme",
  description: "当用户要用苏格拉底式追问挑战规格、挖掘隐含假设、边界场景或薄弱需求时使用。",
  useCases: [
    "当用户要用苏格拉底式追问挑战规格、挖掘隐含假设、边界场景或薄弱需求时使用。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "读取当前 `spec.md`（若有 `plan.md` 也读取）。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: `识别典型薄弱区：
   - 快乐路径偏置
   - 状态竞争与重复提交
   - 权限与越权边界
   - 异常链路与补偿策略`,
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "逐条提出 3-5 个场景问题（一次一个）。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "基于用户回答继续追问，直到可落地。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "经用户同意后，把结论写入 `Edge Cases`/`Requirements`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "已覆盖场景数",
      "新增需求条目",
      "仍待决策项",
    ],
  }),
});
