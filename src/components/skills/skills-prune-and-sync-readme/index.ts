import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";

export const skillsPruneAndSyncReadmeSkill = defineSkill({
  id: "skills-prune-and-sync-readme",
  fullName: "Skills Prune And Sync Component Index",
  description: "当用户提到”清理 skills””删除重复/低质量 skill””治理 skill 冲突””更新 README 的 skill 列表”时使用。",
  useCases: [
    "当用户提到”清理 skills””删除重复/低质量 skill””治理 skill 冲突””更新 README 的 skill 列表”时使用。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "模糊相似度批量删",
      pass: "先 audit 再点名删",
    }),
    defineAntiPattern({
      fail: "手动改 README 表格",
      pass: "sync-readme 子命令",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scripts: [
    "skills-prune-and-sync-readme-curate-skills",
    "skills-prune-and-sync-readme-similarity-groups",
    "skills-prune-and-sync-readme-test-curate-skills",
  ],
});
