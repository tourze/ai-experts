import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { goErrorHandlingSkill } from "../go-error-handling/index";
import { goTestingPatternsSkill } from "../go-testing-patterns/index";

export const goSecuritySkill = defineSkill({
  id: "go-security",
  fullName: "go-security",
  description: "当 Go 代码涉及安全审查或编写安全敏感代码：SQL/命令注入、加密、认证、密钥管理、输入验证、XSS、SSRF、依赖漏洞扫描时使用。",
  useCases: [
    "编写或审查涉及用户输入拼接到 SQL / shell 命令 / HTML 的代码。",
    "实现 token 生成、密码存储、密钥管理、TLS 配置。",
    "执行 `govulncheck` 或评估第三方依赖的安全风险。",
    "需要防止路径穿越、SSRF、XSS 等注入类攻击。",
    "运行时安全（nil、panic、数据竞争）使用 `go-safety`；安全测试使用 `go-testing-patterns`。",
  ],
  constraints: [
    "对任何外部输入，回答三个问题：",
    "**信任边界在哪？** 哪些数据来自用户 / 网络 / 第三方，不可信？",
    "**攻击者能控制什么？** 输入参数、Header、URL、文件名、数据库字段？",
    "**爆炸半径多大？** 泄露密钥？执行任意命令？越权访问？",
  ],
  relatedSkills: [
    {
      get id() {
        return goTestingPatternsSkill.id;
      },
      reason: "运行时安全（nil、panic、数据竞争）使用 `go-safety`；安全测试使用 `go-testing-patterns`。",
    },
    {
      get id() {
        return goErrorHandlingSkill.id;
      },
      label: "go-safety",
      reason: "运行时安全（nil、panic、数据竞争）使用 `go-safety`；安全测试使用 `go-testing-patterns`。",
    },
  ],
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
  ],
});
