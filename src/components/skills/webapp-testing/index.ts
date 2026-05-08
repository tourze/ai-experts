import {
  InvocationPolicy,
  Platform,
  defineAsset,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { testingStrategySkill } from "../testing-strategy/index";

export const webappTestingSkill = defineSkill({
  id: "webapp-testing",
  fullName: "Web 应用测试",
  description: "当需要在真实浏览器中验证本地或可访问 Web 应用时使用。适用于“帮我点一下页面”“验证表单流程”“抓浏览器日志”“截图定位问题”“用 Playwright 测这个页面”等请求。",
  useCases: [
    "本地开发站点或测试环境页面需要真实浏览器验证。",
    "需要验证交互、表单、跳转、控制台日志、截图或响应式表现。",
    "需要把 Web 测试策略落成实际浏览器检查。",
    "需要在执行失败时保留证据用于复盘。",
  ],
  constraints: [
    "优先使用 Playwright 能力；如果环境不支持，再退回本地 Node + Playwright。",
    "开始前先确认目标地址可访问，不要盲点。",
    "选择器优先级：`data-testid` / `role` / 可访问名称，高于脆弱 CSS 选择器。",
    "关键步骤后要显式等待，不靠裸 `sleep`。",
    "失败时截图并记录浏览器控制台日志。",
    "结束后关闭浏览器上下文，避免遗留进程。",
    "需要本地辅助函数时使用 `test-helper` asset，不在运行时正文手写资产链接。",
  ],
  checklist: [
    "已确认目标地址可访问",
    "关键断言使用稳定选择器",
    "关键步骤后有显式等待",
    "失败时会截图或保留日志",
    "测试结束关闭浏览器资源",
    "没用固定 `sleep` 掩盖同步问题",
  ],
  relatedSkills: [
    {
      get id() {
        return testingStrategySkill.id;
      },
      reason: "需要把测试策略里的 Web 场景落成实际浏览器检查时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "易碎选择器",
      pass: "语义选择器",
    }),
    defineAntiPattern({
      fail: "固定 sleep",
      pass: "显式等待",
    }),
    defineAntiPattern({
      fail: "失败无证据",
      pass: "截图 + 日志",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认目标 URL 可访问和验证目标；本地开发站点需要确认 dev server 状态。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "优先用 Playwright 能力；环境不支持时退回本地 Node + Playwright，并复用 test-helper asset。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "选择器优先 data-testid、role、可访问名称；避免脆弱 CSS 选择器。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "导航、表单提交和异步状态后使用显式等待，如 waitForURL、locator 可见性或业务 ready 标记。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "失败时截图并收集控制台日志；结束后关闭浏览器上下文，避免遗留进程。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "目标 URL、浏览器验证范围、关键步骤、稳定选择器和显式等待方式。",
      "截图、控制台日志、错误信息、响应式观察和可复现步骤。",
      "需要 testing-strategy 联动的覆盖缺口或自动化测试建议。",
    ],
  }),
  assets: [
    defineAsset({
      id: "test-helper",
      source: new URL("./assets/test-helper.js", import.meta.url),
      target: "assets/test-helper.js",
    })
  ],
});
