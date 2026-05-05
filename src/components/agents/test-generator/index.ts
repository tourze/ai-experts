import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { testDrivenDevelopmentSkill } from "../../skills/test-driven-development/index.js";
import { testingStrategySkill } from "../../skills/testing-strategy/index.js";
import { testQualityReviewSkill } from "../../skills/test-quality-review/index.js";
import { webappTestingSkill } from "../../skills/webapp-testing/index.js";
import { benchmarkRunnerSkill } from "../../skills/benchmark-runner/index.js";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index.js";

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
      reason: "Declared by agent frontmatter.",
    },
    {
      id: testingStrategySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: testQualityReviewSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: webappTestingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: benchmarkRunnerSkill.id,
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
