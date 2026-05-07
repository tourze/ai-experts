import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const tauriReactIntegrationSkill = defineSkill({
  id: "tauri-react-integration",
  fullName: "Tauri v2 + React 集成",
  description: "当用户要集成 React 前端、invoke 封装、useInvoke Hook、事件监听生命周期、Router 深链接、WebView 限制或错误边界时使用。",
  useCases: [
    "`invoke()` 封装为带 loading/error 的 Hook",
    "Tauri 事件 listen/unlisten 生命周期管理",
    "Rust-React 状态同步（事件驱动）",
    "React Router + 深链接集成",
    "IPC 失败错误边界",
  ],
  constraints: [
    "WebView 无 Node.js API；系统访问必须 `invoke()`",
    "CSP 显式允许脚本源；dev server 绑定 localhost",
    "TS 类型与 Rust 结构体严格同步，禁 `any`",
    "React 与 Rust 状态独立，必须显式同步",
    "深链接同时在 Rust `on_open_url` 和 React Router 处理",
    "`useTauriEvent` cleanup 必须 unlisten 并处理卸载竞态",
    "Error Boundary 捕获 IPC Promise rejection",
  ],
  checklist: [
    "前端无 Node.js API 调用？",
    "`useInvoke` 处理 loading/error/success？",
    "`useTauriEvent` cleanup 调用 unlisten？",
    "Rust 变更后 `emit()` 通知前端？",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "listen 不 cleanup",
      pass: "cleanup 调 unlisten",
    }),
    defineAntiPattern({
      fail: "invoke 无 try/catch",
      pass: "useInvoke Hook 封装",
    }),
    defineAntiPattern({
      fail: "假设状态自动同步",
      pass: "显式 emit + listen：详见 [references/](references/)。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认 React 前端路由、状态边界、IPC 调用点、事件订阅点和错误展示策略。",
      "读取 `react-integration-patterns` reference，封装 `useInvoke`、`useTauriEvent` 和 IPC 错误边界。",
      "读取 `deeplink-state-sync-patterns` reference，处理 Rust `on_open_url`、React Router 和状态同步事件。",
      "确保前端不调用 Node.js API，系统能力都通过 `invoke()` 或 Tauri JS API。",
      "Rust 状态变更后显式 `emit()`，React 订阅 cleanup 必须 `unlisten()` 并处理卸载竞态。",
      "输出 hooks、类型合同、错误状态、深链接路由和同步测试点。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "React/Tauri 边界、IPC 调用点和事件订阅点。",
      "`useInvoke`、`useTauriEvent`、错误边界和 cleanup 设计。",
      "深链接处理、状态同步和 Router 集成方案。",
      "TypeScript 类型合同、CSP/WebView 限制和验证清单。",
    ],
  }),
  references: [
    defineReference({
      id: "deeplink-state-sync-patterns",
      source: new URL("./references/deeplink-state-sync-patterns.md", import.meta.url),
      target: "references/deeplink-state-sync-patterns.md",
      title: "deeplink-state-sync-patterns.md",
      summary: "Tauri 深链接集成与 Rust-React 状态同步的事件驱动模式。",
      loadWhen: "需要实现 React Router 深链接或 React 与 Rust 状态显式同步时读取。",
    }),
    defineReference({
      id: "react-integration-patterns",
      source: new URL("./references/react-integration-patterns.md", import.meta.url),
      target: "references/react-integration-patterns.md",
      title: "react-integration-patterns.md",
      summary: "Tauri v2 + React 集成的最佳实践，包括 invoke 封装、事件监听生命周期和错误边界。",
      loadWhen: "需要设计 useInvoke Hook、管理 Tauri 事件 cleanup 或搭建 IPC 错误边界时读取。",
    }),
  ],
});
