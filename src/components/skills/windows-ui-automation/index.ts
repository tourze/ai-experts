import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { prlctlVmControlSkill } from "../prlctl-vm-control/index";
import { windowsKernelSecuritySkill } from "../windows-kernel-security/index";

export const windowsUiAutomationSkill = defineSkill({
  id: "windows-ui-automation",
  fullName: "windows-ui-automation",
  description: "当用户自动化 Windows 桌面操作、UIA 元素定位或 Win32 输入仿真时使用。",
  useCases: [
    "需要使用 UIA / Win32 API 做窗口发现、元素定位、按钮点击、键盘输入和状态读取。",
    "需要先定义权限分层、阻断名单、超时和审计字段，再实施自动化动作。",
    "需要在 Windows 客体里复现自动化脚本或安全边界时，可联动 `prlctl-vm-control`。",
    "需要更细的等待策略、审计字段和威胁场景时，继续读取 [进阶模式](./references/advanced-patterns.md)、[安全示例](./references/security-examples.md) 与 [威胁模型](./references/threat-model.md)。",
    "如果问题其实属于驱动、回调或内核对象，不要继续堆 UIA 逻辑，转到 `windows-kernel-security`。",
  ],
  constraints: [
    "默认 `read-only`；只有在用户明确需要时才提升到可点击、可输入的交互级别。",
    "必须校验目标进程、权限边界和阻断名单，禁止跨提权边界操作敏感窗口。",
    "输入类动作必须带超时、速率限制和热键阻断；不要向安全对话框、密码管理器或系统工具注入输入。",
    "自动化动作必须可审计：至少记录目标进程、操作类型、权限层级和相关窗口标识。",
    "UI 问题先从“能否只读观测”开始；只有观测不足时才进入输入或点击阶段。",
  ],
  checklist: [
    "当前动作是否真的需要输入或点击，还是只读查询就能满足需求。",
    "目标进程是否命中阻断名单，或者是否跨越了完整性级别 / 提权边界。",
    "是否已经定义了超时、轮询间隔、失败回退与审计字段。",
    "是否明确了元素定位策略：窗口标题、`AutomationId`、控件类型、可见性与焦点约束。",
    "如需复现高风险场景，是否已经切换到虚拟机并保留快照。",
  ],
  relatedSkills: [
    {
      get id() {
        return windowsKernelSecuritySkill.id;
      },
      reason: "如果问题其实属于驱动、回调或内核对象，不要继续堆 UIA 逻辑，转到 `windows-kernel-security`。",
    },
    {
      get id() {
        return prlctlVmControlSkill.id;
      },
      reason: "需要在 Windows 客体里复现自动化脚本或安全边界时，可联动 `prlctl-vm-control`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "敏感窗口自动化",
      pass: "阻断名单 + 校验",
    }),
    defineAntiPattern({
      fail: "UIA 失败降级到坐标",
      pass: "多种定位 + 失败报错",
    }),
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
