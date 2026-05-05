import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
