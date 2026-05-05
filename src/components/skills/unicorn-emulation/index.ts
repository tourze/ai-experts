import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const unicornEmulationSkill = defineSkill({
  id: "unicorn-emulation",
  fullName: "Unicorn 模拟执行",
  description: "当需要用 Unicorn 引擎模拟执行特定函数、绕过环境依赖或离线调试加密/解密算法时使用。",
  useCases: [
    "需要在无完整运行环境下执行特定函数（解密、哈希、校验）。",
    "需要绕过 JNI、syscall、libc 等环境依赖做算法还原。",
    "需要与 [binary-analysis-patterns](../binary-analysis-patterns/SKILL.md) 配合，先静态理解再模拟验证。",
    "需要与 [frida-dynamic-analysis](../frida-dynamic-analysis/SKILL.md) 互补：Frida 需要真机，Unicorn 纯离线。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
