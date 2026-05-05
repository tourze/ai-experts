import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { testQualityReviewSkill } from "../../skills/test-quality-review/index.js";
import { codeReviewSkill } from "../../skills/code-review/index.js";
import { preLandingReviewSkill } from "../../skills/pre-landing-review/index.js";
import { consciousnessCouncilSkill } from "../../skills/consciousness-council/index.js";
import { testingStrategySkill } from "../../skills/testing-strategy/index.js";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index.js";

export const testQualityReviewerAgent = defineAgent({
  id: "test-quality-reviewer",
  description: "当需要审查既有测试套件的质量、识别脆弱测试、缺口、过度 mock、断言无效、间歇失败与维护成本时使用。它只读分析测试代码与运行结果，不修改测试或源码。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: testQualityReviewSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: codeReviewSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: preLandingReviewSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: consciousnessCouncilSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: testingStrategySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
