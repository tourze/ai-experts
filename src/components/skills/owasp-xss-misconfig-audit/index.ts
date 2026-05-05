import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const owaspXssMisconfigAuditSkill = defineSkill({
  id: "owasp-xss-misconfig-audit",
  fullName: "OWASP XSS 与安全配置审计",
  description: "当需要审计 XSS 跨站脚本、安全头配置缺失或依赖风险时使用。适用于 `innerHTML`/`dangerouslySetInnerHTML`/`v-html`/`document.write` 等 XSS 向量、CORS/CSP/HSTS/`helmet` 安全头审计、`package.json`/`Cargo.toml`/`go.mod`/`requirements.txt` 依赖风险扫描。",
  useCases: [
    "当需要审计 XSS 跨站脚本、安全头配置缺失或依赖风险时使用。适用于 `innerHTML`/`dangerouslySetInnerHTML`/`v-html`/`document.write` 等 XSS 向量、CORS/CSP/HSTS/`helmet` 安全头审计、`package.json`/`Cargo.toml`/`go.mod`/`requirements.txt` 依赖风险扫描。",
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
