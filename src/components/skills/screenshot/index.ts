import {
  InvocationPolicy,
  Platform,
  defineAsset,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { procedureUse, screenshotEnsureMacosPermissions, screenshotMacosDisplayInfo, screenshotMacosPermissions, screenshotMacosWindowInfo, screenshotTakeScreenshot, screenshotTakeScreenshotWindows } from "../../procedures/index";

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
    "macOS 进行窗口或应用截图前，先跑 `procedure screenshot-ensure-macos-permissions`，统一处理 Screen Recording 权限。",
    "`--app`、`--window-name`、`--list-windows` 只支持 macOS。",
    "Windows 走 `procedure screenshot-take-screenshot-windows`；主入口会在 Windows 分支委托给该 Node helper。",
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认目标平台、截图对象、输出路径规则和截图用途；浏览器/Figma 等已有专用截图时优先使用专用工具。",
      "macOS 截窗口、应用或屏幕前先调用 screenshot-ensure-macos-permissions，必要时再查 display/window 信息。",
      "用 screenshot-take-screenshot 作为主入口：临时模式 `--mode temp`、指定路径 `--path output/screen.png`、region、app、list-windows、window-id 或 `--active-window` 按需互斥选择。",
      "Windows 使用 screenshot-take-screenshot-windows，并只传支持的 mode、path 或 region 参数。",
      "命令结束后逐个检查输出路径，明确图片实际保存位置和权限/参数失败原因。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "截图目标、平台、procedure、参数、输出路径和文件是否真实生成。",
      "macOS Screen Recording 权限、窗口/显示器信息或 Windows helper 执行结果。",
      "失败时的互斥参数、权限、路径或平台能力边界说明。",
    ],
  }),
  procedures: [
    procedureUse(screenshotEnsureMacosPermissions),
    procedureUse(screenshotMacosDisplayInfo),
    procedureUse(screenshotMacosPermissions),
    procedureUse(screenshotMacosWindowInfo),
    procedureUse(screenshotTakeScreenshot, {
      label: "截图主入口",
      when: "需要截取临时截图、指定路径、指定区域、应用窗口、window id 或活动窗口时。",
      reason: "按参数选择截图目标和输出位置。",
      exampleArgs: { args: ["--mode", "temp"] },
    }),
    procedureUse(screenshotTakeScreenshotWindows),
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
