import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
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
  antiPatterns: [
    defineAntiPattern({
      fail: "硬编码无 Builder",
      pass: "Builder 模式",
    }),
    defineAntiPattern({
      fail: "JS invoke 无 plugin: 前缀",
      pass: "plugin:name|cmd：详见 [references/](references/)。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认插件名称、宿主配置项、目标平台、命令面、权限范围和 JS 包边界。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "读取 `plugin-dev-patterns` reference，搭建插件目录、Builder 入口、生命周期钩子和权限文件。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "桌面/移动平台拆成 `desktop.rs` / `mobile.rs`，公共 trait 定义统一接口。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "通过 `Builder.setup()` 注入状态，命令参数保持 camelCase JS API 与 Rust 结构同步。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "权限放在 `permissions/`，`default.toml` 只包含最小默认集，capability 显式引用。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "输出 Rust crate、JS API、权限、宿主注册方式和测试检查点。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "插件目录结构、Builder 入口和生命周期钩子。",
      "桌面/移动拆分、公共 trait 和状态管理设计。",
      "命令注册、JS API、参数命名和错误结构。",
      "权限文件、capability 引用、宿主集成和测试清单。",
    ],
  }),
  references: [
    defineReference({
      id: "plugin-dev-patterns",
      source: new URL("./references/plugin-dev-patterns.md", import.meta.url),
      target: "references/plugin-dev-patterns.md",
      title: "plugin-dev-patterns.md",
      summary: "Tauri v2 插件开发完整指南，包括脚手架、生命周期钩子、平台拆分、状态管理和权限定义。",
      loadWhen: "需要创建自定义插件、实现桌面/移动平台拆分或配置插件权限时读取。",
    }),
  ],
});
