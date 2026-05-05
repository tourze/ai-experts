import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
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
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "测试质量审查报告：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "范围摘要",
        body: "[模块 / 测试数量 / 框架 / 当前覆盖率 / 上次失败]",
      }),
      defineAgentOutputSection({
        title: "设计层问题",
        body: "[断言不足 / mock 过度 / 场景缺口 → 文件:行 → 修复方向]",
      }),
      defineAgentOutputSection({
        title: "执行层问题",
        body: "[间歇失败 / 慢测试 / 顺序耦合 → 证据]",
      }),
      defineAgentOutputSection({
        title: "维护层问题",
        body: "[重复结构 / 过时桩 / 命名 → 重构建议]",
      }),
      defineAgentOutputSection({
        title: "多视角摘要（六顶思考帽模式）",
        body: "[关键脆弱点 / 致命缺口 / 重构方向]",
      }),
      defineAgentOutputSection({
        title: "优先修复",
        body: "[问题 → 影响 → 修复成本 → 排序]",
      }),
      defineAgentOutputSection({
        title: "范围限制",
        body: "[未触达的测试层 / 模块 / 历史窗口]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 用于运行用户授权的本仓库测试命令、覆盖率分析、测试报告解析、git 历史查询。禁止安装依赖、修改测试或源码、覆盖测试报告或推送 artifact。",
  ],
  qualityStandards: [
    "区分「测试代码缺陷」与「待测代码缺陷」；不把生产代码 bug 算成测试质量问题。",
    "间歇失败必须给可重现假设和复现命令；否则只列为「需要进一步调查」。",
    "给 mock 替代方案时必须考虑测试运行成本，不强推「全部用真实依赖」。",
    "不修改测试或源码；改动建议交回主对话与 test-generator agent 执行。",
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
