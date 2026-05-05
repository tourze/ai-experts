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
  constraints: [
    "先 `inspect`，再 `query` 或 `summary`；没看清表结构就直接写 SQL，命中率会很差。",
    "只处理显式给出的本地文件路径；不要假设上传目录，也不要猜测文件名。",
    "当前脚本直接支持 `.xlsx` 与 `.csv`；旧式 `.xls` 需要先转存为 `.xlsx`。",
    "`scripts/analyze.mjs` 使用 Node.js 内置 API，不依赖 Python、DuckDB 或 OpenPyXL；`query` 支持常用单表 `SELECT`、`WHERE`、`GROUP BY`、聚合、`ORDER BY` 与 `LIMIT`，不承诺完整 DuckDB 方言。",
    "导出结果只支持 `.csv`、`.json`、`.md`。",
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
