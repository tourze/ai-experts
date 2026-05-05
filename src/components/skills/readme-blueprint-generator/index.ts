import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const readmeBlueprintGeneratorSkill = defineSkill({
  id: "readme-blueprint-generator",
  description: "当用户要为仓库生成或重构 README.md 时使用。该技能会先梳理项目定位、技术栈、结构、开发流程和测试方式，再输出开发者可直接使用的 README 骨架。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for readme-blueprint-generator.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
