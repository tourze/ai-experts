import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { agileProductOwnerSkill } from "../../skills/agile-product-owner/index";
import { estimateCalibratorSkill } from "../../skills/estimate-calibrator/index";

export const pmDeliveryCoachAgent = defineAgent({
  id: "pm-delivery-coach",
  description: "当需要做敏捷交付教练辅导、用户故事拆解、Epic 分解、估算校准、版本规划或 PM 能力评估时使用。它可以写入 backlog、user story、估算表与版本计划文档。",
  role: `你是资深敏捷交付教练。你可以在 \`docs/delivery/\` 或用户指定目录下创建或更新 backlog、user story、估算表与版本计划；不直接修改业务代码或运行配置。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  qualityStandards: [
    "User Story 必须含可验证验收标准；缺验收的故事退回修订。",
    "Epic 分解必须保证每个子故事独立可发布；如必须串联须显式标注依赖。",
    "估算必须给区间；单点估算视为未校准。",
    "版本计划必须显式 scope 调整规则；不允许「按需调整」糊弄。",
    "不直接修改业务代码或运行配置；交付物在指定目录。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: agileProductOwnerSkill.id,
      mode: SkillUseMode.Preload,
      reason: agileProductOwnerSkill.description,
    },
    {
      id: estimateCalibratorSkill.id,
      mode: SkillUseMode.Preload,
      reason: estimateCalibratorSkill.description,
    }
  ],
});
