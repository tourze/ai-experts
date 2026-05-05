import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const rustFfiBindingsSkill = defineSkill({
  id: "rust-ffi-bindings",
  fullName: "Rust FFI Bindings",
  description: "当用户需要通过 FFI 集成 Rust 与 C/C++ 或其他语言时使用；涉及 extern C、#[no_mangle]、CStr/CString 或 opaque pointer 时触发。",
  useCases: [
    "将 Rust 库暴露给 C/Swift/Kotlin/Python 调用。",
    "设计跨 FFI 的字符串、错误码、回调或复杂类型方案。",
    "排查 FFI 段错误、double-free 或 panic 跨边界 UB。",
  ],
  constraints: [
    "FFI 函数必须 `#[no_mangle]` + `extern \"C\"`。",
    "字符串只用 `*const c_char` / `*mut c_char`。",
    "每函数文档注明内存所有权。",
    "每个 `Box::into_raw` 配对 `_free`，`_free` 处理 null。",
    "每个入口 `catch_unwind`；panic 跨 FFI 是 UB。",
    "复杂类型用 opaque pointer，暴露的结构体 `#[repr(C)]`。",
    "用 cbindgen / uniffi 生成绑定，禁手写头文件。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "patterns",
      source: new URL("./references/patterns.md", import.meta.url),
      target: "references/patterns.md",
      title: "patterns.md",
      summary: "Reference material for rust-ffi-bindings.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
