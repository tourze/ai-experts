import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";
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
  relatedSkills: [
    {
      get id() {
        return securityThreatModelSkill.id;
      },
      reason: "需要把 git 历史与 `security-threat-model` 的资产/边界分析关联起来。",
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
      id: "build-ownership-map",
      entry: new URL("./scripts/build_ownership_map.mjs", import.meta.url),
      target: "scripts/build_ownership_map.mjs",
      runtime: "node",
      bundle: false,
      description: "Script build_ownership_map.mjs.",
    }),
    defineSkillScript({
      id: "community-maintainers",
      entry: new URL("./scripts/community_maintainers.mjs", import.meta.url),
      target: "scripts/community_maintainers.mjs",
      runtime: "node",
      bundle: false,
      description: "Script community_maintainers.mjs.",
    }),
    defineSkillScript({
      id: "query-ownership",
      entry: new URL("./scripts/query_ownership.mjs", import.meta.url),
      target: "scripts/query_ownership.mjs",
      runtime: "node",
      bundle: false,
      description: "Script query_ownership.mjs.",
    }),
    defineSkillScript({
      id: "run-ownership-map",
      entry: new URL("./scripts/run_ownership_map.mjs", import.meta.url),
      target: "scripts/run_ownership_map.mjs",
      runtime: "node",
      bundle: false,
      description: "Script run_ownership_map.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "neo4j-import",
      source: new URL("./references/neo4j-import.md", import.meta.url),
      target: "references/neo4j-import.md",
      title: "neo4j-import.md",
      summary: "Reference material for security-ownership-map.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
