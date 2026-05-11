import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { procedureUse, securityOwnershipMapBuildOwnershipMap, securityOwnershipMapCommunityMaintainers, securityOwnershipMapQueryOwnership, securityOwnershipMapRunOwnershipMap } from "../../procedures/index";

import { securityThreatModelSkill } from "../security-threat-model/index";

export const securityOwnershipMapSkill = defineSkill({
  id: "security-ownership-map",
  fullName: "安全所有权拓扑分析",
  description: "当用户明确希望基于 git 历史构建安全所有权、bus factor、敏感代码归属或 CODEOWNERS 风险画像时使用。",
  useCases: [
    "需要找出敏感代码无人维护、单点维护者或高风险变更簇。",
    "需要导出 CSV/JSON 给图数据库或可视化工具。导入 Neo4j 的方法见 [references/neo4j-import.md](references/neo4j-import.md)。",
  ],
  constraints: [
    "只用于安全导向的所有权分析，不回答泛化的“谁维护这个仓库”问题。",
    "优先缩小时间窗；大仓库默认加 `--since` 或 `--until`。",
    "社区检测和 GraphML 输出由 Node.js 脚本直接生成，无需 Python `networkx`。",
    "脚本路径以当前 skill 目录为基准；构建、查询与社区分析脚本都使用 Node.js。",
    "默认不会覆盖输出目录内已存在的 CSV/JSON/GraphML 产物；确认目标可替换后才传 `--overwrite`。",
  ],
  checklist: [
    "确认时间窗、身份归因方式和敏感规则配置。",
    "检查 `summary.json`、`people.csv`、`files.csv` 与 `edges.csv` 是否完整生成。",
    "对“隐藏 owner”“低 bus factor”“孤儿敏感代码”分别解释证据。",
    "导出图数据前说明 co-change 过滤规则和作者排除规则。",
    "是否确认输出目录内目标产物不存在，或已得到明确覆盖许可后再使用 `--overwrite`。",
  ],
  relatedSkills: [
    {
      get skill() {
        return securityThreatModelSkill;
      },
      reason: "需要把 git 历史与 `security-threat-model` 的资产/边界分析关联起来。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "全量跑大仓库",
      pass: "限定时间窗",
    }),
    defineAntiPattern({
      fail: "活跃度当安全结论",
      pass: "敏感规则 + bus factor",
    }),
    defineAntiPattern({
      fail: "把所有 commit author 当 owner",
      pass: "加权 + 阈值",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "确认分析范围、时间窗、身份归并规则、敏感文件规则和输出格式。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "调用 ownership map 相关 procedure 构建 `summary.json`、`people.csv`、`files.csv`、`edges.csv` 等产物。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "查询高风险文件、敏感规则命中、owner 覆盖度、bus factor 和 co-change 关系。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "需要社区或图结构分析时调用 community procedure；需要图数据库可视化时读取 `neo4j-import` reference。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "把所有发现绑定到文件、作者、时间窗、规则命中和共改证据，避免只用活跃度下结论。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "分析范围、时间窗和敏感规则说明。",
      "所有权图关键指标：owner 覆盖、bus factor、孤儿敏感代码和隐藏 owner。",
      "高风险文件/模块清单及证据。",
      "CSV/JSON/GraphML 或 Neo4j 导入建议。",
    ],
  }),
  procedures: [
    procedureUse(securityOwnershipMapBuildOwnershipMap, {
      label: "构建所有权图谱",
      when: "需要从 git 历史全量构建安全所有权图谱（含社区检测、共改分析、GraphML 输出）时。",
      reason: "一键构建完整安全所有权图谱及社区结构，避免手写 git log 分析脚本。",
    }),
    procedureUse(securityOwnershipMapCommunityMaintainers, {
      label: "社区维护者分析",
      when: "需要快速分析社区维护者分布和共改关系时。",
      reason: "仅需少量参数即可识别维护者分布和共改关系，避免在完整参数中逐项配置。",
    }),
    procedureUse(securityOwnershipMapQueryOwnership, {
      label: "查询所有权结果",
      when: "已运行所有权分析并生成 CSV/JSON 产物，需要查询人员/文件/共改/标签信息时。",
      reason: "从已生成的分析产物中按需查询人员/文件/共改信息，避免重新全量分析。",
    }),
    procedureUse(securityOwnershipMapRunOwnershipMap, {
      label: "快速运行所有权分析",
      when: "需要快速运行简化的所有权分析（不深入调整社区/共改参数）时。",
      reason: "快速运行简化所有权分析，避免在只需基础数据时加载完整参数配置。",
    }),
  ],
  references: [
    defineReference({
      id: "neo4j-import",
      source: new URL("./references/neo4j-import.md", import.meta.url),
      target: "references/neo4j-import.md",
      title: "neo4j-import.md",
      summary: "将安全所有权分析结果导入 Neo4j 图数据库的方法和步骤。",
      loadWhen: "需要把所有权分析结果导入图数据库进行可视化分析时读取。",
    }),
  ],
});
