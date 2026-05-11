import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { goConcurrencyPatternsSkill } from "../go-concurrency-patterns/index";
import { goErrorHandlingSkill } from "../go-error-handling/index";
import { goTestingPatternsSkill } from "../go-testing-patterns/index";

export const goSecuritySkill = defineSkill({
  id: "go-security",
  fullName: "Go 安全",
  description: "当 Go 代码涉及安全审查或编写安全敏感代码：SQL/命令注入、加密、认证、密钥管理、输入验证、XSS、SSRF、依赖漏洞扫描时使用。",
  useCases: [
    "编写或审查涉及用户输入拼接到 SQL / shell 命令 / HTML 的代码。",
    "实现 token 生成、密码存储、密钥管理、TLS 配置。",
    "执行 `govulncheck` 或评估第三方依赖的安全风险。",
    "需要防止路径穿越、SSRF、XSS 等注入类攻击。",
    "panic / 错误边界使用 `go-error-handling`；数据竞争使用 `go-concurrency-patterns`；安全测试使用 `go-testing-patterns`。",
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
      get skill() {
        return goTestingPatternsSkill;
      },
      reason: "需要为安全修复补回归测试、table-driven tests、HTTP 测试或 mock 边界时联动。",
    },
    {
      get skill() {
        return goErrorHandlingSkill;
      },
      reason: "panic、错误传播、sentinel error 或边界错误合同影响安全行为时联动。",
    },
    {
      get skill() {
        return goConcurrencyPatternsSkill;
      },
      reason: "数据竞争、goroutine 泄漏或并发取消问题影响安全边界时联动。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认攻击面、输入边界、认证状态、敏感数据和外部调用路径。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "按 DREAD 简化严重性评级排序，先处理远程无需认证和敏感数据泄露风险。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "逐项检查参数化 SQL、命令参数分离、html/template、URL allowlist、路径根限制、crypto/rand、密码哈希和 govulncheck。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "严重性、漏洞速查和防御代码读取 `security-patterns`；加密和注入深入资料读取对应 references。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "按严重性排序的 Go 安全发现、证据、影响和修复建议。",
      "输入验证、输出编码、依赖扫描、密钥和密码学处理结论。",
      "需要补的安全测试、回归验证和剩余风险。",
    ],
  }),
  references: [
    defineReference({
      id: "security-patterns",
      source: new URL("./references/security-patterns.md", import.meta.url),
      target: "references/security-patterns.md",
      title: "Go 安全模式速查",
      summary: "DREAD 简化评级、常见漏洞防御表和参数化查询、命令执行、HTML 转义、crypto/rand、常量时间比较示例。",
      loadWhen: "需要快速审查 Go 常见安全漏洞或选择防御 API 时读取。",
    }),
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
