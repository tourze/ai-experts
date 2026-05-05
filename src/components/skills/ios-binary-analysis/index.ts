import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const iosBinaryAnalysisSkill = defineSkill({
  id: "ios-binary-analysis",
  fullName: "iOS 二进制分析",
  description: "当需要提取和分析 iOS IPA、Mach-O 二进制、dylib 或 framework，做类 dump 和调用链追踪时使用。",
  useCases: [
    "需要从 IPA 中提取 Mach-O 并用 ipsw class-dump 获取类/方法声明。",
    "需要追踪 ViewController → ViewModel → Service → API 的调用链。",
    "需要与 [frida-dynamic-analysis](../frida-dynamic-analysis/SKILL.md) 配合做运行时验证。",
    "需要与 [anti-reversing-techniques](../binary-analysis-patterns/SKILL.md) 联动分析保护逻辑。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
