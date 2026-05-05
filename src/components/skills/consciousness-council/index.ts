import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
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
  antiPatterns: [
    defineAntiPattern({
      fail: "角色全部点头",
      pass: "制造实质张力",
    }),
    defineAntiPattern({
      fail: "简单事实硬套议会",
      pass: "议会有阈值",
    }),
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
      summary: "议会高级配置示例：角色配方、行业化场景与参数调优。",
      loadWhen: "需要行业化角色配方或高级议会配置时读取。",
    }),
    defineReference({
      id: "six-hats-api-testing-example",
      source: new URL("./references/six-hats-api-testing-example.md", import.meta.url),
      target: "references/six-hats-api-testing-example.md",
      title: "six-hats-api-testing-example.md",
      summary: "六顶思考帽在 API 测试场景中的完整应用示例。",
      loadWhen: "需要了解六顶思考帽在技术评审中如何实际应用时读取。",
    }),
    defineReference({
      id: "six-hats-guide",
      source: new URL("./references/six-hats-guide.md", import.meta.url),
      target: "references/six-hats-guide.md",
      title: "six-hats-guide.md",
      summary: "六顶思考帽完整使用指南：每顶帽子的角色、提问框架与切换规则。",
      loadWhen: "需要执行六顶思考帽模式或了解各帽子角色分工时读取。",
    }),
    defineReference({
      id: "six-hats-solo-template",
      source: new URL("./references/six-hats-solo-template.md", import.meta.url),
      target: "references/six-hats-solo-template.md",
      title: "six-hats-solo-template.md",
      summary: "六顶思考帽单人模式模板：个体独立完成多视角思辨的流程。",
      loadWhen: "需要单人使用六顶思考帽模式进行决策推演时读取。",
    }),
    defineReference({
      id: "six-hats-team-template",
      source: new URL("./references/six-hats-team-template.md", import.meta.url),
      target: "references/six-hats-team-template.md",
      title: "six-hats-team-template.md",
      summary: "六顶思考帽团队模式模板：多人分角色进行平行思考的流程。",
      loadWhen: "需要团队使用六顶思考帽模式进行集体思辨时读取。",
    }),
  ],
});
