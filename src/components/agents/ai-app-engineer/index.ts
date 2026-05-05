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
