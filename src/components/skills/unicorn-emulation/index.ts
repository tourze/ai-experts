import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";
import { binaryAnalysisPatternsSkill } from "../binary-analysis-patterns/index";
import { fridaDynamicAnalysisSkill } from "../frida-dynamic-analysis/index";

export const unicornEmulationSkill = defineSkill({
  id: "unicorn-emulation",
  fullName: "Unicorn 模拟执行",
  description: "当需要用 Unicorn 引擎模拟执行特定函数、绕过环境依赖或离线调试加密/解密算法时使用。",
  useCases: [
    "需要在无完整运行环境下执行特定函数（解密、哈希、校验）。",
    "需要绕过 JNI、syscall、libc 等环境依赖做算法还原。",
    "需要与 `binary-analysis-patterns` 配合，先静态理解再模拟验证。",
    "需要与 `frida-dynamic-analysis` 互补：Frida 需要真机，Unicorn 纯离线。",
  ],
  constraints: [
    "先裸加载文件映射内存，不要解析 ELF/PE 头——只模拟目标函数，不是整个程序。",
    "先识别外部调用依赖（JNI/libc/syscall），用 hook 模拟返回值。",
    "优先用 `UC_HOOK_BLOCK` 做块级 trace，`UC_HOOK_CODE` 只用在小范围。",
    "崩溃时读 callback 输出诊断，不要盲目重跑。",
  ],
  relatedSkills: [
    {
      get id() {
        return fridaDynamicAnalysisSkill.id;
      },
      reason: "需要与 `frida-dynamic-analysis` 互补：Frida 需要真机，Unicorn 纯离线。",
    },
    {
      get id() {
        return binaryAnalysisPatternsSkill.id;
      },
      reason: "需要与 `binary-analysis-patterns` 配合，先静态理解再模拟验证。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
