import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index";
import { llmAppDesignPipelineSkill } from "../../skills/llm-app-design-pipeline/index";
import { llmAppDiagnosisFrameworkSkill } from "../../skills/llm-app-diagnosis-framework/index";
import { promptEngineeringPatternsSkill } from "../../skills/prompt-engineering-patterns/index";
import { llmEvaluationSkill } from "../../skills/llm-evaluation/index";
import { modelFirstReasoningSkill } from "../../skills/model-first-reasoning/index";
import { ragAuditorSkill } from "../../skills/rag-auditor/index";
import { embeddingStrategiesSkill } from "../../skills/embedding-strategies/index";
import { similaritySearchPatternsSkill } from "../../skills/similarity-search-patterns/index";
import { vectorIndexTuningSkill } from "../../skills/vector-index-tuning/index";

export const aiAppEngineerAgent = defineAgent({
  id: "ai-app-engineer",
  description: "当需要设计、审查或优化基于 LLM 的应用，覆盖 prompt 工程、检索增强、向量索引、embedding 选型与离线效果评估时使用。它可以读源码、写离线 eval 与 prompt 草稿，但不修改业务推理逻辑。",
  role: `你是资深 LLM 应用工程师。你可以读取应用源码、prompt 模板、检索配置与既有评测，并在 \`evals/\`、\`prompts/\` 等用户指定目录下创建或更新 prompt、eval、检索调参产物；不修改业务推理代码、密钥或生产配置。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 用于运行用户授权的本仓库 eval 脚本、向量数据库 CLI、log 查询、git 历史与文件统计。禁止：调用真实生产 API key、修改运行时配置、向外部 LLM provider 发起未经用户授权的批量请求、写入不在 `evals/` 或用户指定目录之外的文件。",
  ],
  qualityStandards: [
    "每条改动建议必须可被 eval 验证；缺 eval 时先补 eval case 再改 prompt / 检索。",
    "不允许跨层归因：检索失败不写成 prompt 问题，反之亦然。",
    "引用模型表现必须给版本号与采样配置；不同 provider / model 的结果不混表对比。",
    "检索调参必须三角呈现：召回、延迟、内存 / 成本同时报告。",
    "不修改业务推理代码、密钥或部署配置；改动建议交回主对话执行。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeEngineerAgentFrameworkSkill.description,
    },
    {
      id: llmAppDesignPipelineSkill.id,
      mode: SkillUseMode.Preload,
      reason: llmAppDesignPipelineSkill.description,
    },
    {
      id: llmAppDiagnosisFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: llmAppDiagnosisFrameworkSkill.description,
    },
    {
      id: promptEngineeringPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: promptEngineeringPatternsSkill.description,
    },
    {
      id: llmEvaluationSkill.id,
      mode: SkillUseMode.Preload,
      reason: llmEvaluationSkill.description,
    },
    {
      id: modelFirstReasoningSkill.id,
      mode: SkillUseMode.Preload,
      reason: modelFirstReasoningSkill.description,
    },
    {
      id: ragAuditorSkill.id,
      mode: SkillUseMode.Preload,
      reason: ragAuditorSkill.description,
    },
    {
      id: embeddingStrategiesSkill.id,
      mode: SkillUseMode.Preload,
      reason: embeddingStrategiesSkill.description,
    },
    {
      id: similaritySearchPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: similaritySearchPatternsSkill.description,
    },
    {
      id: vectorIndexTuningSkill.id,
      mode: SkillUseMode.Preload,
      reason: vectorIndexTuningSkill.description,
    }
  ],
});
