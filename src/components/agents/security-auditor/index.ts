import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { codeReviewAgentFrameworkSkill } from "../../skills/code-review-agent-framework/index.js";
import { securityThreatModelSkill } from "../../skills/security-threat-model/index.js";
import { frontendDynamicCodeProtectionSkill } from "../../skills/frontend-dynamic-code-protection/index.js";
import { sqlReviewOptimizationSkill } from "../../skills/sql-review-optimization/index.js";
import { owaspInjectionAuditSkill } from "../../skills/owasp-injection-audit/index.js";
import { owaspAuthDataAuditSkill } from "../../skills/owasp-auth-data-audit/index.js";
import { owaspXssMisconfigAuditSkill } from "../../skills/owasp-xss-misconfig-audit/index.js";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index.js";

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
      reason: "Declared by agent frontmatter.",
    },
    {
      id: securityThreatModelSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: frontendDynamicCodeProtectionSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: sqlReviewOptimizationSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: owaspInjectionAuditSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: owaspAuthDataAuditSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: owaspXssMisconfigAuditSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
