import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const goSecuritySkill = defineSkill({
  id: "go-security",
  description: "当 Go 代码涉及安全审查或编写安全敏感代码：SQL/命令注入、加密、认证、密钥管理、输入验证、XSS、SSRF、依赖漏洞扫描时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "cryptography",
      source: new URL("./references/cryptography.md", import.meta.url),
      target: "references/cryptography.md",
      title: "cryptography.md",
      summary: "Reference material for go-security.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "injection",
      source: new URL("./references/injection.md", import.meta.url),
      target: "references/injection.md",
      title: "injection.md",
      summary: "Reference material for go-security.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for go-security.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
