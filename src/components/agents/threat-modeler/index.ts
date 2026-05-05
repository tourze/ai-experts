import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { securityThreatModelSkill } from "../../skills/security-threat-model/index";
import { securityOwnershipMapSkill } from "../../skills/security-ownership-map/index";

export const threatModelerAgent = defineAgent({
  id: "threat-modeler",
  description: "当需要在系统设计、变更评审或合规审查阶段建立威胁模型、识别信任边界与资产、生成 STRIDE 分析与攻击树、推导安全需求或映射缓解控制时使用。它可以将威胁模型与安全需求文档写入用户指定目录。",
  role: `你是资深安全架构师。你可以读取代码、设计文档与现有威胁模型，并在用户指定的目录（默认 \`docs/security/\`）下创建或更新威胁模型、攻击树、安全需求与缓解映射文档；不修改业务代码、不改变运行时配置。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: securityThreatModelSkill.id,
      mode: SkillUseMode.Preload,
      reason: securityThreatModelSkill.description,
    },
    {
      id: securityOwnershipMapSkill.id,
      mode: SkillUseMode.Preload,
      reason: securityOwnershipMapSkill.description,
    }
  ],
});
