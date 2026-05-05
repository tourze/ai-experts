import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk.js";

export const webContentFetcherSkill = defineSkill({
  id: "web-content-fetcher",
  description: "当用户给出具体 URL，需要抓取网页正文并转成 Markdown 时使用。适用于博客、文档、新闻页和微信公众号等页面的正文提取与内容准备。",
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
      id: "fetch",
      entry: new URL("./scripts/fetch.mjs", import.meta.url),
      target: "scripts/fetch.mjs",
      runtime: "node",
      bundle: false,
      description: "Script fetch.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "question-refiner",
      source: new URL("./references/question-refiner.md", import.meta.url),
      target: "references/question-refiner.md",
      title: "question-refiner.md",
      summary: "Reference material for web-content-fetcher.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for web-content-fetcher.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
