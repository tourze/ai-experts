import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const laravelSecuritySkill = defineSkill({
  id: "laravel-security",
  fullName: "Laravel 安全基线",
  description: "当用户提到 Laravel 安全、Sanctum、Policy、FormRequest、文件上传安全、CORS、安全头或密钥管理时使用。",
  useCases: [
    "新增登录、API 令牌、策略、上传接口、Webhook 或任何处理用户输入的 Laravel 端点。",
    "需要为 Laravel 应用补齐认证授权、验证、速率限制和部署安全设置。",
    "发布前检查安全配置、签名链接、CORS 与日志脱敏是否到位。",
    "需要实现层面的配套测试时参考 [laravel-tdd](../laravel-tdd/SKILL.md)；需要发布前全量自检时参考 [laravel-verification](../laravel-verification/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
