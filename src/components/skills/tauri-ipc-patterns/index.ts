import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
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
  body: new URL("./SKILL.body.md", import.meta.url),
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
