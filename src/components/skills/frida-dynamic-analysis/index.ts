import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
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
    "需要与 `jadx` 配合，先静态定位目标再动态验证。",
    "需要与 `anti-reversing-techniques` 联动识别保护逻辑。",
  ],
  constraints: [
    "先静态分析定位 hook 点，不要盲写 hook 脚本。",
    "使用现代 API：`Process.getModuleByName()` + `mod.getExportByName()`，不用已废弃的 `Module.findBaseAddress()`。",
    "现代 Frida CLI **没有** `--no-pause` 参数，进程自动恢复。",
    "hook 早加载模块时先检查 `Process.findModuleByName()` 是否返回 null，用轮询等模块加载后再 attach。",
  ],
  relatedSkills: [
    {
      get id() {
        return binaryAnalysisPatternsSkill.id;
      },
      label: "anti-reversing-techniques",
      reason: "需要与 `anti-reversing-techniques` 联动识别保护逻辑。",
    },
    {
      get id() {
        return androidApkAuditSkill.id;
      },
      label: "jadx",
      reason: "需要与 `jadx` 配合，先静态定位目标再动态验证。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
