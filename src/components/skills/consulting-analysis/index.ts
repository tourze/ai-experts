import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
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
  relatedSkills: [
    {
      get id() {
        return proposalWriterSkill.id;
      },
      reason: "当研究结果还要继续转成提案时，可联动 `proposal-writer`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
