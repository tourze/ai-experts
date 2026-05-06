import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { scriptUse } from "../../scripts/index";

export const androidDeviceAutomationSkill = defineSkill({
  id: "android-device-automation",
  fullName: "Android 真机/模拟器自动化",
  description: "当用户要启动、操作或管理 Android 真机/模拟器、自动化构建部署、查看设备日志或做 UI 导航时使用。",
  useCases: [
    "当用户要启动、操作或管理 Android 真机/模拟器、自动化构建部署、查看设备日志或做 UI 导航时使用。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scripts: [
    scriptUse("android-device-automation-app-launcher"),
    scriptUse("android-device-automation-build-and-test"),
    scriptUse("android-device-automation-common"),
    scriptUse("android-device-automation-diagnose-app"),
    scriptUse("android-device-automation-emu-health-check"),
    scriptUse("android-device-automation-emulator-manage"),
    scriptUse("android-device-automation-gesture"),
    scriptUse("android-device-automation-keyboard"),
    scriptUse("android-device-automation-log-monitor"),
    scriptUse("android-device-automation-navigator"),
    scriptUse("android-device-automation-screen-mapper"),
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
