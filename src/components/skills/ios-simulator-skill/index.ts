import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { procedureUse, iosSimulatorSkillAccessibilityAudit, iosSimulatorSkillAppLauncher, iosSimulatorSkillAppStateCapture, iosSimulatorSkillBuildAndTest, iosSimulatorSkillClipboard, iosSimulatorSkillGesture, iosSimulatorSkillKeyboard, iosSimulatorSkillLogMonitor, iosSimulatorSkillNavigator, iosSimulatorSkillPrivacyManager, iosSimulatorSkillPushNotification, iosSimulatorSkillScreenMapper, iosSimulatorSkillSimHealthCheck, iosSimulatorSkillSimList, iosSimulatorSkillSimctlBoot, iosSimulatorSkillSimctlCreate, iosSimulatorSkillSimctlDelete, iosSimulatorSkillSimctlErase, iosSimulatorSkillSimctlShutdown, iosSimulatorSkillSimulatorSelector, iosSimulatorSkillStatusBar, iosSimulatorSkillTestRecorder, iosSimulatorSkillVisualDiff } from "../../procedures/index";
import { appleAppstoreReviewerSkill } from "../apple-appstore-reviewer/index";
import { swiftuiPerformanceAuditSkill } from "../swiftui-performance-audit/index";

export const iosSimulatorSkillSkill = defineSkill({
  id: "ios-simulator-skill",
  fullName: "iOS 模拟器自动化",
  description: "当用户需要用 Simulator、xcrun simctl、设备启动、截图、安装包、日志采集或提审前自动化回归时使用。",
  useCases: [
    "需要在模拟器里构建、运行、排查 iOS 应用问题。",
    "需要通过无障碍树导航界面，而不是靠像素坐标硬点。",
    "需要抓日志、截图、UI 树、权限状态、状态栏和推送来复现问题。",
    "需要批量启动、关闭、擦除、创建或选择模拟器。",
  ],
  constraints: [
    "仅把本 skill 登记的 Procedure 当作入口；`xcode/` 相关源码是内部模块，不直接执行。",
    "优先走无障碍树：先 `ios-simulator-skill-screen-mapper` / `ios-simulator-skill-navigator` procedure，最后才用坐标。",
    "大多数 Procedure 在未传 `--udid` 时会自动选择 booted simulator；`ios-simulator-skill-log-monitor` procedure 例外，参数名是 `--device-udid`。",
    "`ios-simulator-skill-visual-diff` procedure 直接处理 PNG；截图缩放优先使用系统 `sips`，缺失时保留原图尺寸。",
    "删除、擦除、批量关闭模拟器、卸载或终止应用会丢失或中断本地模拟器状态；只有用户明确确认目标和影响范围后才传 `--yes`。",
  ],
  checklist: [
    "先跑 `ios-simulator-skill-sim-health-check` procedure，确认 `xcrun`、`simctl`、Node.js 运行时可用。",
    "每次交互前先看 `ios-simulator-skill-screen-mapper` procedure 或 `ios-simulator-skill-navigator` procedure（参数 `--list`），不要盲点。",
    "需要日志时确认参数名：`ios-simulator-skill-log-monitor` procedure 用 `--device-udid`，不是 `--udid`。",
    "需要结构化输出时统一使用 `--json`；需要完整参数时直接跑对应 Procedure 的 `--help`。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "用截图坐标导航",
      pass: "无障碍树语义查找",
    }),
    defineAntiPattern({
      fail: "没 booted simulator 直接跑",
      pass: "先 boot",
    }),
    defineAntiPattern({
      fail: "文档穷举参数",
      pass: "--help 是真值",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  relatedSkills: [
    {
      get id() {
        return swiftuiPerformanceAuditSkill.id;
      },
      reason: "模拟器复现发现 SwiftUI 列表、动画、主线程或状态更新性能瓶颈时联动。",
    },
    {
      get id() {
        return appleAppstoreReviewerSkill.id;
      },
      reason: "需要把模拟器证据用于提审前审核路径复现或拒审风险审查时联动。",
    },
  ],
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先跑 `ios-simulator-skill-sim-health-check` procedure，确认 Xcode、`xcrun simctl`、Node.js 和可用 runtime。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "列出或选择目标模拟器；没有 booted simulator 时先 boot，必要时创建、擦除或关闭模拟器。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "构建运行走 xcode / build-and-test 相关 procedure，安装、启动、终止和状态采集走 app-launcher / app-state-capture。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "交互前先用 screen-mapper 或 navigator 读取无障碍树，再通过语义节点点击、输入或导航。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "需要日志、截图、状态栏、权限、剪贴板、推送或视觉 diff 时调用对应 procedure，并优先使用 `--json` 输出。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "每次关键操作后保留截图、UI 树、日志或状态输出作为验证证据；完整参数以对应 procedure 的 `--help` 为准。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "目标模拟器 UDID、runtime、启动状态和健康检查结果。",
      "构建 / 安装 / 启动 / 交互时调用的 procedure 与关键参数。",
      "截图、UI 树、日志、权限状态、推送或视觉 diff 等复现证据。",
      "失败命令的退出码、stderr 摘要和下一步排查方向。",
    ],
  }),
  procedures: [
    procedureUse(iosSimulatorSkillAccessibilityAudit, {
      label: "无障碍审计",
      when: "需要检查模拟器屏幕无障碍性问题（缺失标签、空按钮、图像无 alt 文本等）时。",
      reason: "自动扫描无障碍树并按严重度分级输出发现问题，避免手动逐元素检查。",
    }),
    procedureUse(iosSimulatorSkillAppLauncher, {
      label: "应用生命周期管理",
      when: "需要启动/终止/重启/安装/卸载应用、列出已安装包或查询应用状态时。",
      reason: "统一管理 iOS 应用生命周期，避免手写 xcrun simctl launch/terminate 等命令。",
    }),
    procedureUse(iosSimulatorSkillAppStateCapture, {
      label: "应用状态快照",
      when: "需要一次性采集截图、无障碍树、应用日志和设备信息用于调试时。",
      reason: "一键采集全状态证据并输出 summary，避免分多次执行 simctl 命令。",
    }),
    procedureUse(iosSimulatorSkillBuildAndTest, {
      label: "Xcode 构建与测试",
      when: "需要在模拟器上构建或测试 Xcode 项目时。",
      reason: "自动查找 xcodeproj/workspace 并执行构建/测试 task，避免手写多步 xcodebuild 命令链。",
    }),
    procedureUse(iosSimulatorSkillClipboard, {
      label: "剪贴板写入",
      when: "需要向模拟器剪贴板写入文本（如测试粘贴功能）时。",
      reason: "统一写入剪贴板并自动标记测试场景，避免手写 simctl pbcopy。",
    }),
    procedureUse(iosSimulatorSkillGesture, {
      label: "手势操作",
      when: "需要在模拟器上执行滑动、滚动、长按、捏合或下拉刷新手势时。",
      reason: "自动适配屏幕坐标系执行常见手势，避免手写带像素坐标的 xcrun simctl 命令。",
    }),
    procedureUse(iosSimulatorSkillKeyboard, {
      label: "键盘与硬件按钮",
      when: "需要向模拟器输入文本、发送按键事件或按下硬件按钮（home/volume/power）时。",
      reason: "支持命名键、组合键、硬件按钮和慢速输入，避免手写 idb 命令。",
    }),
    procedureUse(iosSimulatorSkillLogMonitor, {
      label: "日志监控",
      when: "需要按应用过滤并收集模拟器日志流，按严重级别分类错误/警告时。",
      reason: "自动按应用过滤日志并按严重度分级收集，避免在大量模拟器日志中手动检索关键信息。",
    }),
    procedureUse(iosSimulatorSkillNavigator, {
      label: "UI 导航",
      when: "需要在模拟器屏幕上按文本/类型/标识符查找元素并点击或输入时。",
      reason: "基于无障碍树语义操作，可避免使用像素坐标点击。",
    }),
    procedureUse(iosSimulatorSkillPrivacyManager, {
      label: "权限管理",
      when: "需要授予、撤销或重置模拟器中应用的隐私权限（相机/位置/麦克风等）时。",
      reason: "统一管理 simctl privacy 权限操作，支持测试场景和步骤追踪。",
    }),
    procedureUse(iosSimulatorSkillPushNotification, {
      label: "推送通知模拟",
      when: "需要向模拟器发送模拟推送通知以测试通知处理逻辑时。",
      reason: "支持简单标题/正文/角标和自定义 JSON payload，避免手写 simctl push 命令。",
    }),
    procedureUse(iosSimulatorSkillScreenMapper, {
      label: "屏幕 UI 分析",
      when: "需要了解当前屏幕上有哪些可交互元素（按钮/文本字段/导航栏）时。",
      reason: "通过无障碍树获取可交互元素分类摘要，避免手动逐项遍历模拟器屏幕识别按钮和文本字段。",
    }),
    procedureUse(iosSimulatorSkillSimHealthCheck, {
      label: "环境健康检查",
      when: "首次使用 iOS 模拟器 skill 或怀疑开发环境配置有问题时。",
      reason: "一次性确认 Xcode CLT、simctl、IDB 和模拟器状态，避免逐个工具手动验证。",
    }),
    procedureUse(iosSimulatorSkillSimList, {
      label: "模拟器列表",
      when: "需要查看可用模拟器列表、获取推荐型号或按条件过滤设备时。",
      reason: "渐进式披露模拟器信息，支持缓存和推荐评分，避免手写 simctl list。",
    }),
    procedureUse(iosSimulatorSkillSimctlBoot, {
      label: "启动模拟器",
      when: "需要启动一个或多个 iOS 模拟器时。",
      reason: "自动等待模拟器完全就绪后返回，避免手写 simctl boot 加轮询等待循环。",
    }),
    procedureUse(iosSimulatorSkillSimctlCreate, {
      label: "创建模拟器",
      when: "需要创建新 iOS 模拟器（指定设备类型和 iOS 版本）时。",
      reason: "自动查询可用设备类型和 runtime，避免手写 simctl create。",
    }),
    procedureUse(iosSimulatorSkillSimctlDelete, {
      label: "删除模拟器",
      when: "需要永久删除模拟器以释放磁盘空间时。",
      reason: "支持批量删除和旧版本清理，避免逐一查找和手动执行 simctl delete。",
    }),
    procedureUse(iosSimulatorSkillSimctlErase, {
      label: "擦除模拟器",
      when: "需要将模拟器恢复出厂设置时。",
      reason: "支持批量擦除和验证等待，避免逐一执行 simctl erase 并确认完成状态。",
    }),
    procedureUse(iosSimulatorSkillSimctlShutdown, {
      label: "关闭模拟器",
      when: "需要关闭一个或多个已启动的 iOS 模拟器时。",
      reason: "支持批量关闭和验证等待，避免逐一执行 simctl shutdown。",
    }),
    procedureUse(iosSimulatorSkillSimulatorSelector, {
      label: "智能选择器",
      when: "需要获取推荐的最合适模拟器时。",
      reason: "根据多维度评分自动推荐最合适模拟器，避免手动比对型号、版本和启动状态。",
    }),
    procedureUse(iosSimulatorSkillStatusBar, {
      label: "状态栏覆盖",
      when: "需要定制模拟器状态栏（时间/网络/电池）用于截图时。",
      reason: "支持预设和自定义值，避免手写 simctl status_bar 命令。",
    }),
    procedureUse(iosSimulatorSkillTestRecorder, {
      label: "测试录制",
      when: "需要按步骤录制测试过程，包括截图和无障碍树快照时。",
      reason: "自动管理截图、无障碍树和报告生成，避免手动记录每一步。",
    }),
    procedureUse(iosSimulatorSkillVisualDiff, {
      label: "视觉差异对比",
      when: "需要比较两张截图并输出差异百分比和 diff 图时。",
      reason: "内置 PNG 解析，不依赖外部工具，自动生成 diff 图和并排对比图。",
    }),
  ],
});
