import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";
import { binaryAnalysisPatternsSkill } from "../binary-analysis-patterns/index";
import { fridaDynamicAnalysisSkill } from "../frida-dynamic-analysis/index";

export const iosBinaryAnalysisSkill = defineSkill({
  id: "ios-binary-analysis",
  fullName: "iOS 二进制分析",
  description: "当需要提取和分析 iOS IPA、Mach-O 二进制、dylib 或 framework，做类 dump 和调用链追踪时使用。",
  useCases: [
    "需要从 IPA 中提取 Mach-O 并用 ipsw class-dump 获取类/方法声明。",
    "需要追踪 ViewController → ViewModel → Service → API 的调用链。",
    "需要与 `frida-dynamic-analysis` 配合做运行时验证。",
    "需要与 `anti-reversing-techniques` 联动分析保护逻辑。",
  ],
  constraints: [
    "先用 ipsw class-dump（不是旧版 class-dump），它支持 Swift 和现代 ARM64e。",
    "Fat binary 先用 `lipo -thin arm64` 提取目标架构。",
    "class-dump 输出只是头文件，不包含实现——需要结合 strings 和反汇编工具交叉验证。",
    "区分 app 代码和 framework 代码：第三方 framework 通常在 `Frameworks/` 目录下。",
  ],
  checklist: [
    "确认 ipsw 已安装（`brew install blacktop/tap/ipsw`）。",
    "FairPlay DRM 加密的 IPA 需要先解密（`otool -l binary | grep cryptid`，cryptid=1 表示加密）。",
    "Swift 混淆后类名为乱码时用 `swift-demangle` 还原。",
    "列出 `Frameworks/` 下所有第三方 framework 及其版本。",
  ],
  relatedSkills: [
    {
      get id() {
        return binaryAnalysisPatternsSkill.id;
      },
      label: "anti-reversing-techniques",
      reason: "需要与 `anti-reversing-techniques` 联动分析保护逻辑。",
    },
    {
      get id() {
        return fridaDynamicAnalysisSkill.id;
      },
      reason: "需要与 `frida-dynamic-analysis` 配合做运行时验证。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
