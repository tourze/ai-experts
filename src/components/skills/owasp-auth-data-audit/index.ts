import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const owaspAuthDataAuditSkill = defineSkill({
  id: "owasp-auth-data-audit",
  fullName: "OWASP 认证与数据安全审计",
  description: "当需要审计认证会话安全、密钥管理、敏感数据暴露或批量赋值漏洞时使用。适用于 token/JWT/session/cookie/OAuth 认证链路、`api_key`/`API_KEY`/`process.env` 密钥硬编码、`assign(`/`bind(`/`updateAll` 批量赋值等代码模式的安全审查。",
  useCases: [
    "当需要审计认证会话安全、密钥管理、敏感数据暴露或批量赋值漏洞时使用。适用于 token/JWT/session/cookie/OAuth 认证链路、`api_key`/`API_KEY`/`process.env` 密钥硬编码、`assign(`/`bind(`/`updateAll` 批量赋值等代码模式的安全审查。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
