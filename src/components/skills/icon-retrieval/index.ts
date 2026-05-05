import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const iconRetrievalSkill = defineSkill({
  id: "icon-retrieval",
  fullName: "图标检索",
  description: "当需要搜索图标、查找 SVG 或批量筛选图标候选时使用。",
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
      id: "search",
      entry: new URL("./scripts/search.mjs", import.meta.url),
      target: "scripts/search.mjs",
      runtime: "node",
      bundle: false,
      description: "Script search.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for icon-retrieval.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
