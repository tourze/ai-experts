import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const skillsPruneAndSyncReadmeSkill = defineSkill({
  id: "skills-prune-and-sync-readme",
  fullName: "Skills Prune And Sync Component Index",
  description: "当用户提到”清理 skills””删除重复/低质量 skill””治理 skill 冲突””更新 README 的 skill 列表”时使用。",
  useCases: [
    "当用户提到”清理 skills””删除重复/低质量 skill””治理 skill 冲突””更新 README 的 skill 列表”时使用。",
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
      id: "curate-skills",
      entry: new URL("./scripts/curate_skills.mjs", import.meta.url),
      target: "scripts/curate_skills.mjs",
      runtime: "node",
      bundle: false,
      description: "Script curate_skills.mjs.",
    }),
    defineSkillScript({
      id: "similarity-groups",
      entry: new URL("./scripts/similarity_groups.mjs", import.meta.url),
      target: "scripts/similarity_groups.mjs",
      runtime: "node",
      bundle: false,
      description: "Script similarity_groups.mjs.",
    }),
    defineSkillScript({
      id: "test-curate-skills",
      entry: new URL("./scripts/test_curate_skills.mjs", import.meta.url),
      target: "scripts/test_curate_skills.mjs",
      runtime: "node",
      bundle: false,
      description: "Script test_curate_skills.mjs.",
    })
  ],
});
