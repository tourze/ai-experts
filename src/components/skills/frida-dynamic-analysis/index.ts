import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { androidApkAuditSkill } from "../android-apk-audit/index";
import { binaryAnalysisPatternsSkill } from "../binary-analysis-patterns/index";

export const fridaDynamicAnalysisSkill = defineSkill({
  id: "frida-dynamic-analysis",
  fullName: "Frida 动态分析",
  description: "当需要用 Frida 做运行时 hook、trace、bypass 或动态分析时使用；涉及 Interceptor、Java.perform、ObjC.classes、内存扫描或自适应 bypass。",
  useCases: [
    "需要 hook 函数调用、修改参数/返回值或 trace 执行路径。",
    "需要绕过 root 检测、SSL pinning、RASP 等运行时保护。",
    "需要先静态定位目标，再用动态 hook 验证保护逻辑或运行时行为。",
    "需要诊断 Frida 脚本崩溃、模块未加载、API 过时或数据打印错误。",
  ],
  constraints: [
    "先静态分析定位 hook 点，不要盲写 hook 脚本。",
    "使用现代 API：`Process.getModuleByName()` + `mod.getExportByName()`，不用已废弃的 `Module.findBaseAddress()`。",
    "现代 Frida CLI **没有** `--no-pause` 参数，进程自动恢复。",
    "hook 早加载模块时先检查 `Process.findModuleByName()` 是否返回 null，用轮询等模块加载后再 attach。",
  ],
  checklist: [
    "确认 frida-server 版本与 frida-tools 版本匹配。",
    "先用 `--pause` 确保 hook 在应用启动前生效（仅需要 hook 初始化逻辑时）。",
    "二进制数据用 `hexdump()` 而非 `toString()`。",
    "hook 回调包裹 try/catch，避免异常导致进程崩溃。",
  ],
  relatedSkills: [
    {
      get id() {
        return binaryAnalysisPatternsSkill.id;
      },
      reason: "需要先识别静态保护逻辑、字符串/xref 线索、函数边界或算法假设时联动。",
    },
    {
      get id() {
        return androidApkAuditSkill.id;
      },
      reason: "Android APK 需要 jadx 静态定位类、方法、签名校验或网络栈后再 hook 时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "通用脚本盲跑",
      pass: "针对目标定制",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先静态定位 hook 点：包名、PID、模块名、导出符号、Java 类/方法或 ObjC selector。",
      "选择启动方式：`frida -U -f <pkg> -l hook.js` spawn、`frida -U <pkg> -l hook.js` attach，或 `frida -U -p <pid> -l hook.js`。",
      "Native hook 用 `Process.getModuleByName()` 和 `mod.getExportByName()`，早加载模块先轮询 `Process.findModuleByName()`。",
      "Android Java hook 包在 `Java.perform()` 内；iOS ObjC hook 从 `ObjC.classes` 取 selector implementation。",
      "二进制数据用 `hexdump()`，hook 回调用 try/catch，避免脚本异常放大成目标崩溃。",
      "自适应 bypass 按静态定位、首次 hook、运行/崩溃/诊断、迭代修复推进；crash log 决定下一轮 hook 点。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "目标信息：设备、进程/包名、Frida 版本、模块/类/selector、启动方式和 hook 时机。",
      "Hook 脚本要点：native、Java 或 ObjC 入口、参数/返回值处理、日志和异常保护。",
      "Bypass 迭代记录：静态证据、运行结果、crash 信号、修复假设和下一轮验证。",
    ],
  }),
});
