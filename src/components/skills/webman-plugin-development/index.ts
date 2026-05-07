import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
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
  checklist: [
    "`WEBMAN_PLUGIN = true` 已声明",
    "`$pathRelation` 指向 `config/plugin/{vendor}/{package}/`",
    "PSR-4 autoload 映射到 `src/`",
    "`mkdir` 权限 `0755`",
    "`uninstall()` 清理已发布配置",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "mkdir 0777",
      pass: "0755",
    }),
    defineAntiPattern({
      fail: "读应用配置",
      pass: "插件命名空间",
    }),
    defineAntiPattern({
      fail: "uninstall 留空",
      pass: "完整清理",
    }),
    defineAntiPattern({
      fail: "framework 在 require",
      pass: "require-dev",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "按 Webman 插件约定设计 Install.php、配置发布、autoload、进程声明和卸载清理。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认插件 vendor/package、Composer autoload、配置目录、进程需求和安装/卸载行为。",
      "在 `src/Install.php` 声明 `WEBMAN_PLUGIN = true` 和 `$pathRelation`，路径指向 `config/plugin/{vendor}/{package}/`。",
      "配置读取统一用 `config('plugin.{vendor}.{package}.{key}')`，避免直接读应用全局配置。",
      "`mkdir` 权限使用 `0755`，`webman-framework` 放 `require-dev`。",
      "实现 `uninstall()` 清理已发布配置、进程声明或其它安装副作用。",
      "输出插件目录结构、Install.php 要点、配置访问方式和发布/卸载检查清单。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "插件 composer/autoload/目录结构。",
      "`Install.php`、`$pathRelation` 和配置发布设计。",
      "配置访问、进程声明、Bootstrap 或权限边界。",
      "安装验证、卸载清理和常见反模式检查。",
    ],
  }),
  tools: [],
});
