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
  checklist: [
    "所有用户输入拼接到查询 / 命令 / HTML / 路径的地方是否使用安全 API？",
    "密码存储是否使用 Argon2id / bcrypt？",
    "Token / 密钥生成是否使用 `crypto/rand`？",
    "敏感数据比较是否使用 `subtle.ConstantTimeCompare`？",
    "是否有硬编码密钥 / 凭据？",
    "是否运行过 `govulncheck`？",
    "TLS 配置是否禁用过时协议（TLS 1.0/1.1）？",
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
      summary: "Go 加密实践：密码哈希、Token 生成、TLS 配置与密钥管理的安全推荐。",
      loadWhen: "需要实现密码存储、Token 生成或 TLS 配置时读取。",
    }),
    defineReference({
      id: "injection",
      source: new URL("./references/injection.md", import.meta.url),
      target: "references/injection.md",
      title: "injection.md",
      summary: "Go 注入攻击防护：SQL 注入、命令注入、XSS、SSRF 与路径穿越的防范模式。",
      loadWhen: "需要审查或编写涉及外部输入拼接的代码时读取。",
    }),
  ],
});
