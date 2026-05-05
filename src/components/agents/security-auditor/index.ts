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
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
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
