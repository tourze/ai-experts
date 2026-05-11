import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { appStoreOptimizationSkill } from "../app-store-optimization/index";
import { iosHigDesignSkill } from "../ios-hig-design/index";
import { iosSimulatorSkillSkill } from "../ios-simulator-skill/index";

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
  relatedSkills: [
    {
      get skill() {
        return iosHigDesignSkill;
      },
      reason: "需要判断界面是否符合 iOS 平台习惯、权限前置说明或 HIG 合规时联动。",
    },
    {
      get skill() {
        return iosSimulatorSkillSkill;
      },
      reason: "需要真实走审核路径、截图、日志或无障碍树复现 UI 流程时联动。",
    },
    {
      get skill() {
        return appStoreOptimizationSkill;
      },
      reason: "需要撰写门店更新文案、发布说明或 ASO 元数据时联动。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先识别 App 核心用途、目标平台、首屏路径、审核账号、演示数据和 reviewer notes 是否齐全。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "检查权限文案、隐私清单、第三方 SDK、账号登录 / 删除、IAP / 订阅 / 恢复购买和外链支付。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "检查审核可达性：空状态、离线、崩溃、受限内容、付费墙、演示账号和核心功能是否能被 reviewer 复现。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "把每个风险写入 P0 / P1 / P2 风险表，证据必须落到文件、配置、符号、屏幕流程或网络行为。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "需要真实复现时联动 iOS Simulator；需要界面平台合规时联动 iOS HIG；模板读取 `review-templates` reference。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "第一轮只输出审计和修复建议；用户确认后再进入代码或配置修改。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "按 P0 / P1 / P2 排序的拒审风险表，含证据、影响、建议、成本和置信度。",
      "审核路径、测试账号、演示数据、权限请求和付费流程的可复现说明。",
      "Reviewer Notes 草稿和提交前检查清单。",
      "证据不足的假设、需要补看的文件或需要模拟器复现的步骤。",
    ],
  }),
  references: [
    defineReference({
      id: "review-templates",
      source: new URL("./references/review-templates.md", import.meta.url),
      target: "references/review-templates.md",
      title: "App Store 审核风险表与 Reviewer Notes 模板",
      summary: "审核切入点、P0/P1/P2 风险登记表和 reviewer notes 草稿结构。",
      loadWhen: "需要输出提审前风险登记表或准备 reviewer notes 时读取。",
    }),
  ],
});
