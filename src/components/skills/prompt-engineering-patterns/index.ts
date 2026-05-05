import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";
import { llmEvaluationSkill } from "../llm-evaluation/index";
import { ragAuditorSkill } from "../rag-auditor/index";

export const promptEngineeringPatternsSkill = defineSkill({
  id: "prompt-engineering-patterns",
  fullName: "prompt-engineering-patterns",
  description: "当用户要设计、优化、约束或排查生产 prompt、few-shot 示例、系统 prompt、结构化响应契约或 prompt 变体实验时使用。",
  useCases: [
    "需要给生产环境 LLM 设计稳健 prompt，而不是临时试几句。",
    "需要解决结构化输出、few-shot、角色设定、错误恢复、长上下文约束。",
    "需要跑完整的 prompt 诊断与优化流程：拆出目标、失败模式、候选变体、评分标准、测试集。",
    "相关资源：[assets/prompt-template-library.md](assets/prompt-template-library.md)、[assets/few-shot-examples.json](assets/few-shot-examples.json)、[scripts/optimize-prompt.mjs](scripts/optimize-prompt.mjs)。",
    "系统化诊断参考文件：[references/prompt-patterns.md](references/prompt-patterns.md)、[references/evaluation-metrics.md](references/evaluation-metrics.md)、[references/failure-modes.md](references/failure-modes.md)、[references/output-constraints.md](references/output-constraints.md)。",
  ],
  constraints: [
    "先明确输出契约，再写自然语言提示；没有 schema 的 prompt 很难稳定。",
    "few-shot 示例必须与真实任务同分布，示例越多不代表越好。",
    "Chain-of-thought 只在确实提升正确率时启用；不要把它当默认万能药。",
    "变体实验必须结构化对比：一次只改一个主变量（指令清晰度、示例策略、输出约束）。",
    "评分 rubric 必须包含硬约束和软约束，不要只有\"感觉更好\"。",
    "如果问题本质在检索、数据或工具链，而不是 prompt，本 skill 只负责识别，不负责掩盖。",
  ],
  checklist: [
    "输出格式是否有明确 schema 或字段定义。",
    "是否给了足够但不过量的示例（3-5 个：主路径 + 边界 + 易混淆反例）。",
    "prompt 是否包含边界条件、拒答规则、异常输入处理方式。",
    "当前 prompt 的失败模式是否已经分类，而不是只收集了零散 bad case。",
    "变体之间是否真正可比较（一次一变量）。",
  ],
  relatedSkills: [
    {
      get id() {
        return ragAuditorSkill.id;
      },
      reason: "如果 prompt 绑定 RAG，上下游检索问题是否已经交给 `rag-auditor`。",
    },
    {
      get id() {
        return llmEvaluationSkill.id;
      },
      reason: "相关 skill：`llm-evaluation`、`rag-auditor`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "话术堆砌后临时补 JSON",
      pass: "Schema 优先 + 简洁指令",
    }),
    defineAntiPattern({
      fail: "小问题大流程",
      pass: "任务匹配深度（见上文\"按任务复杂度选粒度\"）",
    }),
    defineAntiPattern({
      fail: "同时改三个变量",
      pass: "一次一变量",
    }),
    defineAntiPattern({
      fail: "模型上限误判为 prompt 问题",
      pass: "先确认天花板",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scriptRoots: [
    defineSkillScriptRoot({
      source: new URL("./scripts/", import.meta.url),
      target: "scripts",
    }),
  ],
  scripts: [
    defineSkillScript({
      id: "optimize-prompt",
      entry: new URL("./scripts/optimize-prompt.mjs", import.meta.url),
      target: "scripts/optimize-prompt.mjs",
      runtime: "node",
      bundle: false,
      description: "Script optimize-prompt.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "chain-of-thought",
      source: new URL("./references/chain-of-thought.md", import.meta.url),
      target: "references/chain-of-thought.md",
      title: "chain-of-thought.md",
      summary: "Reference material for prompt-engineering-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evaluation-metrics",
      source: new URL("./references/evaluation-metrics.md", import.meta.url),
      target: "references/evaluation-metrics.md",
      title: "evaluation-metrics.md",
      summary: "Reference material for prompt-engineering-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "failure-modes",
      source: new URL("./references/failure-modes.md", import.meta.url),
      target: "references/failure-modes.md",
      title: "failure-modes.md",
      summary: "Reference material for prompt-engineering-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "few-shot-learning",
      source: new URL("./references/few-shot-learning.md", import.meta.url),
      target: "references/few-shot-learning.md",
      title: "few-shot-learning.md",
      summary: "Reference material for prompt-engineering-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "output-constraints",
      source: new URL("./references/output-constraints.md", import.meta.url),
      target: "references/output-constraints.md",
      title: "output-constraints.md",
      summary: "Reference material for prompt-engineering-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "prompt-optimization",
      source: new URL("./references/prompt-optimization.md", import.meta.url),
      target: "references/prompt-optimization.md",
      title: "prompt-optimization.md",
      summary: "Reference material for prompt-engineering-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "prompt-patterns",
      source: new URL("./references/prompt-patterns.md", import.meta.url),
      target: "references/prompt-patterns.md",
      title: "prompt-patterns.md",
      summary: "Reference material for prompt-engineering-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "prompt-templates",
      source: new URL("./references/prompt-templates.md", import.meta.url),
      target: "references/prompt-templates.md",
      title: "prompt-templates.md",
      summary: "Reference material for prompt-engineering-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "system-prompts",
      source: new URL("./references/system-prompts.md", import.meta.url),
      target: "references/system-prompts.md",
      title: "system-prompts.md",
      summary: "Reference material for prompt-engineering-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
  assets: [
    defineAsset({
      id: "few-shot-examples",
      source: new URL("./assets/few-shot-examples.json", import.meta.url),
      target: "assets/few-shot-examples.json",
    }),
    defineAsset({
      id: "prompt-template-library",
      source: new URL("./assets/prompt-template-library.md", import.meta.url),
      target: "assets/prompt-template-library.md",
    })
  ],
});
