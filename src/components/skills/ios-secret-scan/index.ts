import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { fridaDynamicAnalysisSkill } from "../frida-dynamic-analysis/index";
import { iosBinaryAnalysisSkill } from "../ios-binary-analysis/index";

export const iosSecretScanSkill = defineSkill({
  id: "ios-secret-scan",
  fullName: "iOS 应用安全扫描",
  description: "当需要扫描 iOS 应用中的硬编码凭据、云服务密钥、弱加密和安全配置问题时使用。",
  useCases: [
    "需要在 IPA/Mach-O 中搜索硬编码 API key、云服务凭据和敏感字符串。",
    "需要审计 ATS 配置、证书 pinning、越狱检测和 Keychain 使用。",
    "需要与 `ios-binary-analysis` 配合：先提取再扫描。",
    "需要与 `frida-dynamic-analysis` 配合验证运行时保护有效性。",
  ],
  constraints: [
    "区分 client-safe key（Firebase API key、Stripe publishable key）和 server-only key（Stripe secret key、AWS secret）。",
    "字符串匹配命中后必须回看上下文判断——test data、注释、示例值都是误报。",
    "对每个发现标注严重级别和影响范围。",
    "先自动扫描，再人工分析高危发现。",
  ],
  checklist: [
    "Firebase API key 本身是 client-safe，但检查 Firestore/RTDB 规则是否开放。",
    "`pk_live_` 是 Stripe publishable key（安全），`sk_live_` 是 secret key（高危）。",
    "AWS `AKIA` 开头是 Access Key ID，配对的 Secret Access Key 才是核弹。",
    "JWT token 在 strings 中出现通常是过期 token，但仍需验证。",
  ],
  relatedSkills: [
    {
      get id() {
        return fridaDynamicAnalysisSkill.id;
      },
      reason: "需要与 `frida-dynamic-analysis` 配合验证运行时保护有效性。",
    },
    {
      get id() {
        return iosBinaryAnalysisSkill.id;
      },
      reason: "需要与 `ios-binary-analysis` 配合：先提取再扫描。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "命中即报告",
      pass: "分类 + 影响评估",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先用 iOS 二进制分析流程定位主 Mach-O、Info.plist、headers 和 strings 输出；命令细节读取 `scan-runbook`。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "按云服务、支付、通用 API key / secret、Bearer token 等类别扫描字符串，并对每个命中保留上下文。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "把命中分类为 client-safe、server-only、测试数据、示例值或疑似泄漏；高危值只报告脱敏片段。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "审计 ATS 配置、弱加密 API、Keychain 保护级别、越狱检测和反调试线索。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "必要时联动 Frida 做运行时验证，例如证书 pinning、越狱检测或密钥实际使用路径。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "按严重级别分组的凭据和安全配置发现，包含脱敏值、位置、上下文和误报概率。",
      "client-safe 与 server-only 密钥分类，以及可被攻击者利用的实际影响。",
      "ATS、弱加密、Keychain、越狱检测 / 反调试的审计结论。",
      "验证方式、修复步骤和需要运行时验证的剩余问题。",
    ],
  }),
  references: [
    defineReference({
      id: "scan-runbook",
      source: new URL("./references/scan-runbook.md", import.meta.url),
      target: "references/scan-runbook.md",
      title: "iOS 安全扫描命令与报告模板",
      summary: "硬编码凭据、ATS、弱加密、越狱检测扫描命令，以及发现报告格式。",
      loadWhen: "需要执行 iOS 安全扫描命令或输出标准化发现报告时读取。",
    }),
  ],
});
