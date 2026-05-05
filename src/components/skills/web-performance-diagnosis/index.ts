import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const webPerformanceDiagnosisSkill = defineSkill({
  id: "web-performance-diagnosis",
  fullName: "Web 性能诊断",
  description: "当用户要系统诊断 Web 前端性能瓶颈、修复或优化 Core Web Vitals（LCP/INP/CLS）、建立性能预算、做跨层（网络→渲染→运行时）性能分析、审计网站质量、消除请求瀑布流或解决 hydration/浏览器渲染模式问题时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scriptRoots: [
    defineSkillScriptRoot({
      source: new URL("./scripts/", import.meta.url),
      target: "scripts",
    }),
  ],
  scripts: [
    defineSkillScript({
      id: "analyze",
      entry: new URL("./scripts/analyze.mjs", import.meta.url),
      target: "scripts/analyze.mjs",
      runtime: "node",
      bundle: false,
      description: "Script analyze.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "anti-patterns",
      source: new URL("./references/anti-patterns.md", import.meta.url),
      target: "references/anti-patterns.md",
      title: "anti-patterns.md",
      summary: "Reference material for web-performance-diagnosis.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "cwv-patterns",
      source: new URL("./references/cwv-patterns.md", import.meta.url),
      target: "references/cwv-patterns.md",
      title: "cwv-patterns.md",
      summary: "Reference material for web-performance-diagnosis.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "diagnosis-detail",
      source: new URL("./references/diagnosis-detail.md", import.meta.url),
      target: "references/diagnosis-detail.md",
      title: "diagnosis-detail.md",
      summary: "Reference material for web-performance-diagnosis.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "lcp-optimization",
      source: new URL("./references/LCP-optimization.md", import.meta.url),
      target: "references/LCP-optimization.md",
      title: "LCP-optimization.md",
      summary: "Reference material for web-performance-diagnosis.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "quality-audit",
      source: new URL("./references/quality-audit.md", import.meta.url),
      target: "references/quality-audit.md",
      title: "quality-audit.md",
      summary: "Reference material for web-performance-diagnosis.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "rendering-and-waterfall",
      source: new URL("./references/rendering-and-waterfall.md", import.meta.url),
      target: "references/rendering-and-waterfall.md",
      title: "rendering-and-waterfall.md",
      summary: "Reference material for web-performance-diagnosis.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "rules-rendering",
      source: new URL("./references/rules-rendering/", import.meta.url),
      target: "references/rules-rendering",
      title: "rules-rendering",
      summary: "Reference material for web-performance-diagnosis.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "rules-waterfall",
      source: new URL("./references/rules-waterfall/", import.meta.url),
      target: "references/rules-waterfall",
      title: "rules-waterfall",
      summary: "Reference material for web-performance-diagnosis.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for web-performance-diagnosis.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
