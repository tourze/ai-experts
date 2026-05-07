import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { proposalWriterSkill } from "../proposal-writer/index";

export const consultingAnalysisSkill = defineSkill({
  id: "consulting-analysis",
  fullName: "咨询分析",
  description: "当用户要产出咨询级研究报告、市场分析、消费者洞察、品牌研究、财务分析、竞品情报或投融资尽调文档时使用。适合“先搭分析框架，再基于可靠数据写成报告”的任务。",
  useCases: [
    "需要先搭章节骨架、分析模型和数据需求，再生成正式报告。",
    "输出物是咨询风格文档，而不是随手总结或聊天式回答。",
    "题目涉及市场规模、行业格局、品牌表现、增长路径、尽调结论等结构化研究。",
    "当研究结果还要继续转成提案时，可联动 `proposal-writer`。",
  ],
  constraints: [
    "先做框架，再写正文；不要在问题定义含糊时直接写完整报告。",
    "没有证据的数据不能编造；每个关键判断都要标注来源类型、时间范围和置信度。",
    "结论必须能回溯到分析链路：研究问题 → 方法 → 数据 → 推理 → 建议。",
    "图表、表格和结论口径必须一致；若数据缺失，要明确缺口而不是“合理猜测”。",
  ],
  checklist: [
    "是否明确了研究对象、目标读者、时间范围和地区范围。",
    "是否列出了要补的数据清单、数据优先级和不可替代的一手证据。",
    "是否为每个章节指定了分析模型，例如 TAM/SAM/SOM、五力、SWOT、漏斗、单位经济模型。",
    "是否区分了事实、推断和建议，避免把判断写成既成事实。",
  ],
  relatedSkills: [
    {
      get id() {
        return proposalWriterSkill.id;
      },
      reason: "当研究结果还要继续转成提案时，可联动 `proposal-writer`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "跳过框架直接写",
      pass: "框架先行",
    }),
    defineAntiPattern({
      fail: "二手循环引用",
      pass: "一手 + 标 source",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先明确研究主题、目标读者、分析目标、地区/时间范围、交付物形态和决策场景。",
      "读取 `report-brief-template` reference，生成研究 brief 和报告骨架。",
      "为每个章节指定分析模型，例如 TAM/SAM/SOM、五力、SWOT、漏斗、单位经济模型或尽调框架。",
      "列出数据需求、来源优先级、不可替代的一手证据和无法取得数据时的替代方案。",
      "按事实、推断、建议分层写结论，并标注来源类型、时间范围和置信度。",
      "需要把研究结果转成提案时联动 `proposal-writer`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "研究 brief：主题、目标、读者、范围、交付物和数据要求。",
      "咨询报告骨架和每章分析模型。",
      "数据清单、证据等级、缺口和替代方案。",
      "执行摘要、核心发现、战略含义和下一步建议。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "report-brief-template",
      source: new URL("./references/report-brief-template.md", import.meta.url),
      target: "references/report-brief-template.md",
      title: "咨询分析 brief 与报告骨架",
      summary: "咨询分析任务的输入 brief JSON 示例和 Markdown 报告骨架。",
      loadWhen: "需要启动咨询级研究、定义数据需求或生成报告章节骨架时读取。",
    }),
  ],
});
