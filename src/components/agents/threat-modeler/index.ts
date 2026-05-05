import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { securityThreatModelSkill } from "../../skills/security-threat-model/index.js";
import { securityOwnershipMapSkill } from "../../skills/security-ownership-map/index.js";

export const threatModelerAgent = defineAgent({
  id: "threat-modeler",
  description: "当需要在系统设计、变更评审或合规审查阶段建立威胁模型、识别信任边界与资产、生成 STRIDE 分析与攻击树、推导安全需求或映射缓解控制时使用。它可以将威胁模型与安全需求文档写入用户指定目录。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: securityThreatModelSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: securityOwnershipMapSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
