import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { fridaDynamicAnalysisSkill } from "../frida-dynamic-analysis/index";
import { iosBinaryAnalysisSkill } from "../ios-binary-analysis/index";

export const iosSecretScanSkill = defineSkill({
  id: "ios-secret-scan",
  fullName: "iOS 应用安全扫描",
  description: "当需要扫描 iOS 应用中的硬编码凭据、云服务密钥、弱加密和安全配置问题时使用。",
  useCases: [
    "需要在 IPA/Mach-O 中搜索硬编码 API key、云服务凭据和敏感字符串。",
    "需要审计 ATS 配置、证书 pinning、越狱检测和 Keychain 使用。",
    "需要与 `ios-binary-analysis` 配合：先提取再扫描。",
    "需要与 `frida-dynamic-analysis` 配合验证运行时保护有效性。",
  ],
  constraints: [
    "区分 client-safe key（Firebase API key、Stripe publishable key）和 server-only key（Stripe secret key、AWS secret）。",
    "字符串匹配命中后必须回看上下文判断——test data、注释、示例值都是误报。",
    "对每个发现标注严重级别和影响范围。",
    "先自动扫描，再人工分析高危发现。",
  ],
  checklist: [
    "Firebase API key 本身是 client-safe，但检查 Firestore/RTDB 规则是否开放。",
    "`pk_live_` 是 Stripe publishable key（安全），`sk_live_` 是 secret key（高危）。",
    "AWS `AKIA` 开头是 Access Key ID，配对的 Secret Access Key 才是核弹。",
    "JWT token 在 strings 中出现通常是过期 token，但仍需验证。",
  ],
  relatedSkills: [
    {
      get id() {
        return fridaDynamicAnalysisSkill.id;
      },
      reason: "需要与 `frida-dynamic-analysis` 配合验证运行时保护有效性。",
    },
    {
      get id() {
        return iosBinaryAnalysisSkill.id;
      },
      reason: "需要与 `ios-binary-analysis` 配合：先提取再扫描。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "命中即报告",
      pass: "分类 + 影响评估",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
