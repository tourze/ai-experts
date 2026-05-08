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

export const evidenceQualityFrameworkSkill = defineSkill({
  id: "evidence-quality-framework",
  fullName: "证据质量框架：三态标注 + 发现绑定",
  description: "当代码审查、安全审计、事故复盘、研究分析或战略分析需要把每条结论显式标注为事实/推断/假设，并将发现绑定到可核验定位（文件:行 / log / commit / metric）时使用。消除\"印象式\"断言与无锚结论。",
  useCases: [
    "代码审查、架构审计、安全审计、性能诊断、事故复盘、研究报告、咨询分析——任何需要输出结构化证据判断的场景。",
  ],
  constraints: [
    "每段结论必须显式标注 `[事实]` / `[推断]` / `[假设]`，不能沉默。",
    "`[事实]` 必须附可核验定位；`[推断]` 必须给事实链；`[假设]` 必须给验证路径。",
    "每条发现至少绑定一种定位：文件:行、log 时间戳、commit、metric 或命令输出。",
    "综合结论级别必须匹配最弱证据链，不允许用假设包装成事实。",
  ],
  checklist: [
    "每段结论是否显式带 `[事实]` / `[推断]` / `[假设]` 标注？",
    "`[事实]` 是否附可核验定位？`[推断]` 是否给依据链？`[假设]` 是否给验证路径？",
    "每条发现是否有文件:行 / timestamp / commit / metric 至少一种定位？",
    "证据片段是实际粘贴内容，触发条件可被独立复现？",
    "综合结论级别匹配最弱环节？是否避免了\"显然/大概率/毫无疑问\"等无锚措辞？",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "印象式结论没有定位、证据片段或触发条件。",
      pass: "每条发现绑定定位、实际证据片段和可复现触发条件。",
    }),
    defineAntiPattern({
      fail: "把推断或假设写成事实。",
      pass: "三态标注并让综合结论服从最弱证据。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先采集实际代码、diff、日志、metric、commit 或命令输出片段；没有实际片段时只能标为假设或待验证。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "每条结论标注 `[事实]`、`[推断]` 或 `[假设]`；事实附定位，推断给依据链，假设给最小验证实验。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "每条发现绑定定位、证据片段和触发条件，定位优先级为文件:行 > log+trace_id > commit > metric > 命令输出。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "性能、安全、并发类断言必须有实验或观测窗口；纯代码扫描只能标为推断。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "综合结论按最弱证据降级；需要示例时读取 anti-patterns、tri-state-examples 或 binding-examples。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "三态标注后的发现：事实、推断、假设、定位、证据片段和触发条件。",
      "影响范围、修复方向、验证路径、反例或最小实验。",
      "综合结论、置信度、最弱证据环节和需要升级/降级的判断。",
    ],
  }),
  references: [
    defineReference({
      id: "anti-patterns",
      source: new URL("./references/anti-patterns.md", import.meta.url),
      target: "references/anti-patterns.md",
      title: "anti-patterns.md",
      summary: "证据质量框架中的常见反模式，包括无锚结论和印象式断言。",
      loadWhen: "需要识别证据分析中的常见错误或对比反模式案例时读取。",
    }),
    defineReference({
      id: "binding-examples",
      source: new URL("./references/binding-examples.md", import.meta.url),
      target: "references/binding-examples.md",
      title: "binding-examples.md",
      summary: "证据绑定的正反示例，展示如何将发现锚定到可核验定位。",
      loadWhen: "需要参考具体示例来理解如何将发现绑定到文件:行、日志或指标时读取。",
    }),
    defineReference({
      id: "tri-state-examples",
      source: new URL("./references/tri-state-examples.md", import.meta.url),
      target: "references/tri-state-examples.md",
      title: "tri-state-examples.md",
      summary: "事实/推断/假设三态标注的正反示例与边界案例。",
      loadWhen: "需要参考具体示例来理解事实、推断和假设的区分标准时读取。",
    }),
  ],
});
