import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const owaspAuthDataAuditSkill = defineSkill({
  id: "owasp-auth-data-audit",
  fullName: "OWASP 认证与数据安全审计",
  description: "当需要审计认证会话安全、密钥管理、敏感数据暴露或批量赋值漏洞时使用。适用于 token/JWT/session/cookie/OAuth 认证链路、`api_key`/`API_KEY`/`process.env` 密钥硬编码、`assign(`/`bind(`/`updateAll` 批量赋值等代码模式的安全审查。",
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
      summary: "Eval cases for owasp-auth-data-audit.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
