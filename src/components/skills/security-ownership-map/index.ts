import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk.js";

export const securityOwnershipMapSkill = defineSkill({
  id: "security-ownership-map",
  description: "当用户明确希望基于 git 历史构建安全所有权、bus factor、敏感代码归属或 CODEOWNERS 风险画像时使用。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for security-ownership-map.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
