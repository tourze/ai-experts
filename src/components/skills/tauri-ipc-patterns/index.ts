import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const tauriIpcPatternsSkill = defineSkill({
  id: "tauri-ipc-patterns",
  fullName: "Tauri v2 高级 IPC 模式",
  description: "当用户需要高级 IPC 模式、自定义错误、判别联合事件、Channel<T> 流、多窗口路由、二进制传输或批量命令时使用。",
  useCases: [
    "自定义错误类型替代 `Result<T, String>`",
    "判别联合事件、多窗口精确路由",
    "`Channel<T>` 高频推送、二进制零拷贝",
    "自定义命令权限定义、批量命令优化",
  ],
  constraints: [
    "错误类型必须 impl `serde::Serialize`，序列化为结构体非纯字符串",
    "事件枚举用 `#[serde(tag = \"event\", content = \"data\")]`",
    "`Channel<T>` 单命令高频流；`emit()` 广播；`invoke()` 请求-响应",
    "权限标识符遵循 `<plugin>:<action>-<command>` 约定",
    "多窗口必须 `emit_to()` / `emit_filter()` 精确路由",
    "二进制用 `tauri::ipc::Request/Response` 零拷贝",
    "超 1ms 同步命令必须改 async",
    "批量模式单次 invoke 传操作数组减少往返",
  ],
  checklist: [
    "错误是否序列化为结构化 JSON？",
    "事件枚举与前端 TS 类型一一对应？",
    "权限文件在 `permissions/` 并被 capability 引用？",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "String 错误",
      pass: "结构化错误",
    }),
    defineAntiPattern({
      fail: "emit 广播隐私数据",
      pass: "emit_to 精确路由：详见 [references/](references/)。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先判断通信模式：`invoke()` 请求响应、`emit()` 事件广播、`Channel<T>` 高频流或二进制传输。",
      "读取 `ipc-advanced-patterns` reference，按需求选择结构化错误、判别联合事件、多窗口路由或批量命令。",
      "把 Rust 错误序列化为结构化 JSON，并同步前端 TypeScript 类型。",
      "多窗口数据必须用 `emit_to()` 或 `emit_filter()` 精确路由，避免广播隐私数据。",
      "超过 1ms 的同步命令改 async；高频消息用 Channel，批量操作合并往返。",
      "输出权限、事件类型、命令签名、错误结构和前端封装建议。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "IPC 模式选择和吞吐/路由理由。",
      "Rust 命令、事件、错误结构和权限设计。",
      "前端 TypeScript 类型、调用封装和 cleanup 策略。",
      "性能、隐私、多窗口和批量化风险检查。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "ipc-advanced-patterns",
      source: new URL("./references/ipc-advanced-patterns.md", import.meta.url),
      target: "references/ipc-advanced-patterns.md",
      title: "ipc-advanced-patterns.md",
      summary: "Tauri v2 高级 IPC 模式，包括自定义错误、判别联合事件、Channel<T> 流、多窗口路由和二进制传输。",
      loadWhen: "需要实现结构化错误、高频推送、多窗口事件路由或自定义命令权限时读取。",
    }),
  ],
});
