import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const dataAnalysisSkill = defineSkill({
  id: "data-analysis",
  fullName: "data-analysis",
  description: "当用户上传或指定 .xlsx、.csv 等表格文件，需要分析数据并给出结论时使用。",
  useCases: [
    "用户给出一个或多个本地 `.xlsx` / `.csv` 文件路径，希望先看结构、再做筛选、聚合、对比、导出。",
    "需要快速回答“有哪些列”“每列是什么类型”“哪几行最可疑”“这个维度怎么汇总”。",
    "需要在多张表或多个文件之间做 join、group by、窗口函数类分析。",
    "相关 skill：[statistical-analysis](../statistical-analysis/SKILL.md)、[data-visualization](../data-visualization/SKILL.md)、[data-storytelling](../data-storytelling/SKILL.md)。",
  ],
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
});
