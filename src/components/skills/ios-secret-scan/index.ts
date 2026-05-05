import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const iosSecretScanSkill = defineSkill({
  id: "ios-secret-scan",
  fullName: "iOS 应用安全扫描",
  description: "当需要扫描 iOS 应用中的硬编码凭据、云服务密钥、弱加密和安全配置问题时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for ios-secret-scan.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
