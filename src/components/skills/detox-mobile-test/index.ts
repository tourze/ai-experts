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
import { javascriptTypescriptJestSkill } from "../javascript-typescript-jest/index";

export const detoxMobileTestSkill = defineSkill({
  id: "detox-mobile-test",
  fullName: "Detox 移动端测试",
  description: "当用户要编写或排查 Detox E2E 测试、移动端自动化、flaky 测试、CI 设备启动或 matcher 等待问题时使用。",
  useCases: [
    "React Native 项目需要覆盖登录、下单、支付、权限、深链等关键 E2E 流程。",
    "CI 上的 Detox 用例经常 flaky，需要收紧选择器和等待策略。",
    "需要把本地运行、模拟器/模拟机配置与 CI 执行命令统一起来。",
  ],
  constraints: [
    "选择器优先 `testID` / `by.id()`；`by.text()` 只能当补充，不做主定位手段。",
    "禁止无条件 `sleep`；等待必须绑定可观察状态，用 `waitFor(...).toBeVisible()` 等显式同步。",
    "每个测试独立可重跑，不依赖前一个用例留下的登录态或数据。",
    "CI 里优先跑 release 或接近生产的构建；debug 构建更容易放大时序噪音。",
    "用例只断言用户可感知的行为，不把内部实现细节暴露为断言前提。",
  ],
  checklist: [
    "`.detoxrc.*` 中的 app/device/configuration 名称是否与 CI 命令一致？",
    "关键元素是否都具备稳定 `testID`？",
    "等待逻辑是否基于可见状态，而不是固定延时？",
    "每条用例是否可独立运行，不依赖前置状态？",
    "构建方式、模拟器/模拟机版本、Jest 配置是否已统一？",
    "失败时是否能通过截图、日志、录像快速定位问题？",
  ],
  relatedSkills: [
    {
      get id() {
        return javascriptTypescriptJestSkill.id;
      },
      reason: "任务转为单元测试、组件测试、Jest 配置或非 E2E 断言设计时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "by.text 当主选择器",
      pass: "testID 优先",
    }),
    defineAntiPattern({
      fail: "sleep 等异步",
      pass: "waitFor 显式同步",
    }),
    defineAntiPattern({
      fail: "测试间复用状态",
      pass: "每测试独立",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认 React Native 项目、Detox 配置、app/device/configuration 名称、本地与 CI 命令是否一致。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "关键流程用 testID/by.id 作为主选择器，by.text 只做补充；断言用户可感知行为，不依赖内部实现。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "每条用例独立启动和清理状态，避免依赖前一个测试的登录态、缓存或数据。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "所有异步等待绑定可观察状态，如 waitFor(...).toBeVisible()，禁止固定 sleep 掩盖时序问题。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "复杂配置、flaky 排查、高级等待或 matcher 策略读取 advanced-patterns。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Detox 配置审查：app/device/configuration、构建模式、模拟器/模拟机和 Jest 配置一致性。",
      "E2E 用例结构、testID 覆盖、显式等待、独立状态和用户可感知断言。",
      "CI/flaky 风险、失败截图/日志/录像证据和需要 advanced-patterns 的复杂场景。",
    ],
  }),
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Detox 移动端测试的高级模式，包括复杂选择器、自定义匹配器和性能测试方案。",
      loadWhen: "需要处理复杂的 Detox 测试场景、排查 flaky 测试或实现高级等待策略时读取。",
    }),
  ],
});
