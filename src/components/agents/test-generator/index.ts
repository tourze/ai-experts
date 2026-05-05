import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  defineAgentWorkflow,
  defineAgentWorkflowStep,
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
  workflow: defineAgentWorkflow({
    direction: "TD",
    steps: [
      defineAgentWorkflowStep({
        id: "step-1",
        label: "先确认用户目标、输入范围、约束和验收标准。",
      }),
      defineAgentWorkflowStep({
        id: "step-2",
        label: "读取相关文件、配置、调用点和同层模式，建立证据链。",
      }),
      defineAgentWorkflowStep({
        id: "step-3",
        label: "按安全性、正确性、影响面和执行成本排序输出。",
      }),
    ],
  }),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "测试计划：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "模块分析",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "测试用例",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "测试文件位置",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "生成结果",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "限制",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 只用于只读探测、版本查询、git 历史、文件统计或本 agent 明确允许的运行时检查。禁止安装依赖、删除/移动文件、运行破坏性命令，除非本文件在特定场景中明确允许。",
  ],
  qualityStandards: [
    "每个测试必须有明确断言。",
    "每个公共函数至少覆盖 happy path、edge case 和 error case。",
    "严格匹配项目现有测试风格。",
    "不可测代码要在计划中指出原因。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Write, KnownTool.Edit, KnownTool.Bash],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: testDrivenDevelopmentSkill.id,
      mode: SkillUseMode.Preload,
      reason: "以 TDD 流程驱动测试先行设计。",
    },
    {
      id: testingStrategySkill.id,
      mode: SkillUseMode.Preload,
      reason: "选择合适的测试分层与覆盖策略。",
    },
    {
      id: testQualityReviewSkill.id,
      mode: SkillUseMode.Preload,
      reason: "自检生成测试的质量与断言充分性。",
    },
    {
      id: webappTestingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "覆盖 Web 应用端到端与集成测试场景。",
    },
    {
      id: benchmarkRunnerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "为性能敏感模块生成基准测试。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保测试计划中每条覆盖声明可溯源。",
    }
  ],
});
