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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
