import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const owaspInjectionAuditSkill = defineSkill({
  id: "owasp-injection-audit",
  fullName: "OWASP 注入审计",
  description: "当需要审计命令注入、SSRF、路径遍历等注入类漏洞时使用。适用于 `exec(`/`spawn(`/`system(`、`fetch(`/`axios.`/SSRF、`path.join`/`../` 等代码模式。SQL 注入分流到 `sql-review-optimization`。",
  useCases: [
    "当需要审计命令注入、SSRF、路径遍历等注入类漏洞时使用。适用于 `exec(`/`spawn(`/`system(`、`fetch(`/`axios.`/SSRF、`path.join`/`../` 等代码模式。SQL 注入分流到 `sql-review-optimization`。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
