import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const iosSecretScanSkill = defineSkill({
  id: "ios-secret-scan",
  fullName: "iOS 应用安全扫描",
  description: "当需要扫描 iOS 应用中的硬编码凭据、云服务密钥、弱加密和安全配置问题时使用。",
  useCases: [
    "需要在 IPA/Mach-O 中搜索硬编码 API key、云服务凭据和敏感字符串。",
    "需要审计 ATS 配置、证书 pinning、越狱检测和 Keychain 使用。",
    "需要与 [ios-binary-analysis](../ios-binary-analysis/SKILL.md) 配合：先提取再扫描。",
    "需要与 [frida-dynamic-analysis](../frida-dynamic-analysis/SKILL.md) 配合验证运行时保护有效性。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
