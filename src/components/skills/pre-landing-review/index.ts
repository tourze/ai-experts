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
import { procedureUse, preLandingReviewCollectDiff, preLandingReviewRenderReport } from "../../procedures/index";

import { testingStrategySkill } from "../testing-strategy/index";

export const preLandingReviewSkill = defineSkill({
  id: "pre-landing-review",
  fullName: "落地前审查",
  description: "当用户需要判断代码是否可以合并或上线时使用。适用于 pre-merge review、gate check、上线前安全检查等请求。",
  useCases: [
    "用户要判断当前分支或指定 diff 是否可以合并。",
    "关注的是“会不会出事故”，不是一般性的代码美学讨论。",
    "需要围绕数据安全、并发、信任边界、测试缺口做阻断级判断。",
    "需要给出 `CLEAR TO LAND` 或 `BLOCKED` 的门禁结论。",
  ],
  constraints: [
    "**违反字面规则 = 违反规则精神。不存在”灵活变通”。**",
    "默认只读；除非用户明确要求”直接修”，否则先给审查结论。",
    "必须基于真实 diff，而不是凭目录猜风险。",
    "必须先读取 `checklist` reference，并在执行前读取 `discipline-guard` reference。",
    "所有问题按两级输出：\n- 阻断项：不解决或不确认风险，不能放行\n- 建议项：不阻断，但要记录",
    "每个阻断项都要给用户明确三选一：\n- `立即修复`\n- `确认风险`\n- `误报`",
  ],
  checklist: [
    "是否已读取实际 diff、检查清单和 discipline-guard，并报告证据来源？",
    "阻断项和建议项是否已分开，并说明分级理由？",
    "每个阻断项是否都有文件位置、具体风险、触发条件和证据？",
    "是否已提示用户对每个阻断项选择 `立即修复`、`确认风险` 或 `误报`？",
    "结论是否明确为 `CLEAR TO LAND` 或 `BLOCKED`，并列出未验证项？",
    "是否没有把普通代码风格问题误报成阻断项？",
  ],
  relatedSkills: [
    {
      get skill() {
        return testingStrategySkill;
      },
      reason: "需要与 `testing-strategy` 配合，决定哪些风险必须补测后才能放行。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "不看 diff 泛泛",
      pass: "基于 diff 的具体阻断",
    }),
    defineAntiPattern({
      fail: "命名当阻断",
      pass: "风险分级",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先读取 checklist 和 discipline-guard；没有实际 diff 和验证命令，不得声称可以落地。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "调用 pre-landing-review-collect-diff 锁定审查范围，得到 files、numstat 和 stat JSON。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "人工判断每个变更点的 severity、阻断/建议属性、文件位置、风险证据和缺失验证。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "每个阻断项都给用户三选一：立即修复、确认风险、误报；建议项不阻断但必须记录。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "调用 pre-landing-review-render-report 把 findings JSON 渲染成阻断项/建议项/门禁结论的标准报告。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "审查范围、真实 diff 摘要、读取的 checklist/discipline-guard 和执行过的验证命令。",
      "阻断项、建议项、文件位置、具体风险、证据、用户三选一处理方式。",
      "`CLEAR TO LAND` 或 `BLOCKED` 结论，以及必须补测或需要 testing-strategy 联动的风险。",
    ],
  }),
  procedures: [
    procedureUse(preLandingReviewCollectDiff, {
      label: "收集 diff 元信息",
      when: "需要获取当前分支与 origin/main 的 diff 文件列表和行数统计时。",
      reason: "输出结构化 JSON 变更范围，避免手写 git diff 命令解析文件列表和行数。",
    }),
    procedureUse(preLandingReviewRenderReport, {
      label: "渲染审查报告",
      when: "已有结构化 findings JSON，需要生成标准格式的落地前审查 Markdown 报告时。",
      reason: "统一输出阻断项/建议项/门禁结论格式，确保审查结果可读可审计。",
    }),
  ],
  references: [
    defineReference({
      id: "checklist",
      source: new URL("./references/checklist.md", import.meta.url),
      target: "references/checklist.md",
      title: "checklist.md",
      summary: "落地前审查的完整检查清单，覆盖数据安全、并发、信任边界等阻断项。",
      loadWhen: "进行代码合并或上线审查时必须先读取此检查清单。",
    }),
    defineReference({
      id: "discipline-guard",
      source: new URL("./references/discipline-guard.md", import.meta.url),
      target: "references/discipline-guard.md",
      title: "discipline-guard.md",
      summary: "落地前审查的纪律守卫机制，防止审查走形式或遗漏关键风险。",
      loadWhen: "需要确保审查过程不走过场、严格执行检查纪律时读取。",
    }),
    defineReference({
      id: "scripts-workflow",
      source: new URL("./references/scripts-workflow.md", import.meta.url),
      target: "references/scripts-workflow.md",
      title: "scripts-workflow.md",
      summary: "落地前审查脚本的工作流程说明，包括 diff 收集和报告生成。",
      loadWhen: "需要理解或修改 pre-landing-review 脚本的工作流程时读取。",
    }),
  ],
});
