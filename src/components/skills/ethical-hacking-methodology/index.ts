import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { wiresharkAnalysisSkill } from "../wireshark-analysis/index";

export const ethicalHackingMethodologySkill = defineSkill({
  id: "ethical-hacking-methodology",
  fullName: "授权渗透测试方法论",
  description: "当用户需要在合法授权范围内做 Nmap 侦察、Linux 提权、AD 攻击、路径遍历、认证绕过、deeplink 滥用、API Fuzzing 或常见 Web 漏洞渗透测试时使用。",
  useCases: [
    "需要从信息收集、验证、利用、横向移动到报告闭环组织测试。",
    "需要把 [nmap](references/nmap.md) 的侦察结果和 `wireshark-analysis` 的流量证据串起来。",
    "需要建立统一的发现分级、证据留存和复测策略。",
  ],
  constraints: [
    "没有书面授权、范围和时间窗口时不进入实施阶段。",
    "先证据化、再利用；先低风险验证、再考虑高影响操作。",
    "把目标资产、入口、凭据、影响和回滚方案写清楚。",
    "任何越界发现都要立即停止并升级确认。",
  ],
  checklist: [
    "每个发现都要有证据、影响、利用条件和修复建议。",
    "区分已证实风险、潜在风险和待验证假设。",
    "记录时间线、工具版本、关键输入和输出。",
    "最终报告覆盖范围、限制、发现、复测结论。",
  ],
  relatedSkills: [
    {
      get id() {
        return wiresharkAnalysisSkill.id;
      },
      reason: "需要把 nmap 的侦察结果和 `wireshark-analysis` 的流量证据串起来。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "工具输出当结论",
      pass: "工具 → 验证 → 影响",
    }),
    defineAntiPattern({
      fail: "范围不清就动手",
      pass: "范围 + 授权先行",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "在明确授权范围内组织渗透测试，从范围确认、低噪声侦察、证据化验证到报告和复测闭环。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认书面授权、范围、联系人、禁测项、时间窗口、成功标准和回滚/升级路径。",
      "低噪声侦察与资产归类后，再按假设驱动做低风险验证；高影响操作必须先确认影响和回滚。",
      "按目标场景读取 nmap、AD、Linux 提权、路径遍历、认证绕过、deeplink、API fuzzing 或 Web 漏洞 references。",
      "每个发现都记录证据、影响、利用条件、修复建议和复测结论；越界发现立即停止并升级确认。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "授权范围、测试时间线、资产入口、工具版本、关键输入输出和越界处理记录。",
      "发现清单：证据、影响、利用条件、风险分级、修复建议和复测结果。",
      "范围限制、未验证假设、后续复测策略和交付报告结构。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "active-directory-attacks",
      source: new URL("./references/active-directory-attacks.md", import.meta.url),
      target: "references/active-directory-attacks.md",
      title: "active-directory-attacks.md",
      summary: "Active Directory 攻击面分析与常用攻击手法详解。",
      loadWhen: "需要评估 AD 环境安全或执行横向移动测试时读取。",
    }),
    defineReference({
      id: "api-fuzzing-bug-bounty",
      source: new URL("./references/api-fuzzing-bug-bounty.md", import.meta.url),
      target: "references/api-fuzzing-bug-bounty.md",
      title: "api-fuzzing-bug-bounty.md",
      summary: "API Fuzzing 测试方法论与漏洞赏金场景的测试策略。",
      loadWhen: "需要对 REST/GraphQL API 执行 Fuzzing 测试或挖掘 API 漏洞时读取。",
    }),
    defineReference({
      id: "broken-authentication",
      source: new URL("./references/broken-authentication.md", import.meta.url),
      target: "references/broken-authentication.md",
      title: "broken-authentication.md",
      summary: "常见认证机制的绕过技术与检测方法。",
      loadWhen: "需要测试认证模块的安全性或复现认证绕过漏洞时读取。",
    }),
    defineReference({
      id: "file-path-traversal",
      source: new URL("./references/file-path-traversal.md", import.meta.url),
      target: "references/file-path-traversal.md",
      title: "file-path-traversal.md",
      summary: "文件路径遍历漏洞的利用技术与检测防御方法。",
      loadWhen: "需要测试路径遍历漏洞或审查文件操作安全性时读取。",
    }),
    defineReference({
      id: "intent-deeplink-abuse",
      source: new URL("./references/intent-deeplink-abuse.md", import.meta.url),
      target: "references/intent-deeplink-abuse.md",
      title: "intent-deeplink-abuse.md",
      summary: "Android Intent 与 DeepLink 滥用攻击面分析与测试方法。",
      loadWhen: "需要测试移动应用的 deeplink 安全性或检测意图劫持风险时读取。",
    }),
    defineReference({
      id: "linux-privilege-escalation",
      source: new URL("./references/linux-privilege-escalation.md", import.meta.url),
      target: "references/linux-privilege-escalation.md",
      title: "linux-privilege-escalation.md",
      summary: "Linux 系统提权的常见技术手段与检测策略。",
      loadWhen: "需要评估 Linux 主机安全或执行提权测试时读取。",
    }),
    defineReference({
      id: "nmap",
      source: new URL("./references/nmap.md", import.meta.url),
      target: "references/nmap.md",
      title: "nmap.md",
      summary: "Nmap 侦察技术指南，包括扫描策略、脚本使用和结果分析。",
      loadWhen: "需要规划或执行网络侦察扫描、解读 nmap 输出时读取。",
    }),
    defineReference({
      id: "top-web-vulnerabilities",
      source: new URL("./references/top-web-vulnerabilities.md", import.meta.url),
      target: "references/top-web-vulnerabilities.md",
      title: "top-web-vulnerabilities.md",
      summary: "OWASP Top 10 及常见 Web 漏洞的检测与利用技术。",
      loadWhen: "需要测试 Web 应用常见漏洞或审查安全修复方案时读取。",
    }),
  ],
});
