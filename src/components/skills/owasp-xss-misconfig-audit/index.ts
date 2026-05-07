import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const owaspXssMisconfigAuditSkill = defineSkill({
  id: "owasp-xss-misconfig-audit",
  fullName: "OWASP XSS 与安全配置审计",
  description: "当需要审计 XSS 跨站脚本、安全头配置缺失或依赖风险时使用。适用于 `innerHTML`/`dangerouslySetInnerHTML`/`v-html`/`document.write` 等 XSS 向量、CORS/CSP/HSTS/`helmet` 安全头审计、`package.json`/`Cargo.toml`/`go.mod`/`requirements.txt` 依赖风险扫描。",
  useCases: [
    "当需要审计 XSS 跨站脚本、安全头配置缺失或依赖风险时使用。适用于 `innerHTML`/`dangerouslySetInnerHTML`/`v-html`/`document.write` 等 XSS 向量、CORS/CSP/HSTS/`helmet` 安全头审计、`package.json`/`Cargo.toml`/`go.mod`/`requirements.txt` 依赖风险扫描。",
  ],
  constraints: [
    "每条 XSS、安全头或依赖风险发现必须绑定文件:行、配置值、代码片段或工具输出证据。",
    "XSS 审计必须按上下文编码、危险 API、富文本清洗、反射/存储/DOM 来源和 CSP 强度分层。",
    "安全头审计必须同时看主域、API 子域和 cookie 属性，不只看单一入口。",
    "依赖风险审计不能只看直接依赖；lockfile、间接依赖、EOL、供应链和许可证都要纳入。",
    "CSP 含 `unsafe-inline` 且没有 nonce/hash 时不能视为有效防线。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "用简单替换 `<`/`>` 代替上下文感知编码。",
      pass: "按 HTML、JS string、URL、CSS 上下文使用正确编码或框架自动转义。",
    }),
    defineAntiPattern({
      fail: "`Access-Control-Allow-Origin: *` 与 credentials 同用或反射 Origin 不校验。",
      pass: "使用显式 Origin 白名单并避免通配源携带凭据。",
    }),
    defineAntiPattern({
      fail: "只跑依赖审计工具但不读间接依赖和 lockfile 结果。",
      pass: "分析直接/间接依赖、修复版本、overrides/constraints 和可复现构建。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "审计 XSS 输出边界、安全头配置和依赖供应链风险，输出可验证的位置、证据和修复版本/策略。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先按触发信号路由：危险 DOM/API 为 XSS，CORS/CSP/HSTS/helmet/cookie 为安全头，依赖声明和 lockfile 为依赖风险。",
      "XSS 检查输出编码、框架自动转义、`innerHTML`/`dangerouslySetInnerHTML`/`v-html`/`document.write`/`eval`、富文本清洗和 URL/hash/postMessage/localStorage 来源。",
      "CSP 检查 `script-src`、`style-src`、`connect-src`、nonce/hash、`report-uri` 或 `report-to`，并标注 `unsafe-inline/eval` 风险。",
      "安全头检查 CORS 白名单、HSTS max-age/includeSubDomains、cookie Secure/httpOnly/SameSite、nosniff、X-Frame-Options、Referrer-Policy、Permissions-Policy 和版本泄漏头。",
      "依赖风险检查 NVD/GitHub Advisory/OSV、修复版本、间接依赖、lockfile、低维护包、typosquatting 和许可证兼容。",
      "每条发现按 confirmed、likely、speculative 标注可利用性，并给出最小修复和验证方式。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "XSS 与安全配置审计结果：XSS、安全头、依赖风险三个分区。",
      "每条发现：位置/配置、类型、严重度、编码或头策略、证据、可利用性和建议。",
      "依赖修复表：包名、当前版本、CVE/风险、修复版本、间接依赖路径和构建复现影响。",
    ],
  }),
  tools: [],
});
