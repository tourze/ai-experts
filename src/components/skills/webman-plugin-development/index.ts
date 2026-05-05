import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const webmanPluginDevelopmentSkill = defineSkill({
  id: "webman-plugin-development",
  fullName: "Webman Plugin Development",
  description: "当用户要开发或审查 Webman 插件的 Install.php、config 发布、进程声明或 Bootstrap 时使用。",
  useCases: [
    "开发 Composer 分发的 webman 插件。",
    "审查第三方插件结构。",
    "排查插件配置不生效、进程不启动。",
  ],
  constraints: [
    "`Install.php` 声明 `WEBMAN_PLUGIN = true` 和 `$pathRelation`。见 [reference](reference.md)。",
    "配置路径 `src/config/plugin/{vendor}/{package}/`。",
    "访问用 `config('plugin.{vendor}.{package}.{key}')`。",
    "`mkdir` 用 `0755`，`webman-framework` 放 `require-dev`。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
