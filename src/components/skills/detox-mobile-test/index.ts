import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const detoxMobileTestSkill = defineSkill({
  id: "detox-mobile-test",
  fullName: "Detox 移动端测试",
  description: "当用户要编写或排查 Detox E2E 测试、移动端自动化、flaky 测试、CI 设备启动或 matcher 等待问题时使用。",
  useCases: [
    "React Native 项目需要覆盖登录、下单、支付、权限、深链等关键 E2E 流程。",
    "CI 上的 Detox 用例经常 flaky，需要收紧选择器和等待策略。",
    "需要把本地运行、模拟器/模拟机配置与 CI 执行命令统一起来。",
    "单元测试与组件测试任务更适合联动 `javascript-typescript-jest`。",
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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Reference material for detox-mobile-test.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
