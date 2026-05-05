import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
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
  constraints: [
    "第一轮只做审计，不直接改代码；先给出 P0 / P1 / P2 风险清单。",
    "所有判断都要落到证据：文件、符号、配置项、屏幕流程或网络行为。",
    "如果证据不足，要明确写出“假设”和需要补看的文件，而不是凭经验断言。",
    "审核报告要同时覆盖合规、可审性和用户体验，不只盯 `Info.plist`。",
  ],
  checklist: [
    "优先检查 `Info.plist`、`*.entitlements`、`PrivacyInfo.xcprivacy`、StoreKit / 订阅代码、登录删除账号流程。",
    "重点排查：权限描述缺失、恢复购买缺失、第三方登录未覆盖 Sign in with Apple、外部支付引导、空白页 / 死路。",
    "输出必须按优先级排序，并附上可执行的验证步骤。",
    "如果需要真实走一遍审核路径，可配合 `ios-simulator-skill` 复现 UI 流程。",
    "交叉引用：界面合规与平台习惯看 `ios-hig-design`；门店更新文案看 `app-store-optimization`。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "泛泛而谈",
      pass: "证据驱动的风险表",
    }),
    defineAntiPattern({
      fail: "第一轮直接 patch",
      pass: "先审再修",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
