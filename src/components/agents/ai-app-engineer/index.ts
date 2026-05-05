import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index.js";
import { llmAppDesignPipelineSkill } from "../../skills/llm-app-design-pipeline/index.js";
import { llmAppDiagnosisFrameworkSkill } from "../../skills/llm-app-diagnosis-framework/index.js";
import { promptEngineeringPatternsSkill } from "../../skills/prompt-engineering-patterns/index.js";
import { llmEvaluationSkill } from "../../skills/llm-evaluation/index.js";
import { modelFirstReasoningSkill } from "../../skills/model-first-reasoning/index.js";
import { ragAuditorSkill } from "../../skills/rag-auditor/index.js";
import { embeddingStrategiesSkill } from "../../skills/embedding-strategies/index.js";
import { similaritySearchPatternsSkill } from "../../skills/similarity-search-patterns/index.js";
import { vectorIndexTuningSkill } from "../../skills/vector-index-tuning/index.js";

export const aiAppEngineerAgent = defineAgent({
  id: "ai-app-engineer",
  description: "当需要设计、审查或优化基于 LLM 的应用，覆盖 prompt 工程、检索增强、向量索引、embedding 选型与离线效果评估时使用。它可以读源码、写离线 eval 与 prompt 草稿，但不修改业务推理逻辑。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: llmAppDesignPipelineSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: llmAppDiagnosisFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: promptEngineeringPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: llmEvaluationSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: modelFirstReasoningSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: ragAuditorSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: embeddingStrategiesSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: similaritySearchPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: vectorIndexTuningSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
