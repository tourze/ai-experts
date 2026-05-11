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
import { reactServerComponentsSkill } from "../react-server-components/index";
import { rustAsyncPatternsSkill } from "../rust-async-patterns/index";
import { rustErrorHandlingSkill } from "../rust-error-handling/index";
import { rustOwnershipIdiomsSkill } from "../rust-ownership-idioms/index";
import { typescriptTypeSafetySkill } from "../typescript-type-safety/index";

export const tauriV2Skill = defineSkill({
  id: "tauri-v2",
  fullName: "Tauri v2",
  description: "当用户要搭建 Tauri v2 应用骨架、src-tauri、tauri.conf.json、capabilities、插件权限、命令注册或移动端支持时使用。",
  useCases: [
    "需要搭建或调整 `src-tauri/` 目录、`tauri.conf.json`、`Cargo.toml`、`lib.rs` / `main.rs` 分层时使用。",
    "需要实现前端 `invoke()` 调 Rust 命令、Rust 向前端发事件、或者用 `Channel<T>` 推送高频流式消息时使用。",
    "需要接入官方插件、确认 `cargo tauri add <plugin>` 后的注册步骤、capability 写法、权限范围和多窗口目标时使用。",
    "需要排查 “命令找不到”“权限拒绝”“桌面可用、移动端失效”“白屏”“签名/更新失败” 这类 Tauri 特有问题时使用。",
    "需要展开专题时优先查这些参考文档：\n[Capabilities](references/capabilities-reference.md)、\n[IPC Patterns](references/ipc-patterns.md)、\n[Plugin Reference](references/plugin-reference.md)、\n[Updater & Distribution](references/updater-distribution-reference.md)、\n[Advanced Runtime](references/advanced-runtime-reference.md)。",
  ],
  constraints: [
    "`src-tauri/src/main.rs` 只保留薄入口；真正的构建器、命令注册、插件注册和状态注入都放在 `src-tauri/src/lib.rs::run()`。",
    "面向移动端时，`lib.rs::run()` 必须带 `#[cfg_attr(mobile, tauri::mobile_entry_point)]`；不要把核心逻辑写死在 `main()`。",
    "每个 `#[tauri::command]` 都必须出现在 `tauri::generate_handler![...]` 中；漏注册时前端会得到 “command not found”。",
    "`async` 命令参数一律使用拥有所有权的类型，例如 `String`、结构体、`Vec<T>`；不要在异步命令里使用 `&str` 之类借用类型。",
    "自定义 `#[tauri::command]` 默认可以被调用；capability 主要约束核心 API、插件权限、远程 URL 和你主动收紧的命令集。不要误以为 “所有命令都必须先写 capability”。",
    "官方插件通过 `cargo tauri add <plugin>` 安装时，默认 permission 常常会被 CLI 自动加入；但非默认 permission、自定义 scope、多窗口目标、手工安装场景仍然必须显式检查 `src-tauri/capabilities/*.json`。",
    "共享可变状态用 `Mutex<T>` / `RwLock<T>` 包裹，并保证 `State<T>` 的泛型与 `.manage(...)` 注入的真实类型完全一致。",
    "所有桌面专属能力都要先核对平台支持矩阵；系统托盘、多窗口标签、部分 shell 功能经常需要 `#[cfg(desktop)]` 或运行时分支。",
  ],
  checklist: [
    "`main.rs` 是否只做入口转发，`lib.rs` 是否承载了 `run()`、命令注册和插件注册？",
    "每个命令是否都进入了 `tauri::generate_handler![...]`，异步参数是否全部为拥有所有权的类型？",
    "前端是否统一使用 `@tauri-apps/api/core`、`@tauri-apps/api/event` 等 v2 API，而不是遗留的 v1 导入路径？",
    "如果调用的是核心 JS API 或插件 JS API，是否核对了 `src-tauri/capabilities/*.json` 里的默认 permission、额外 permission 与 scope？",
    "插件安装后是否同时验证了三件事：Cargo 依赖、`lib.rs` 注册、capability/权限目标窗口？",
    "长耗时逻辑是否避开 UI 线程阻塞，`Channel<T>` / 事件 / `invoke()` 的 IPC 选择是否和吞吐量匹配？",
    "`State<T>` 的类型是否与 `.manage(...)` 注入保持完全一致，锁的粒度是否足够小？",
    "是否先核对目标插件或 API 的桌面 / Android / iOS 支持矩阵，再决定是否需要 `#[cfg(desktop)]` / `#[cfg(mobile)]`？",
    "交付前是否运行 `cargo tauri info`、目标平台构建命令，并检查 `beforeDevCommand` / `beforeBuildCommand`、签名和更新配置？",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "全部逻辑塞 main.rs",
      pass: "main 薄入口 + lib.rs::run()",
    }),
    defineAntiPattern({
      fail: "异步命令用借用参数",
      pass: "拥有所有权类型",
    }),
    defineAntiPattern({
      fail: "v1 时代 import",
      pass: "v2 模块化路径",
    }),
    defineAntiPattern({
      fail: "桌面通过 = 移动通过",
      pass: "平台分支",
    }),
  ],
  relatedSkills: [
    {
      get skill() {
        return rustErrorHandlingSkill;
      },
      reason: "Rust 命令、插件注册或后端模块需要错误类型、Result 合同和错误传播策略时联动。",
    },
    {
      get skill() {
        return rustOwnershipIdiomsSkill;
      },
      reason: "Tauri State、共享资源、生命周期对象或跨线程所有权边界需要建模时联动。",
    },
    {
      get skill() {
        return rustAsyncPatternsSkill;
      },
      reason: "后台任务、异步命令、事件推送或非阻塞运行时设计需要收敛时联动。",
    },
    {
      get skill() {
        return typescriptTypeSafetySkill;
      },
      reason: "前端 invoke 参数、返回 DTO、事件 payload 或 IPC 类型边界需要严格建模时联动。",
    },
    {
      get skill() {
        return reactServerComponentsSkill;
      },
      reason: "Tauri 前端使用 React 并需要组件分层、数据边界或服务端组件取舍时联动。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认任务类型：新建骨架、命令/IPC、插件权限、capability、移动端、运行时特性、签名更新或故障排查。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "保持 `main.rs` 为薄入口，核心构建器、命令注册、插件注册和状态注入放在 `lib.rs::run()`；代码片段读取 `quick-patterns` reference。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "每个 `#[tauri::command]` 都进入 `generate_handler!`，async 参数使用拥有所有权的类型。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "调用核心 JS API 或插件 JS API 时，核对 capability、permission、scope 和目标窗口。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "按专题读取 reference：capability、IPC、插件、updater、advanced runtime 或 README 索引。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "交付前运行 `cargo tauri info` 和目标平台构建命令，验证 beforeDev/beforeBuild、签名和更新配置。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Tauri v2 项目骨架、`main.rs`/`lib.rs` 分层和命令注册方案。",
      "capability、permission、scope、插件注册和平台分支检查。",
      "IPC、事件、Channel、State 和窗口访问设计。",
      "构建/更新验证命令、排查结果和剩余风险。",
    ],
  }),
  references: [
    defineReference({
      id: "quick-patterns",
      source: new URL("./references/quick-patterns.md", import.meta.url),
      target: "references/quick-patterns.md",
      title: "Tauri v2 快速代码模式",
      summary: "Tauri v2 main/lib 分层、invoke 调用、capability JSON 和窗口访问的常用代码模式。",
      loadWhen: "需要快速查看 Tauri v2 骨架代码、命令注册、前端 invoke 或 capability 示例时读取。",
    }),
    defineReference({
      id: "advanced-runtime-reference",
      source: new URL("./references/advanced-runtime-reference.md", import.meta.url),
      target: "references/advanced-runtime-reference.md",
      title: "advanced-runtime-reference.md",
      summary: "Tauri v2 运行时进阶功能，包括多窗口管理、系统托盘、全局快捷键和后台任务。",
      loadWhen: "需要实现多窗口协作、系统托盘菜单或平台专用运行时特性时读取。",
    }),
    defineReference({
      id: "capabilities-reference",
      source: new URL("./references/capabilities-reference.md", import.meta.url),
      target: "references/capabilities-reference.md",
      title: "capabilities-reference.md",
      summary: "Tauri v2 capability 与权限系统的配置参考，包括 scope、多窗口目标和权限标识符。",
      loadWhen: "需要配置 capability 文件、定义命令权限或排查权限拒绝问题时读取。",
    }),
    defineReference({
      id: "ipc-patterns",
      source: new URL("./references/ipc-patterns.md", import.meta.url),
      target: "references/ipc-patterns.md",
      title: "ipc-patterns.md",
      summary: "Tauri v2 IPC 通信模式，包括 invoke、事件系统、Channel<T> 和命令注册。",
      loadWhen: "需要设计前后端通信方案或排查 invoke/事件/Channel 问题时读取。",
    }),
    defineReference({
      id: "plugin-reference",
      source: new URL("./references/plugin-reference.md", import.meta.url),
      target: "references/plugin-reference.md",
      title: "plugin-reference.md",
      summary: "Tauri v2 官方插件接入参考，包括安装、注册、权限配置和版本兼容性。",
      loadWhen: "需要接入或排查官方插件（如 shell、fs、dialog）时读取。",
    }),
    defineReference({
      id: "readme",
      source: new URL("./references/README.md", import.meta.url),
      target: "references/README.md",
      title: "README.md",
      summary: "Tauri v2 参考文档索引，汇总各参考文件的内容概述和快速导航。",
      loadWhen: "需要快速定位某个 Tauri v2 专题的参考文件时先读此文档。",
    }),
    defineReference({
      id: "updater-distribution-reference",
      source: new URL("./references/updater-distribution-reference.md", import.meta.url),
      target: "references/updater-distribution-reference.md",
      title: "updater-distribution-reference.md",
      summary: "Tauri v2 自动更新与分发的配置参考，包括密钥管理、CI 部署和版本策略。",
      loadWhen: "需要配置应用自动更新、生成签名或搭建分发流水线时读取。",
    }),
  ],
});
