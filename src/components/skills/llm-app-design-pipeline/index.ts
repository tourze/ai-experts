import {
  InvocationPolicy,
  Platform,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const llmAppDesignPipelineSkill = defineSkill({
  id: "llm-app-design-pipeline",
  fullName: "LLM 应用设计 Pipeline",
  description: "当需要设计或优化基于 LLM 的应用时使用；提供从应用形态确认、逐段优化到 eval 验证的完整设计 pipeline。",
  useCases: [
    "新 LLM 应用（聊天机器人 / RAG / Agent / 内容生成）的架构设计。",
    "既有 LLM 应用的效果优化（准确率、延迟、成本、用户满意度）。",
    "Prompt 工程与检索策略的系统性调优。",
  ],
  constraints: [
    "不跳过 eval 就上线：无离线评估即盲目上线；每条改动绑定 eval case 与 baseline 对比方法。",
    "不做无对照优化：每次只改一个变量，否则无法归因。",
    "禁止跨层归因：检索失败不写成 prompt 问题，prompt 偏差不归因到 embedding。",
    "不忽视延迟和成本：准确率、延迟、成本三维权衡。",
    "检索调参不报单点指标：召回/延迟/内存三角缺一不可。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "Step 1 确认应用形态：单 Prompt、多步 Chain、RAG、Agent 或对话，并定义成功指标和目标值。",
      "成功指标覆盖任务通过率、引用准确率、人工偏好、延迟和成本。",
      "Step 2 按输入侧、检索、推理、输出四段逐一检查，不跨层归因。",
      "输入侧处理清洗、截断、意图识别、上下文窗口和多模态输入；RAG 检索处理切块、embedding、索引、top-k、metadata、rerank 和混合检索。",
      "推理层处理 prompt 结构、few-shot、CoT/ToT/ReAct、温度采样和模型选型；输出层处理 JSON/function/XML、schema 校验、格式修复、去重和引用标注。",
      "Step 3 设计离线 eval、在线 eval、A/B 和压力测试；rubric 至少覆盖正确性、完整性、安全性三个维度并有 1-5 分描述。",
      "Step 4 每轮只改一个变量，同一测试集对比，记录改动、假设、baseline、结果和 ROI。",
      "Step 5 上线准备覆盖延迟 SLA、fallback、缓存/队列、成本预算、token 熔断、内容安全、PII 脱敏和反馈队列。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "LLM 应用设计：应用形态、成功指标、目标值、输入→检索→推理→输出架构。",
      "各段设计决策：段、决策、理由、备选、绑定 eval case 和 baseline。",
      "评估与上线：测试集、rubric、优化计划、延迟 SLA、成本预算、安全过滤、监控和风险。",
    ],
  }),
});
