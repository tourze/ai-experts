import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { llmAppDesignPipelineSkill } from "../llm-app-design-pipeline/index";
import { llmEvaluationSkill } from "../llm-evaluation/index";
import { promptEngineeringPatternsSkill } from "../prompt-engineering-patterns/index";
import { ragAuditorSkill } from "../rag-auditor/index";

export const llmAppDiagnosisFrameworkSkill = defineSkill({
  id: "llm-app-diagnosis-framework",
  fullName: "LLM 应用诊断框架",
  description:
    "当需要系统化诊断 LLM 应用问题（幻觉/检索失配/指令对抗/token 超限/过度引用）、区分 model-first 与 prompt-first 适用边界、或建立 eval-first 改进闭环时使用。与 llm-app-design-pipeline 互补：后者给设计流程，本 skill 给诊断方法与决策框架。",
  useCases: [
    "LLM 应用出现质量问题但不确定问题在哪一层",
    "需要判断用 model-first（让模型拆步骤）还是 prompt-first（人工设计 chain）",
    '需要建立"先补 eval → 再改 prompt/检索"的改进闭环',
    "prompt 改了很多轮但没有系统衡量效果",
  ],
  constraints: [
    "Eval-first：没有可复现 eval case，不允许声称改动让系统更好。",
    "不跨层归因：输入、检索、推理、输出各层问题必须在对应层修复。",
    "每条改动都要可证伪，绑定 eval case、baseline、目标分数和可能变差的场景。",
    "Model-first 与 prompt-first 决策必须有样例实验支撑，不能凭偏好选架构。",
  ],
  checklist: [
    '问题定位到了具体层（输入/检索/推理/输出），不是笼统的"效果不好"。',
    "model-first vs prompt-first 决策有 10 case 实验支撑。",
    "每条改动有绑定的 eval case 和 baseline 对比方法。",
    "不同层的问题在对应层修复，不跨层打补丁。",
    "检索调参同时报告召回、延迟、内存/成本三角数据。",
  ],
  relatedSkills: [
    {
      get id() {
        return promptEngineeringPatternsSkill.id;
      },
      reason: "诊断结果落到 prompt 模板、输出约束、few-shot 或失败模式修复时联动。",
    },
    {
      get id() {
        return llmEvaluationSkill.id;
      },
      reason: "需要设计离线 eval、case 集、评分 rubric 或 baseline 对比时联动。",
    },
    {
      get id() {
        return ragAuditorSkill.id;
      },
      reason: "问题落在 chunking、embedding、混合检索、rerank、top-k 或引用对齐时联动。",
    },
    {
      get id() {
        return llmAppDesignPipelineSkill.id;
      },
      reason: "需要从诊断回到 LLM 应用五步设计流程、重建需求和架构时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "prompt 盲改：改了很多轮但没有 eval 和 baseline。",
      pass: "先补 eval case，再把每个改动绑定到可证伪假设。",
    }),
    defineAntiPattern({
      fail: "跨层打补丁：检索漏文档却继续加 prompt 约束。",
      pass: "定位到输入/检索/推理/输出具体层，再在对应层修复。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先设计可复现离线 eval case，记录 baseline；没有 eval 不评价改动优劣。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "按输入侧、检索、推理、输出侧四层排查：输入字段/上下文、chunking/embedding/rerank、工具/温度/示例、引用/parser/max_tokens/guardrails。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "每个问题只在对应层修复，检索失败不写成 prompt 问题，幻觉不写成 embedding 问题。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "Model-first vs prompt-first 用 10 个 case 决策：单 prompt 拆解正确且无关键步骤跳过达到 8 个以上，保留 model-first；否则对失败 case 设计 chain。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "建立改动队列：改动、假设、绑定 eval case、baseline 对比、目标分数和风险场景。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "检索调参同时报告召回、延迟、内存/成本，不只看回答主观质量。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "四层诊断表：输入、检索、推理、输出侧信号、检查点、证据和归因。",
      "Model-first vs prompt-first 决策、10 case 结果、失败模式和选择理由。",
      "改动队列：改动、假设、绑定 eval、baseline→目标、风险和验证结果。",
    ],
  }),
});
