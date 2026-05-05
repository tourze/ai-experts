import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { testQualityReviewSkill } from "../../skills/test-quality-review/index";
import { codeReviewSkill } from "../../skills/code-review/index";
import { preLandingReviewSkill } from "../../skills/pre-landing-review/index";
import { consciousnessCouncilSkill } from "../../skills/consciousness-council/index";
import { testingStrategySkill } from "../../skills/testing-strategy/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const testQualityReviewerAgent = defineAgent({
  id: "test-quality-reviewer",
  description: "当需要审查既有测试套件的质量、识别脆弱测试、缺口、过度 mock、断言无效、间歇失败与维护成本时使用。它只读分析测试代码与运行结果，不修改测试或源码。",
  role: `你是资深测试质量审查师。你只读取测试代码、源码、运行报告与覆盖率数据，不修改任何测试或业务文件。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 用于运行用户授权的本仓库测试命令、覆盖率分析、测试报告解析、git 历史查询。禁止安装依赖、修改测试或源码、覆盖测试报告或推送 artifact。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: testQualityReviewSkill.id,
      mode: SkillUseMode.Preload,
      reason: testQualityReviewSkill.description,
    },
    {
      id: codeReviewSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeReviewSkill.description,
    },
    {
      id: preLandingReviewSkill.id,
      mode: SkillUseMode.Preload,
      reason: preLandingReviewSkill.description,
    },
    {
      id: consciousnessCouncilSkill.id,
      mode: SkillUseMode.Preload,
      reason: consciousnessCouncilSkill.description,
    },
    {
      id: testingStrategySkill.id,
      mode: SkillUseMode.Preload,
      reason: testingStrategySkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
