import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const windowsUiAutomationSkill = defineSkill({
  id: "windows-ui-automation",
  fullName: "windows-ui-automation",
  description: "当用户自动化 Windows 桌面操作、UIA 元素定位或 Win32 输入仿真时使用。",
  useCases: [
    "需要使用 UIA / Win32 API 做窗口发现、元素定位、按钮点击、键盘输入和状态读取。",
    "需要先定义权限分层、阻断名单、超时和审计字段，再实施自动化动作。",
    "需要在 Windows 客体里复现自动化脚本或安全边界时，可联动 [prlctl-vm-control](../prlctl-vm-control/SKILL.md)。",
    "需要更细的等待策略、审计字段和威胁场景时，继续读取 [进阶模式](./references/advanced-patterns.md)、[安全示例](./references/security-examples.md) 与 [威胁模型](./references/threat-model.md)。",
    "如果问题其实属于驱动、回调或内核对象，不要继续堆 UIA 逻辑，转到 [windows-kernel-security](../windows-kernel-security/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Reference material for windows-ui-automation.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "security-examples",
      source: new URL("./references/security-examples.md", import.meta.url),
      target: "references/security-examples.md",
      title: "security-examples.md",
      summary: "Reference material for windows-ui-automation.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "threat-model",
      source: new URL("./references/threat-model.md", import.meta.url),
      target: "references/threat-model.md",
      title: "threat-model.md",
      summary: "Reference material for windows-ui-automation.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
