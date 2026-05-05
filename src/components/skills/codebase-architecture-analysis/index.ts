import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const codebaseArchitectureAnalysisSkill = defineSkill({
  id: "codebase-architecture-analysis",
  fullName: "代码库架构分析",
  description: "当用户要分析代码库架构、梳理模块边界、绘制依赖图、检测分层违规或评估结构健康度时使用。提供从模块地图到优先改进项的系统化分析流程，每条发现绑定到文件:行/段。",
  useCases: [
    "接手陌生代码库，需要快速建立模块地图",
    "重构前评估，识别高 churn 文件、God module 和扩展点薄弱区域",
    "合并前结构检查，防止引入循环依赖或越层调用",
    "技术债摸底，量化结构健康度并排序改进项",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "anti-patterns",
      source: new URL("./references/anti-patterns.md", import.meta.url),
      target: "references/anti-patterns.md",
      title: "anti-patterns.md",
      summary: "Reference material for codebase-architecture-analysis.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "code-patterns",
      source: new URL("./references/code-patterns.md", import.meta.url),
      target: "references/code-patterns.md",
      title: "code-patterns.md",
      summary: "Reference material for codebase-architecture-analysis.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
