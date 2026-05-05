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
  constraints: [
    "交互前优先 `take_snapshot`，因为 `click`、`fill`、`fill_form` 等输入工具依赖最新 `uid`；导航或 DOM 更新后旧 `uid` 立即失效。",
    "多标签页场景先 `list_pages` / `select_page` 再操作，避免把命令发到错误页签。",
    "排障时不要只看其中一类证据；前端问题通常要把 `list_console_messages`、`list_network_requests`、`evaluate_script` 组合起来看。",
    "性能分析工具链以 `performance_start_trace` / `performance_stop_trace` / `performance_analyze_insight` 为主，必要时补 `take_memory_snapshot` 与 `lighthouse_audit`。",
    "当前官方工具面包括页面导航、输入交互、调试、网络、性能和仿真；命名基线见官方仓库：<https://github.com/mcp/ChromeDevTools/chrome-devtools-mcp>",
  ],
  checklist: [
    "是否在交互前拿到最新 `take_snapshot`，而不是凭截图猜元素。",
    "是否在多页签场景里确认了当前 page ID，再执行点击、填写或脚本求值。",
    "是否把控制台、网络和页面脚本求值结果结合起来，而不是单看某一侧证据。",
    "是否在性能排障时先录 trace，再做 insight / memory / Lighthouse，而不是反过来。",
    "是否把一次分析得到的 `uid`、request 线索、trace 结论和复现步骤一起记录下来。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
