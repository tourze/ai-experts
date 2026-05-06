import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAsset,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";

export const screenshotSkill = defineSkill({
  id: "screenshot",
  fullName: "系统截图",
  description: "当用户要截桌面、截窗口、截指定区域或做系统级截图时使用。",
  useCases: [
    "用户明确要求截取桌面、应用窗口、活动窗口或像素区域。",
    "需要对桌面应用、原生窗口、系统弹窗做截图。",
    "需要临时保存到系统默认目录或临时目录，供后续查看。",
    "如果浏览器、Figma 或其他专用工具已经能直接截图，优先用专用工具，不要多绕一层系统截图。",
  ],
  constraints: [
    "保存路径遵循三条规则：用户给路径就存到该路径；用户没给路径则存系统默认截图目录；仅供代理自检时存临时目录。",
    "macOS 进行窗口或应用截图前，先跑 `scripts/ensure_macos_permissions.mjs`，统一处理 Screen Recording 权限。",
    "`--app`、`--window-name`、`--list-windows` 只支持 macOS。",
    "Windows 走 `scripts/take_screenshot_windows.mjs`；主入口会在 Windows 分支委托给该 Node helper。",
    "互斥参数不能混用：`--region` / `--window-id` / `--active-window` / `--app` / `--interactive` 要按脚本约束组合。",
  ],
  checklist: [
    "已明确输出位置：显式路径、系统默认目录，还是临时目录。",
    "macOS 上已经处理过截图权限。",
    "需要窗口 ID 时，先用 `--list-windows` 确认。",
    "没有同时传入互斥参数。",
    "截图命令跑完后，逐个检查输出路径是否真实生成。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "不预检查 macOS 权限",
      pass: "先 ensure_permissions",
    }),
    defineAntiPattern({
      fail: "临时截图污染项目",
      pass: "临时模式",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scripts: [
    "screenshot-ensure-macos-permissions",
    "screenshot-macos-display-info",
    "screenshot-macos-permissions",
    "screenshot-macos-window-info",
    "screenshot-take-screenshot",
    "screenshot-take-screenshot-windows",
  ],
  assets: [
    defineAsset({
      id: "screenshot-small",
      source: new URL("./assets/screenshot-small.svg", import.meta.url),
      target: "assets/screenshot-small.svg",
    }),
    defineAsset({
      id: "screenshot",
      source: new URL("./assets/screenshot.png", import.meta.url),
      target: "assets/screenshot.png",
    })
  ],
});
