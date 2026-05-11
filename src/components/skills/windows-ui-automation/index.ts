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
import { prlctlVmControlSkill } from "../prlctl-vm-control/index";
import { windowsKernelSecuritySkill } from "../windows-kernel-security/index";

export const windowsUiAutomationSkill = defineSkill({
  id: "windows-ui-automation",
  fullName: "Windows UI 自动化",
  description: "当用户自动化 Windows 桌面操作、UIA 元素定位或 Win32 输入仿真时使用。",
  useCases: [
    "需要使用 UIA / Win32 API 做窗口发现、元素定位、按钮点击、键盘输入和状态读取。",
    "需要先定义权限分层、阻断名单、超时和审计字段，再实施自动化动作。",
    "需要在 Windows 客体里复现自动化脚本或安全边界时，可联动 `prlctl-vm-control`。",
    "需要更细的等待策略、审计字段、安全示例或威胁场景。",
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
      get skill() {
        return windowsKernelSecuritySkill;
      },
      reason: "问题属于驱动、回调、内核对象或内核安全边界时联动。",
    },
    {
      get skill() {
        return prlctlVmControlSkill;
      },
      reason: "需要在 Windows 虚拟机里复现自动化脚本、高风险窗口或安全边界时联动。",
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先判断权限层级：read-only、click、input 或高风险复现；默认从只读窗口/元素查询开始。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "定义阻断名单：密码管理器、系统管理工具、shell、注册表、提权窗口和敏感热键。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "自动化前校验目标进程、完整性级别、source/target 是否跨提权边界，以及操作类型。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "元素定位按窗口标题、AutomationId、控件类型、可见性和焦点约束组合，不把 UIA 失败降级成坐标猜测。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "等待策略先建模 timeout、poll interval、重试和失败回退，再调用 UIA/Win32。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "每次动作至少记录目标进程、窗口标识、操作类型、权限层级、超时和结果；需要复杂场景时读取 advanced-patterns、安全示例或 threat-model。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "自动化策略：权限层级、阻断名单、目标校验、热键限制和审计字段。",
      "定位与等待计划：窗口/元素 selector、可见性/焦点约束、timeout、poll interval、失败回退。",
      "执行或复现记录：目标进程、操作类型、结果、风险判断、VM 快照建议和需联动的安全 skill。",
    ],
  }),
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Windows UI 自动化的进阶模式，包括等待策略、审计字段和复杂场景处理。",
      loadWhen: "需要处理更复杂的 UI 自动化场景或优化现有自动化脚本时读取。",
    }),
    defineReference({
      id: "security-examples",
      source: new URL("./references/security-examples.md", import.meta.url),
      target: "references/security-examples.md",
      title: "security-examples.md",
      summary: "Windows UI 自动化的安全示例，展示权限检查和阻断名单的实践场景。",
      loadWhen: "需要参考安全合规的自动化示例来设计权限边界时读取。",
    }),
    defineReference({
      id: "threat-model",
      source: new URL("./references/threat-model.md", import.meta.url),
      target: "references/threat-model.md",
      title: "threat-model.md",
      summary: "Windows UI 自动化的威胁模型分析，包括跨提权边界和敏感窗口的风险评估。",
      loadWhen: "需要评估自动化操作的潜在安全威胁或设计审计策略时读取。",
    }),
  ],
});
