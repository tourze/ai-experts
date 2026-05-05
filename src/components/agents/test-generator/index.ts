import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { testDrivenDevelopmentSkill } from "../../skills/test-driven-development/index";
import { testingStrategySkill } from "../../skills/testing-strategy/index";
import { testQualityReviewSkill } from "../../skills/test-quality-review/index";
import { webappTestingSkill } from "../../skills/webapp-testing/index";
import { benchmarkRunnerSkill } from "../../skills/benchmark-runner/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const testGeneratorAgent = defineAgent({
  id: "test-generator",
  description: "当需要为模块或函数生成测试套件时使用。它读取源码理解行为，设计 happy path、edge case 和 error scenario，并写入高质量测试文件。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Write, KnownTool.Edit, KnownTool.Bash],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: testDrivenDevelopmentSkill.id,
      mode: SkillUseMode.Preload,
      reason: testDrivenDevelopmentSkill.description,
    },
    {
      id: testingStrategySkill.id,
      mode: SkillUseMode.Preload,
      reason: testingStrategySkill.description,
    },
    {
      id: testQualityReviewSkill.id,
      mode: SkillUseMode.Preload,
      reason: testQualityReviewSkill.description,
    },
    {
      id: webappTestingSkill.id,
      mode: SkillUseMode.Preload,
      reason: webappTestingSkill.description,
    },
    {
      id: benchmarkRunnerSkill.id,
      mode: SkillUseMode.Preload,
      reason: benchmarkRunnerSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
