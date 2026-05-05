import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const iconRetrievalSkill = defineSkill({
  id: "icon-retrieval",
  fullName: "图标检索",
  description: "当需要搜索图标、查找 SVG 或批量筛选图标候选时使用。",
  useCases: [
    "需要快速搜索某个概念对应的 SVG 图标。",
    "需要把图标结果直接嵌入前端代码、设计系统或可视化页面。",
    "需要给设计稿实现、组件开发或信息图挑选多个候选图标。",
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
      id: "search",
      entry: new URL("./scripts/search.mjs", import.meta.url),
      target: "scripts/search.mjs",
      runtime: "node",
      bundle: false,
      description: "Script search.mjs.",
    })
  ],
});
