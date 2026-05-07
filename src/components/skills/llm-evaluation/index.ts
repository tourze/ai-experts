import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { promptEngineeringPatternsSkill } from "../prompt-engineering-patterns/index";
import { ragAuditorSkill } from "../rag-auditor/index";

export const llmEvaluationSkill = defineSkill({
  id: "llm-evaluation",
  fullName: "llm-evaluation",
  description: "当用户要评估 LLM 应用效果或比较 prompt、模型表现时使用。",
  useCases: [
    "需要回答“这个 LLM 应用到底有没有变好”，而不是只看单次样例。",
    "需要比较不同模型、不同 prompt、不同 agent 流程的质量差异。",
    "需要建立离线样本集、评分 rubric、回归报警与上线门槛。",
  ],
  constraints: [
    "先定义任务成功标准，再谈指标；没有目标函数的 evaluation 没有意义。",
    "自动指标、人工评审、LLM-as-judge 各有盲点，至少要两种视角交叉验证。",
    "回归测试必须使用冻结样本集，避免一边改题一边看分数。",
    "评估报告必须区分“统计显著”“业务显著”“可上线”三个层级。",
  ],
  checklist: [
    "样本集是否覆盖主路径、边界条件、失败样例和拒答样例。",
    "评分标准是否可复现，是否区分了硬约束和软偏好。",
    "是否保留了基线模型/基线 prompt 的分数用于对比。",
  ],
  relatedSkills: [
    {
      get id() {
        return ragAuditorSkill.id;
      },
      reason: "如果问题集中在检索链路，是否交给 `rag-auditor`。",
    },
    {
      get id() {
        return promptEngineeringPatternsSkill.id;
      },
      reason: "评测结果指向 prompt 结构、指令层次或输出格式问题时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "3 个样例替代 benchmark",
      pass: "冻结评测集 + 多指标",
    }),
    defineAntiPattern({
      fail: "只看平均分",
      pass: "按类别拆分",
    }),
    defineAntiPattern({
      fail: "样本集随版本改",
      pass: "冻结基线",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先定义任务成功标准和目标函数，再确定数据集、指标、rubric、硬约束和软偏好。",
      "冻结样本集，覆盖主路径、边界条件、失败样例和拒答样例；保留基线模型/prompt 分数。",
      "至少组合两种视角：自动指标、人工评审、LLM-as-judge 或规则断言；按类别拆分而不是只看平均分。",
      "报告区分统计显著、业务显著和可上线；RAG 检索链路问题转 rag-auditor，prompt 问题转 prompt-engineering-patterns。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "冻结评测集、指标、rubric、pass thresholds、基线分数和版本记录。",
      "按类别拆分的分数、失败样例、硬约束通过率、软偏好变化和显著性解释。",
      "上线门槛、回归报警、需人工复核点和下一轮 prompt/model/agent 修改建议。",
    ],
  }),
});
