import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
