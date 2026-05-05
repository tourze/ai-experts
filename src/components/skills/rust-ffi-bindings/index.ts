import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const rustFfiBindingsSkill = defineSkill({
  id: "rust-ffi-bindings",
  description: "当用户需要通过 FFI 集成 Rust 与 C/C++ 或其他语言时使用；涉及 extern C、#[no_mangle]、CStr/CString 或 opaque pointer 时触发。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for rust-ffi-bindings.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
