import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";
import { dataStorytellingSkill } from "../data-storytelling/index";
import { dataVisualizationSkill } from "../data-visualization/index";
import { statisticalAnalysisSkill } from "../statistical-analysis/index";

export const dataAnalysisSkill = defineSkill({
  id: "data-analysis",
  fullName: "data-analysis",
  description: "当用户上传或指定 .xlsx、.csv 等表格文件，需要分析数据并给出结论时使用。",
  useCases: [
    "用户给出一个或多个本地 `.xlsx` / `.csv` 文件路径，希望先看结构、再做筛选、聚合、对比、导出。",
    "需要快速回答“有哪些列”“每列是什么类型”“哪几行最可疑”“这个维度怎么汇总”。",
    "需要在多张表或多个文件之间做 join、group by、窗口函数类分析。",
  ],
  constraints: [
    "先 `inspect`，再 `query` 或 `summary`；没看清表结构就直接写 SQL，命中率会很差。",
    "只处理显式给出的本地文件路径；不要假设上传目录，也不要猜测文件名。",
    "当前脚本直接支持 `.xlsx` 与 `.csv`；旧式 `.xls` 需要先转存为 `.xlsx`。",
    "`scripts/analyze.mjs` 使用 Node.js 内置 API，不依赖 Python、DuckDB 或 OpenPyXL；`query` 支持常用单表 `SELECT`、`WHERE`、`GROUP BY`、聚合、`ORDER BY` 与 `LIMIT`，不承诺完整 DuckDB 方言。",
    "导出结果只支持 `.csv`、`.json`、`.md`。",
  ],
  checklist: [
    "文件路径是否真实存在，扩展名是否在支持范围内。",
    "是否已经通过 `inspect` 确认过表名、列名、类型、空值分布。",
    "SQL 是否只引用了实际存在的表和列。",
  ],
  relatedSkills: [
    {
      get id() {
        return dataStorytellingSkill.id;
      },
      reason: "导出路径扩展名是否正确，是否需要交给 `data-visualization` 或 `data-storytelling` 做后续表达。",
    },
    {
      get id() {
        return statisticalAnalysisSkill.id;
      },
      reason: "如果需求涉及显著性检验、异常解释或统计边界，是否切换到 `statistical-analysis`。",
    },
    {
      get id() {
        return dataVisualizationSkill.id;
      },
      reason: "相关 skill：`statistical-analysis`、`data-visualization`、`data-storytelling`。",
    },
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
