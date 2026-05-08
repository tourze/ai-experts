import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { procedureUse, dataAnalysisAnalyze } from "../../procedures/index";

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
    "`data-analysis-analyze` procedure 使用 Node.js 内置 API，不依赖 Python、DuckDB 或 OpenPyXL；`query` 支持常用单表 `SELECT`、`WHERE`、`GROUP BY`、聚合、`ORDER BY` 与 `LIMIT`，不承诺完整 DuckDB 方言。",
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
      reason: "分析结果需要组织成业务叙事、洞察摘要或面向读者的结论材料时联动。",
    },
    {
      get id() {
        return statisticalAnalysisSkill.id;
      },
      reason: "需求涉及显著性检验、置信区间、异常解释或统计边界时联动。",
    },
    {
      get id() {
        return dataVisualizationSkill.id;
      },
      reason: "需要把聚合、对比或趋势结果转成图表和可视化表达时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "不 inspect 直接 SQL",
      pass: "inspect → query",
    }),
    defineAntiPattern({
      fail: "没问题先聚合",
      pass: "先确认问题",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认文件真实存在、扩展名受支持，并用 `data-analysis-analyze` procedure inspect 表名、列名、类型和空值。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "基于 inspect 结果再写 query 或 summary，不引用不存在的表和列。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "按问题选择筛选、聚合、排序、limit、导出格式或后续可视化 / 叙事流程。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "导出前确认输出扩展名只使用 `.csv`、`.json` 或 `.md`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "文件、表、列、类型、空值和可疑数据结构摘要。",
      "查询、汇总、聚合、排序或 join 结果及其口径说明。",
      "导出路径、格式限制，以及是否需要统计、可视化或数据叙事后续处理。",
    ],
  }),
  procedures: [
    procedureUse(dataAnalysisAnalyze),
  ],
});
