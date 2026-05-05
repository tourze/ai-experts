import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { grillMeSkill } from "../grill-me/index";
import { whatIfOracleSkill } from "../what-if-oracle/index";

export const consciousnessCouncilSkill = defineSkill({
  id: "consciousness-council",
  fullName: "多视角思辨议会",
  description: "当需要多视角思辨审视高不确定性决策、角色辩论、专家议会、风险分歧和取舍盲区时使用。支持角色议会模式和六顶思考帽模式。",
  useCases: [
    "当需要多视角思辨审视高不确定性决策、角色辩论、专家议会、风险分歧和取舍盲区时使用。支持角色议会模式和六顶思考帽模式。",
  ],
  constraints: [
    "每次选 4-6 个角色，重点是制造有效张力，不是凑人数。",
    "角色必须有不同的关注点、风险偏好和盲区，不能只是“换个措辞表达同意”。",
    "至少保留一个实质性分歧；如果所有角色都在同意，说明角色选择失败。",
    "对纯事实问题或低风险琐事，不要强行开完整议会。",
    "结尾必须输出：共识、核心张力、共同盲点、建议路径、信心等级。",
    "需要行业化配方时，参考 [高级配置示例](references/advanced-configurations.md)。",
  ],
  checklist: [
    "问题是否真的值得做多角色议会推演。",
    "选出的角色之间是否存在真实冲突。",
    "每个角色是否都说清了自己的立场和风险点。",
    "综合部分是否提炼出“核心张力”，而不是复读每个人说过的话。",
    "输出是否收敛成用户可执行的下一步。",
  ],
  relatedSkills: [
    {
      get id() {
        return grillMeSkill.id;
      },
      reason: "如果重点是把现有方案问穿，优先配合 `grill-me`。",
    },
    {
      get id() {
        return whatIfOracleSkill.id;
      },
      reason: "如果重点是未来分支推演，优先配合 `what-if-oracle`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-configurations",
      source: new URL("./references/advanced-configurations.md", import.meta.url),
      target: "references/advanced-configurations.md",
      title: "advanced-configurations.md",
      summary: "Reference material for consciousness-council.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "six-hats-api-testing-example",
      source: new URL("./references/six-hats-api-testing-example.md", import.meta.url),
      target: "references/six-hats-api-testing-example.md",
      title: "six-hats-api-testing-example.md",
      summary: "Reference material for consciousness-council.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "six-hats-guide",
      source: new URL("./references/six-hats-guide.md", import.meta.url),
      target: "references/six-hats-guide.md",
      title: "six-hats-guide.md",
      summary: "Reference material for consciousness-council.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "six-hats-solo-template",
      source: new URL("./references/six-hats-solo-template.md", import.meta.url),
      target: "references/six-hats-solo-template.md",
      title: "six-hats-solo-template.md",
      summary: "Reference material for consciousness-council.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "six-hats-team-template",
      source: new URL("./references/six-hats-team-template.md", import.meta.url),
      target: "references/six-hats-team-template.md",
      title: "six-hats-team-template.md",
      summary: "Reference material for consciousness-council.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
