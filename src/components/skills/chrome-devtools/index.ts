import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const chromeDevtoolsSkill = defineSkill({
  id: "chrome-devtools",
  fullName: "Chrome DevTools",
  description: "当用户要用 Chrome DevTools 做页面调试、网络排障、性能分析或 Lighthouse 审计时使用。",
  useCases: [
    "需要直接驱动 Chrome 页面，并同时查看 DOM 快照、控制台日志、网络请求与性能 trace。",
    "需要诊断页面白屏、脚本错误、接口失败、布局抖动、LCP/CLS 等前端性能问题。",
    "需要做 Lighthouse 审计或抓取内存快照，定位泄漏和异常占用。",
    "如果只是快速填表、截图、抓文本，直接使用本 skill 的快照和截图功能；如果问题是桌面应用或原生进程卡死，使用系统级调试工具。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
