import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineSkill,
} from "../../sdk";

export const webappTestingSkill = defineSkill({
  id: "webapp-testing",
  fullName: "Web 应用测试",
  description: "当需要在真实浏览器中验证本地或可访问 Web 应用时使用。适用于“帮我点一下页面”“验证表单流程”“抓浏览器日志”“截图定位问题”“用 Playwright 测这个页面”等请求。",
  useCases: [
    "本地开发站点或测试环境页面需要真实浏览器验证。",
    "需要验证交互、表单、跳转、控制台日志、截图或响应式表现。",
    "需要把 [testing-strategy](../testing-strategy/SKILL.md) 里的 Web 场景落成实际浏览器检查。",
    "需要在执行失败时保留证据用于复盘。",
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
