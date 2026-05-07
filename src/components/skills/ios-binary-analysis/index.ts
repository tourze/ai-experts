import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
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
  antiPatterns: [
    defineAntiPattern({
      fail: "用旧版 class-dump",
      pass: "用 ipsw class-dump",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "提取并分析 iOS IPA / Mach-O / framework，建立 Info.plist、entitlements、类声明、第三方库和关键调用链的证据链。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认 IPA 是否可解包、主 Mach-O 路径、目标架构和 FairPlay 加密状态；命令细节读取 `analysis-runbook`。",
      "读取 Info.plist、entitlements 和 Frameworks 清单，标注 bundle、URL scheme、ATS、权限与第三方依赖。",
      "用 `ipsw class-dump` 生成头文件或目录，按 ViewController、ViewModel、Service、API、Repository 等命名线索建立结构地图。",
      "结合 `rg` 与 `strings` 搜索网络库、API 端点、认证 token 和关键业务类名，追踪 UI 到网络层的调用链。",
      "需要深入时用 otool、rizin 或同类工具查看动态库、ObjC 元数据和函数列表；运行时验证交给 Frida 相关 skill。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "IPA / Mach-O 提取路径、架构、加密状态和基础元数据。",
      "Info.plist、entitlements、URL scheme、ATS、权限声明和第三方 framework 清单。",
      "类 / 方法结构地图、关键调用链和 API / 认证线索。",
      "需要动态验证、脱壳或进一步反汇编的剩余问题。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "analysis-runbook",
      source: new URL("./references/analysis-runbook.md", import.meta.url),
      target: "references/analysis-runbook.md",
      title: "iOS 二进制分析命令 Runbook",
      summary: "IPA 解包、Info.plist、class dump、strings、otool 和 rizin 的常用命令流程。",
      loadWhen: "需要执行 iOS 二进制提取、类 dump 或调用链追踪命令时读取。",
    }),
  ],
});
