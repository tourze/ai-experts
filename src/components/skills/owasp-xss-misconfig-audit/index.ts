import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const owaspXssMisconfigAuditSkill = defineSkill({
  id: "owasp-xss-misconfig-audit",
  fullName: "OWASP XSS 与安全配置审计",
  description: "当需要审计 XSS 跨站脚本、安全头配置缺失或依赖风险时使用。适用于 `innerHTML`/`dangerouslySetInnerHTML`/`v-html`/`document.write` 等 XSS 向量、CORS/CSP/HSTS/`helmet` 安全头审计、`package.json`/`Cargo.toml`/`go.mod`/`requirements.txt` 依赖风险扫描。",
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
      summary: "Eval cases for owasp-xss-misconfig-audit.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
