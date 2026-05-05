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
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
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
