import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const skillEvalGraderSkill = defineSkill({
  id: "skill-eval-grader",
  fullName: "Skill Eval Grader",
  description: "当用户要根据 transcript、outputs 和 expectations 评估一次 skill/eval 执行是否通过，或审查 eval assertions 是否有区分度时使用。",
  useCases: [
    "已有 `transcript`、输出目录和 expectations，需要逐条判定 PASS / FAIL。",
    "需要验证输出文件的真实内容，而不是只相信 transcript 的自述。",
    "需要从输出中抽取额外 claims，发现 expectations 没覆盖的风险。",
    "需要判断 assertion 是否太弱、太表层或无法验证。",
  ],
  constraints: [
    "通过的举证责任在被评估输出一方；找不到证据就是 FAIL。",
    "必须读取 transcript 和实际输出文件；输出不是纯文本时使用可用检查工具，不只看文件名。",
    "PASS 必须有实质证据，不能是“文件存在”“提到了关键词”这类表层合规。",
    "预设 expectations 之外，还要抽取事实、过程和质量 claims，并标明是否可验证。",
    "发现弱 assertion 时要指出 eval 缺口，但不要为了挑毛病而泛化批评。",
  ],
  checklist: [
    "已完整读取 transcript，并记录执行错误、跳过项和自述不确定性。",
    "已列出 outputs，并检查与每条 expectation 相关的真实文件内容。",
    "每条 PASS / FAIL 都有具体证据或缺证据说明。",
    "已抽取并验证输出中的事实、过程和质量 claims。",
    "已指出明显太弱、无法验证或遗漏关键结果的 assertion。",
    "汇总包含 passed、failed、total 和 pass_rate。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "只看 transcript 自述：实际输出可能为空、路径错误或内容不符合要求。",
      pass: "读取输出并验证实质内容",
    }),
    defineAntiPattern({
      fail: "表层 assertion 制造虚假信心：任何空泛文本都能通过，无法判断安全审计是否有效。",
      pass: "Assertion 绑定可观察结果",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先完整读取 transcript，记录执行错误、跳过项、自述不确定性和声称已验证的内容。",
      "列出 outputs 并读取与每条 expectation 相关的真实文件内容；找不到证据就是 FAIL。",
      "逐条 expectation 判定 passed、failed、evidence；PASS 必须绑定实质证据，不接受只存在文件或关键词命中。",
      "从输出中抽取事实、过程和质量 claims，标注 process/fact/quality、verified 和 evidence。",
      "审查 assertion 是否太弱、不可验证或漏掉关键结果，并给出可操作 eval_feedback。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "expectations 数组：text、passed、evidence 或缺证据说明。",
      "summary：passed、failed、total、pass_rate。",
      "claims 与 eval_feedback：claim、type、verified、evidence、assertion、reason、overall。",
    ],
  }),
  tools: [],
});
