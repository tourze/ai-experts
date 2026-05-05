import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const fridaDynamicAnalysisSkill = defineSkill({
  id: "frida-dynamic-analysis",
  fullName: "Frida 动态分析",
  description: "当需要用 Frida 做运行时 hook、trace、bypass 或动态分析时使用；涉及 Interceptor、Java.perform、ObjC.classes、内存扫描或自适应 bypass。",
  useCases: [
    "需要 hook 函数调用、修改参数/返回值或 trace 执行路径。",
    "需要绕过 root 检测、SSL pinning、RASP 等运行时保护。",
    "需要与 [jadx](../android-apk-audit/SKILL.md) 配合，先静态定位目标再动态验证。",
    "需要与 [anti-reversing-techniques](../binary-analysis-patterns/SKILL.md) 联动识别保护逻辑。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
