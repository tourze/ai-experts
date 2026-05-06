import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { scriptUse } from "../../scripts/index";
import { securityThreatModelSkill } from "../security-threat-model/index";

export const securityOwnershipMapSkill = defineSkill({
  id: "security-ownership-map",
  fullName: "安全所有权拓扑分析",
  description: "当用户明确希望基于 git 历史构建安全所有权、bus factor、敏感代码归属或 CODEOWNERS 风险画像时使用。",
  useCases: [
    "需要找出敏感代码无人维护、单点维护者或高风险变更簇。",
    "需要把 git 历史与 `security-threat-model` 的资产/边界分析关联起来。",
    "需要导出 CSV/JSON 给图数据库或可视化工具。导入 Neo4j 的方法见 [references/neo4j-import.md](references/neo4j-import.md)。",
  ],
  constraints: [
    "只用于安全导向的所有权分析，不回答泛化的“谁维护这个仓库”问题。",
    "优先缩小时间窗；大仓库默认加 `--since` 或 `--until`。",
    "社区检测和 GraphML 输出由 Node.js 脚本直接生成，无需 Python `networkx`。",
    "脚本路径以当前 skill 目录为基准；构建、查询与社区分析脚本都使用 Node.js。",
  ],
  checklist: [
    "确认时间窗、身份归因方式和敏感规则配置。",
    "检查 `summary.json`、`people.csv`、`files.csv` 与 `edges.csv` 是否完整生成。",
    "对“隐藏 owner”“低 bus factor”“孤儿敏感代码”分别解释证据。",
    "导出图数据前说明 co-change 过滤规则和作者排除规则。",
  ],
  relatedSkills: [
    {
      get id() {
        return securityThreatModelSkill.id;
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scripts: [
    scriptUse("security-ownership-map-build-ownership-map"),
    scriptUse("security-ownership-map-community-maintainers"),
    scriptUse("security-ownership-map-query-ownership"),
    scriptUse("security-ownership-map-run-ownership-map"),
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
