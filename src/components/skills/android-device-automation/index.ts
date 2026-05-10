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
import { procedureUse, androidDeviceAutomationAppLauncher, androidDeviceAutomationBuildAndTest, androidDeviceAutomationDiagnoseApp, androidDeviceAutomationEmuHealthCheck, androidDeviceAutomationEmulatorManage, androidDeviceAutomationGesture, androidDeviceAutomationKeyboard, androidDeviceAutomationLogMonitor, androidDeviceAutomationNavigator, androidDeviceAutomationScreenMapper } from "../../procedures/index";

export const androidDeviceAutomationSkill = defineSkill({
  id: "android-device-automation",
  fullName: "Android 真机/模拟器自动化",
  description: "当用户要启动、操作或管理 Android 真机/模拟器、自动化构建部署、查看设备日志或做 UI 导航时使用。",
  useCases: [
    "当用户要启动、操作或管理 Android 真机/模拟器、自动化构建部署、查看设备日志或做 UI 导航时使用。",
  ],
  constraints: [
    "先确认 Android SDK Platform-Tools、Java / OpenJDK 和目标设备可用；多设备场景必须显式指定 `-s <serial>`。",
    "优先用 `screen-mapper` / `navigator` 的语义节点操作界面，坐标点击只能作为兜底并说明坐标来源。",
    "每个会改变设备或应用状态的操作之后，都要用截图、UI dump、前台包名或日志验证结果。",
    "卸载应用、关闭模拟器、强停应用或清空 logcat 会改变本地设备状态；只有用户明确确认包名、serial 和影响范围后才传 `--yes`，清空 logcat 还必须显式传 `--clear`。",
    "diagnose-app 默认不会覆盖输出目录内已存在的诊断文件；确认目标可替换后才传 `--overwrite`。",
    "需要直接 ADB 命令时先读取 `adb-runbook` reference；能用 procedure 覆盖的场景不要手写一串临时命令。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "截图 + 坐标",
      pass: "screen_mapper → navigator",
    }),
    defineAntiPattern({
      fail: "多设备不指定 serial",
      pass: "显式 -s",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先运行健康检查或等价检查，确认 adb、Java、Android SDK 和目标设备 / AVD 状态。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "选择设备：单设备可自动选择，多设备必须明确 serial；模拟器管理用 emulator-manage 相关 procedure。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "按任务路由 procedure：构建安装走 build-and-test，启动/停止/安装/卸载走 app-launcher，日志走 log-monitor，诊断包走 diagnose-app。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "界面操作先用 screen-mapper 读取 UI 层级，再用 navigator 通过文本、resource-id 或 content-description 定位元素。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "手势、按键和坐标点击只在语义节点不足时使用；关键动作后立即截图、dump UI 或抓日志确认。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "需要机器可读输出时仅对明确支持 JSON 的 procedure 传 `--json`，需要完整参数时调用对应 procedure 的 `--help`；原始 ADB 流程读取 `adb-runbook`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "目标设备 / 模拟器选择结果和环境健康状态。",
      "实际调用的 procedure、关键参数和退出结果。",
      "截图、UI dump、前台状态、日志或诊断包等验证证据。",
      "未能自动化的步骤、坐标兜底依据和后续排查建议。",
      "若复用诊断输出目录，说明目标文件不存在或已获得覆盖许可。",
    ],
  }),
  procedures: [
    procedureUse(androidDeviceAutomationAppLauncher, {
      label: "应用管理主入口",
      when: "需要启动/终止/安装/卸载应用、列出已安装包或查询应用运行状态时。",
      reason: "统一管理 Android 应用生命周期，避免手写 adb am/pm 命令。",
    }),
    procedureUse(androidDeviceAutomationBuildAndTest, {
      label: "构建与测试",
      when: "需要在 Android 项目中执行 Gradle 构建或运行 connectedAndroidTest 时。",
      reason: "自动查找 gradlew、收集错误摘要，避免手写多步 Gradle 命令链。",
    }),
    procedureUse(androidDeviceAutomationDiagnoseApp, {
      label: "应用诊断",
      when: "需要采集运行中应用的完整诊断包（logcat、截图、UI 层级、dumpsys）时。",
      reason: "一键采集所有诊断证据并输出 summary.json，避免手工逐条跑 adb 命令。",
    }),
    procedureUse(androidDeviceAutomationEmuHealthCheck, {
      label: "环境健康检查",
      when: "首次使用或怀疑 Android 开发环境配置有问题时。",
      reason: "五项指标一次性检查，快速定位环境配置缺口，避免逐一验证各依赖。",
    }),
    procedureUse(androidDeviceAutomationEmulatorManage, {
      label: "模拟器管理",
      when: "需要列出、启动或关闭 Android 虚拟设备（AVD）时。",
      reason: "统一管理 AVD 生命周期，避免手写 emulator 命令。",
    }),
    procedureUse(androidDeviceAutomationGesture, {
      label: "手势操作",
      when: "需要在设备上执行滑动或滚动手势时。",
      reason: "无需手动计算设备屏幕坐标即可完成 swipe/scroll，避免手写带像素坐标的 adb shell 命令。",
    }),
    procedureUse(androidDeviceAutomationKeyboard, {
      label: "键盘输入",
      when: "需要向设备发送按键事件（home/back/enter/音量等）或输入文本时。",
      reason: "避免手动拼写 ADB shell input keyevent 命令并处理转义，统一文本和按键输入。",
    }),
    procedureUse(androidDeviceAutomationLogMonitor, {
      label: "日志监控",
      when: "需要实时流式查看 Android logcat 并按包名/tag/优先级/grep 过滤时。",
      reason: "实时按包名和标签过滤 logcat，避免在大量无关日志中手动搜索关键信息。",
    }),
    procedureUse(androidDeviceAutomationNavigator, {
      label: "UI 导航",
      when: "需要按文本/resource-id/类名查找屏幕元素并执行点击或文本输入时。",
      reason: "基于 UI 层级语义定位元素，避免使用脆弱且不易维护的像素坐标点击。",
    }),
    procedureUse(androidDeviceAutomationScreenMapper, {
      label: "屏幕分析",
      when: "需要获取当前屏幕 UI 层级摘要（按钮、文本字段、可交互元素）或结构化 JSON 时。",
      reason: "自动解析 UI 层级为可读元素摘要，避免手动逐段阅读原始 uiautomator dump XML。",
    }),
  ],
  references: [
    defineReference({
      id: "adb-runbook",
      source: new URL("./references/adb-runbook.md", import.meta.url),
      target: "references/adb-runbook.md",
      title: "adb-runbook.md",
      summary: "ADB 命令速查手册：设备管理、应用操作、日志抓取与调试命令。",
      loadWhen: "需要操作 Android 设备、抓取日志或执行 ADB 调试命令时读取。",
    }),
  ],
});
