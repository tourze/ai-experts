import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeReviewAgentFrameworkSkill } from "../../skills/code-review-agent-framework/index";
import { securityThreatModelSkill } from "../../skills/security-threat-model/index";
import { frontendDynamicCodeProtectionSkill } from "../../skills/frontend-dynamic-code-protection/index";
import { sqlReviewOptimizationSkill } from "../../skills/sql-review-optimization/index";
import { owaspInjectionAuditSkill } from "../../skills/owasp-injection-audit/index";
import { owaspAuthDataAuditSkill } from "../../skills/owasp-auth-data-audit/index";
import { owaspXssMisconfigAuditSkill } from "../../skills/owasp-xss-misconfig-audit/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const securityAuditorAgent = defineAgent({
  id: "security-auditor",
  description: "当需要对应用层代码做只读漏洞审计，识别 OWASP top 10 模式、认证与会话缺陷、敏感数据流、文件路径风险、API 输入校验缺口或前端防刷保护缺口时使用。",
  role: `你是资深应用安全工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 只用于只读探测、版本查询、git 历史、文件统计或本 agent 明确允许的运行时检查。禁止安装依赖、删除/移动文件、运行破坏性命令，除非本文件在特定场景中明确允许。",
  ],
  qualityStandards: [
    "区分已确认漏洞（confirmed）/ 潜在风险（likely）/ 推测风险（speculative）。",
    "按可利用性和业务影响排序，不按数量排序。",
    "未覆盖的入口和边界必须显式列出，标注为\"未审计\"。",
    "每条发现必须有可核验的代码位置，不可凭经验猜。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codeReviewAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeReviewAgentFrameworkSkill.description,
    },
    {
      id: securityThreatModelSkill.id,
      mode: SkillUseMode.Preload,
      reason: securityThreatModelSkill.description,
    },
    {
      id: frontendDynamicCodeProtectionSkill.id,
      mode: SkillUseMode.Preload,
      reason: frontendDynamicCodeProtectionSkill.description,
    },
    {
      id: sqlReviewOptimizationSkill.id,
      mode: SkillUseMode.Preload,
      reason: sqlReviewOptimizationSkill.description,
    },
    {
      id: owaspInjectionAuditSkill.id,
      mode: SkillUseMode.Preload,
      reason: owaspInjectionAuditSkill.description,
    },
    {
      id: owaspAuthDataAuditSkill.id,
      mode: SkillUseMode.Preload,
      reason: owaspAuthDataAuditSkill.description,
    },
    {
      id: owaspXssMisconfigAuditSkill.id,
      mode: SkillUseMode.Preload,
      reason: owaspXssMisconfigAuditSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
