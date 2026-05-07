import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
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
  workflow: defineSkillWorkflow({
    steps: [
      "先运行健康检查或等价检查，确认 adb、Java、Android SDK 和目标设备 / AVD 状态。",
      "选择设备：单设备可自动选择，多设备必须明确 serial；模拟器管理用 emulator-manage 相关 procedure。",
      "按任务路由 procedure：构建安装走 build-and-test，启动/停止/安装/卸载走 app-launcher，日志走 log-monitor，诊断包走 diagnose-app。",
      "界面操作先用 screen-mapper 读取 UI 层级，再用 navigator 通过文本、resource-id 或 content-description 定位元素。",
      "手势、按键和坐标点击只在语义节点不足时使用；关键动作后立即截图、dump UI 或抓日志确认。",
      "需要机器可读输出时传 `--json`，需要完整参数时调用对应 procedure 的 `--help`；原始 ADB 流程读取 `adb-runbook`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "目标设备 / 模拟器选择结果和环境健康状态。",
      "实际调用的 procedure、关键参数和退出结果。",
      "截图、UI dump、前台状态、日志或诊断包等验证证据。",
      "未能自动化的步骤、坐标兜底依据和后续排查建议。",
    ],
  }),
  procedures: [
    procedureUse(androidDeviceAutomationAppLauncher),
    procedureUse(androidDeviceAutomationBuildAndTest),
    procedureUse(androidDeviceAutomationDiagnoseApp),
    procedureUse(androidDeviceAutomationEmuHealthCheck),
    procedureUse(androidDeviceAutomationEmulatorManage),
    procedureUse(androidDeviceAutomationGesture),
    procedureUse(androidDeviceAutomationKeyboard),
    procedureUse(androidDeviceAutomationLogMonitor),
    procedureUse(androidDeviceAutomationNavigator),
    procedureUse(androidDeviceAutomationScreenMapper),
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
