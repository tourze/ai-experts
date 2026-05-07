import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const designingGrowthLoopsSkill = defineSkill({
  id: "designing-growth-loops",
  fullName: "设计增长飞轮",
  description: "当用户要设计增长飞轮、邀请推荐、内容供给循环、产品驱动获客、留存复利，或分析 S 曲线增长阶段、跨越鸿沟策略、PLG 产品自服务增长就绪度时使用。",
  useCases: [
    "产品已有一定留存基础，想把拉新、激活、留存和分享串成闭环。",
    "需要结合 [references/guest-insights.md](references/guest-insights.md) 提炼常见增长模式或限制条件。",
  ],
  constraints: [
    "先确认核心用户价值和自然传播时刻，再设计分享或邀请机制。",
    "飞轮必须说明输入、产出、反馈路径与放大条件，不能只是一张漏斗图。",
    "如果留存、LTV 或用户价值不足，优先修产品基础，而不是强推裂变。",
  ],
  checklist: [
    "已识别主循环、触发点和关键阻尼项。",
    "指标覆盖转化、留存、分享率和回流效率。",
    "已明确需要的产品、运营或激励支撑。",
    "飞轮假设可被实验验证，而不是纯口号。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "一次性活动当飞轮",
      pass: "持续闭环",
    }),
    defineAntiPattern({
      fail: "留存差就堆奖励",
      pass: "先修核心价值",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "把一次性获客动作改造成可重复的增长循环，并明确循环成立的价值、反馈、阻尼和实验验证方式。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认产品的核心用户价值、留存基础、自然传播时刻和当前增长阶段；留存不足时先回到产品价值修复。",
      "画出主循环：输入动作 -> 用户获得价值 -> 产生可传播资产 -> 新用户进入 -> 留存放大。",
      "标注每个节点的放大条件、阻尼项和可控杠杆，区分产品机制、运营动作和激励机制。",
      "需要判断阶段或模式时读取 `s-curve-growth`、`crossing-the-chasm`、`plg-readiness` 或 `guest-insights` reference。",
      "为循环设置指标：触发率、转化率、留存、分享率、回流效率和循环周期。",
      "把最大不确定性转成实验，定义样本、阈值、观察期和停止条件。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "增长循环图和主循环叙述。",
      "节点杠杆、阻尼项和所需产品/运营支撑。",
      "循环指标体系和当前基线。",
      "增长假设、实验计划和阶段判断依据。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "crossing-the-chasm",
      source: new URL("./references/crossing-the-chasm.md", import.meta.url),
      target: "references/crossing-the-chasm.md",
      title: "crossing-the-chasm.md",
      summary: "Geoffrey Moore 跨越鸿沟理论的核心框架与增长阶段判断方法。",
      loadWhen: "需要判断产品所处增长阶段或制定早期市场到主流市场过渡策略时读取。",
    }),
    defineReference({
      id: "guest-insights",
      source: new URL("./references/guest-insights.md", import.meta.url),
      target: "references/guest-insights.md",
      title: "guest-insights.md",
      summary: "常见增长模式的归纳总结与适用条件分析。",
      loadWhen: "需要参考常见增长模式设计增长飞轮或识别限制条件时读取。",
    }),
    defineReference({
      id: "plg-readiness",
      source: new URL("./references/plg-readiness.md", import.meta.url),
      target: "references/plg-readiness.md",
      title: "plg-readiness.md",
      summary: "产品驱动增长（PLG）就绪度评估框架，包括产品自服务能力判断。",
      loadWhen: "需要评估产品是否适合采用 PLG 模式或检查 PLG 基础能力时读取。",
    }),
    defineReference({
      id: "s-curve-growth",
      source: new URL("./references/s-curve-growth.md", import.meta.url),
      target: "references/s-curve-growth.md",
      title: "s-curve-growth.md",
      summary: "S 曲线增长模型的动力学分析与阶段转换策略。",
      loadWhen: "需要分析产品增长的 S 曲线阶段或规划跨阶段增长策略时读取。",
    }),
  ],
});
