import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { sqlReviewOptimizationSkill } from "../sql-review-optimization/index";

export const owaspInjectionAuditSkill = defineSkill({
  id: "owasp-injection-audit",
  fullName: "OWASP 注入审计",
  description: "当需要审计命令注入、SSRF、路径遍历等注入类漏洞时使用。适用于 `exec(`/`spawn(`/`system(`、`fetch(`/`axios.`/SSRF、`path.join`/`../` 等代码模式。SQL 注入分流到 `sql-review-optimization`。",
  useCases: [
    "当需要审计命令注入、SSRF、路径遍历等注入类漏洞时使用。适用于 `exec(`/`spawn(`/`system(`、`fetch(`/`axios.`/SSRF、`path.join`/`../` 等代码模式。SQL 注入分流到 `sql-review-optimization`。",
  ],
  constraints: [
    "本 skill 覆盖命令注入、SSRF、路径遍历；SQL 字符串拼接或 ORM raw query 分流到 `sql-review-optimization`。",
    "每条发现必须绑定文件:行、代码片段、攻击向量和可利用性评估。",
    "黑名单字符过滤、简单字符串替换或只检查主机名片段不能视为有效防护。",
    "确认/可能/推测要分开标注；没有输入可控路径证据时不声称 confirmed。",
    "修复建议必须落到白名单、参数数组、协议/网段限制、路径规范化或 ID 映射等具体控制。",
  ],
  relatedSkills: [
    {
      get skill() {
        return sqlReviewOptimizationSkill;
      },
      reason: "发现 SQL 字符串拼接、ORM raw query 或模板 SQL 注入风险时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "用户输入黑名单过滤后拼接进命令或 shell 字符串。",
      pass: "使用参数数组、白名单参数和最小权限执行环境。",
    }),
    defineAntiPattern({
      fail: "SSRF 只拒绝 localhost 字符串或跟随重定向不复查目标。",
      pass: "限制协议、拒绝内网/metadata 网段，并在重定向后重新校验。",
    }),
    defineAntiPattern({
      fail: "`path.join(baseDir, userInput)` 后不检查结果是否仍在 baseDir 内。",
      pass: "规范化路径、校验前缀、使用随机文件名或 ID 映射。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先按触发信号分类：命令执行、SSRF、路径遍历；SQL 字符串拼接、ORM raw query 或模板 SQL 直接转 `sql-review-optimization`。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "命令注入检查用户输入是否进入 `exec`、`spawn`、`system`、`eval`、`Runtime.exec` 或 `subprocess`，以及是否启用 shell 模式。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "命令执行防护只认可参数数组、白名单参数、严格转义、最小权限用户和容器 capability/seccomp/AppArmor 控制。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "SSRF 检查 URL 来源、协议白名单、内网/metadata 网段、重定向复查和 DNS rebinding 防护。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "路径遍历检查用户输入路径、编码变体、绝对路径、符号链接、zip slip、上传目录和文件名策略。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "每项发现评估 confirmed、likely 或 speculative，并写出攻击路径和最小修复。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "注入审计结果：命令注入、SSRF、路径遍历三个分区；SQL 注入分流记录单独列出。",
      "每条发现：文件:行、代码片段、输入来源、攻击向量、严重度、可利用性和证据。",
      "修复建议：参数数组/白名单、协议和网段限制、路径规范化、ID 映射、权限与沙箱控制。",
    ],
  }),
});
