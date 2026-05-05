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
  role: `你是资深测试工程师。你可以在用户请求的交付范围内创建或更新文件，但不要修改无关源码、配置或用户数据。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 只用于只读探测、版本查询、git 历史、文件统计或本 agent 明确允许的运行时检查。禁止安装依赖、删除/移动文件、运行破坏性命令，除非本文件在特定场景中明确允许。",
  ],
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
