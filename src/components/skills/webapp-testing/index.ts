import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineSkill,
} from "../../sdk";
import { testingStrategySkill } from "../testing-strategy/index";

export const webappTestingSkill = defineSkill({
  id: "webapp-testing",
  fullName: "Web 应用测试",
  description: "当需要在真实浏览器中验证本地或可访问 Web 应用时使用。适用于“帮我点一下页面”“验证表单流程”“抓浏览器日志”“截图定位问题”“用 Playwright 测这个页面”等请求。",
  useCases: [
    "本地开发站点或测试环境页面需要真实浏览器验证。",
    "需要验证交互、表单、跳转、控制台日志、截图或响应式表现。",
    "需要把 `testing-strategy` 里的 Web 场景落成实际浏览器检查。",
    "需要在执行失败时保留证据用于复盘。",
  ],
  constraints: [
    "优先使用 Playwright 能力；如果环境不支持，再退回本地 Node + Playwright。",
    "开始前先确认目标地址可访问，不要盲点。",
    "选择器优先级：`data-testid` / `role` / 可访问名称，高于脆弱 CSS 选择器。",
    "关键步骤后要显式等待，不靠裸 `sleep`。",
    "失败时截图并记录浏览器控制台日志。",
    "结束后关闭浏览器上下文，避免遗留进程。",
    "当前目录内可复用辅助函数：[test-helper.js](./assets/test-helper.js)",
  ],
  relatedSkills: [
    {
      get id() {
        return testingStrategySkill.id;
      },
      reason: "需要把 `testing-strategy` 里的 Web 场景落成实际浏览器检查。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  assets: [
    defineAsset({
      id: "test-helper",
      source: new URL("./assets/test-helper.js", import.meta.url),
      target: "assets/test-helper.js",
    })
  ],
});
