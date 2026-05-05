import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const tauriPluginDevelopmentSkill = defineSkill({
  id: "tauri-plugin-development",
  fullName: "Tauri v2 插件开发",
  description: "在创建自定义 Tauri v2 插件、处理生命周期钩子、桌面/移动拆分、插件状态、命令注册、JS API 或权限定义时使用。",
  useCases: [
    "创建插件脚手架并理解目录结构",
    "实现 setup/on_event/on_drop 生命周期钩子",
    "桌面/移动平台通过 trait 抽象统一接口",
    "插件状态管理、命令注册、权限定义",
  ],
  constraints: [
    "入口返回 `TauriPlugin<R>`，`Builder::new(\"name\").build()`；名称不含前缀",
    "移动端拆 `mobile.rs` + `desktop.rs`，公共 trait 定义接口",
    "状态通过 `Builder.setup()` 中 `app.manage()` 注入",
    "JS 用 `invoke(\"plugin:<name>|<cmd>\")`，参数 camelCase",
    "权限放 `permissions/`，`default.toml` 定义最小默认集",
    "JS 包名与 Rust crate 名对应",
    "始终提供 Builder 模式让宿主可配置",
  ],
  checklist: [
    "入口是否 `Builder::new(\"name\").build()`？",
    "移动端是否拆分并用公共 trait？",
    "`default.toml` 是否定义最小权限？",
    "`on_event` 是否处理 `RunEvent::Exit`？",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "plugin-dev-patterns",
      source: new URL("./references/plugin-dev-patterns.md", import.meta.url),
      target: "references/plugin-dev-patterns.md",
      title: "plugin-dev-patterns.md",
      summary: "Reference material for tauri-plugin-development.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
