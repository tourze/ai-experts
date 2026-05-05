import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";

export const evidenceQualityFrameworkSkill = defineSkill({
  id: "evidence-quality-framework",
  fullName: "证据质量框架：三态标注 + 发现绑定",
  description: "当代码审查、安全审计、事故复盘、研究分析或战略分析需要把每条结论显式标注为事实/推断/假设，并将发现绑定到可核验定位（文件:行 / log / commit / metric）时使用。消除\"印象式\"断言与无锚结论。",
  useCases: [
    "代码审查、架构审计、安全审计、性能诊断、事故复盘、研究报告、咨询分析——任何需要输出结构化证据判断的场景。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
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
      fail: "完整对照参见 [references/anti-patterns.md](references/anti-patterns.md)。 三态标注对照参见 [references/tri-state-examples.md](references/tri-state-examples.md)。 证据绑定对照参见 [references/binding-examples.md](references/binding-examples.md)。",
      pass: "读取对应 reference 的反模式、三态标注和证据绑定示例后再评估。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
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
