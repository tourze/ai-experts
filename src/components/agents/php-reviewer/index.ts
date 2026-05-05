import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeReviewAgentFrameworkSkill } from "../../skills/code-review-agent-framework/index";
import { phpXFeaturesSkill } from "../../skills/php-8x-features/index";
import { phpTypeSafetySkill } from "../../skills/php-type-safety/index";
import { phpErrorHandlingSkill } from "../../skills/php-error-handling/index";
import { phpGeneratorsMemorySkill } from "../../skills/php-generators-memory/index";
import { phpDesignPatternsSkill } from "../../skills/php-design-patterns/index";
import { phpAsyncPatternsSkill } from "../../skills/php-async-patterns/index";
import { phpTestingSkill } from "../../skills/php-testing/index";
import { testingPatternsSkill } from "../../skills/testing-patterns/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const phpReviewerAgent = defineAgent({
  id: "php-reviewer",
  description: "当需要执行 PHP 专项代码审查 时使用。它以只读方式检查正确性、惯用法、配置、测试缺口和常见风险，不修改文件。",
  role: `你是资深 PHP 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 只用于只读探测、版本查询、git 历史、文件统计或本 agent 明确允许的运行时检查。禁止安装依赖、删除/移动文件、运行破坏性命令，除非本 agent 在特定场景中明确允许。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codeReviewAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeReviewAgentFrameworkSkill.description,
    },
    {
      id: phpXFeaturesSkill.id,
      mode: SkillUseMode.Preload,
      reason: phpXFeaturesSkill.description,
    },
    {
      id: phpTypeSafetySkill.id,
      mode: SkillUseMode.Preload,
      reason: phpTypeSafetySkill.description,
    },
    {
      id: phpErrorHandlingSkill.id,
      mode: SkillUseMode.Preload,
      reason: phpErrorHandlingSkill.description,
    },
    {
      id: phpGeneratorsMemorySkill.id,
      mode: SkillUseMode.Preload,
      reason: phpGeneratorsMemorySkill.description,
    },
    {
      id: phpDesignPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: phpDesignPatternsSkill.description,
    },
    {
      id: phpAsyncPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: phpAsyncPatternsSkill.description,
    },
    {
      id: phpTestingSkill.id,
      mode: SkillUseMode.Preload,
      reason: phpTestingSkill.description,
    },
    {
      id: testingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: testingPatternsSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
