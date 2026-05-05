import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const appleAppstoreReviewerSkill = defineSkill({
  id: "apple-appstore-reviewer",
  fullName: "App Store 审核审查",
  description: "当用户要从 App Store 审核视角审查 iOS/macOS 应用、识别拒审风险或准备提审材料时使用。",
  useCases: [
    "用户要求从 App Review 角度审计代码库、配置、权限或付费流程。",
    "需要在提审前找出高概率拒审项、信息缺失和审核路径阻塞点。",
    "需要生成审核备注、测试账号说明或提交前检查清单。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
