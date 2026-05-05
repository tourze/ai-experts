import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index";
import { webPerformanceDiagnosisSkill } from "../../skills/web-performance-diagnosis/index";
import { bundleOptimizationSkill } from "../../skills/bundle-optimization/index";
import { modernJavascriptPatternsSkill } from "../../skills/modern-javascript-patterns/index";
import { reactPerformanceSkill } from "../../skills/react-performance/index";
import { reactServerComponentsSkill } from "../../skills/react-server-components/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const webPerfEngineerAgent = defineAgent({
  id: "web-perf-engineer",
  description: "当需要诊断或优化 web 前端性能，包括 Core Web Vitals (LCP / INP / CLS)、bundle 体积、浏览器渲染、JS 热路径、React 渲染或 React Server Components 优化时使用。它只读分析，不修改业务代码。",
  role: `你是资深 Web 前端性能工程师。你只读取构建产物、性能 trace、源码与配置做分析，不修改业务代码或运行 production 部署。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "前端性能报告：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "性能预算与现状",
        body: "[预算 / RUM 基线 / lab 基线 / 设备分布]",
      }),
      defineAgentOutputSection({
        title: "网络层发现",
        body: "[关键资源、优先级、字体、图像、缓存]",
      }),
      defineAgentOutputSection({
        title: "渲染层发现",
        body: "[LCP / CLS / layout / paint / composite]",
      }),
      defineAgentOutputSection({
        title: "运行时发现",
        body: "[INP / 长任务 / 热路径 / Worker / scheduler]",
      }),
      defineAgentOutputSection({
        title: "Bundle 分析",
        body: "[route / 第三方 / 重复模块 / 可剥离项]",
      }),
      defineAgentOutputSection({
        title: "React 渲染",
        body: "[re-render 热点 / context / SC 数据瀑布 / 结构性建议]",
      }),
      defineAgentOutputSection({
        title: "优先修复",
        body: "[按用户可见影响 × 修复成本排序]",
      }),
      defineAgentOutputSection({
        title: "验证方法",
        body: "[每条修复绑定的 trace / lab / RUM 验证方式]",
      }),
      defineAgentOutputSection({
        title: "范围限制",
        body: "[未触达的路由 / 设备 / 场景]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 用于运行用户授权的本仓库构建 / 分析命令（`vite build`、`next build`、`webpack-bundle-analyzer`、`lighthouse`、`source-map-explorer`），读取 stats、trace、性能 log。禁止安装依赖、修改构建配置、对生产域跑高负载脚本或 push 监测数据。",
  ],
  qualityStandards: [
    "区分 lab 数据（lighthouse / synthetic）与 RUM 数据（真实用户），结论中显式标注口径。",
    "不混层归因：网络问题不写成 React 问题、CSS 问题不写成 JS 问题。",
    "给出修复成本估计与可逆性，避免「重构整个 bundle」类不可执行建议。",
    "不修改业务代码或构建配置；改动建议带具体位置与样例代码片段。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeEngineerAgentFrameworkSkill.description,
    },
    {
      id: webPerformanceDiagnosisSkill.id,
      mode: SkillUseMode.Preload,
      reason: webPerformanceDiagnosisSkill.description,
    },
    {
      id: bundleOptimizationSkill.id,
      mode: SkillUseMode.Preload,
      reason: bundleOptimizationSkill.description,
    },
    {
      id: modernJavascriptPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: modernJavascriptPatternsSkill.description,
    },
    {
      id: reactPerformanceSkill.id,
      mode: SkillUseMode.Preload,
      reason: reactPerformanceSkill.description,
    },
    {
      id: reactServerComponentsSkill.id,
      mode: SkillUseMode.Preload,
      reason: reactServerComponentsSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
