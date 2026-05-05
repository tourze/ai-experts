import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const webmanPluginDevelopmentSkill = defineSkill({
  id: "webman-plugin-development",
  fullName: "Webman Plugin Development",
  description: "当用户要开发或审查 Webman 插件的 Install.php、config 发布、进程声明或 Bootstrap 时使用。",
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
      summary: "Eval cases for webman-plugin-development.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
