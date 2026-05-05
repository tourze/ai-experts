import {
  AgentSandbox,
  defineAgent,
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
