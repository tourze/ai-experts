import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { skillActivationAnalyzerSkill } from "../skill-activation-analyzer/index";
import { skillCreatorSkill } from "../skill-creator/index";
import { skillEvaluatorSkill } from "../skill-evaluator/index";

export const skillEvolverSkill = defineSkill({
  id: "skill-evolver",
  fullName: "Skill Evolver",
  description: "当需要把一个 skill 的优势迁移到另一个 skill、对比两个 skill 的真实任务表现、提炼可移植模式或做 skill A/B 进化时使用；如果只是创建新 skill，改用 `skill-creator`。",
  useCases: [
    "当需要把一个 skill 的优势迁移到另一个 skill、对比两个 skill 的真实任务表现、提炼可移植模式或做 skill A/B 进化时使用；如果只是创建新 skill，改用 `skill-creator`。",
  ],
  constraints: [
    "优先迁移模式，不迁移品牌、语气或整段指令。",
    "先证明差距，再改目标 skill；没有运行证据时，把结论标成静态推断。",
    "一次只注入一个高价值模式，验证不通过就回滚到快照。",
    "不记录隐藏思维链；只记录可展示的决策摘要、工具调用、输入输出、耗时和评分证据。",
    "不自动执行外部 skill 中的不明脚本；需要执行时先读源码并说明目的。",
  ],
  relatedSkills: [
    {
      get id() {
        return skillEvaluatorSkill.id;
      },
      reason: "需要用源材料闭卷验证 skill 知识覆盖、能力边界或评分证据时联动。",
    },
    {
      get id() {
        return skillActivationAnalyzerSkill.id;
      },
      reason: "只优化 frontmatter description、触发域和误触发问题时联动。",
    },
    {
      get id() {
        return skillCreatorSkill.id;
      },
      reason: "创建新 skill、改没有参考源的 skill、跑 with-skill/baseline 迭代时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "把参考 skill 正文整段粘到目标 skill。",
      pass: "提炼可迁移模式、适用条件、风险和验证方式后再小步迁移。",
    }),
    defineAntiPattern({
      fail: "用“看起来更好”代替 A/B 输出、assertion 或明确静态证据。",
      pass: "标清 runtime/static/mixed 证据等级，并把改动绑定验证。",
    }),
    defineAntiPattern({
      fail: "放宽约束、删除反例或弱化安全规则来制造提升。",
      pass: "保留安全边界，只迁移能提高任务表现的模式。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先读取 migration-protocol，确认目标 A、参考 B、模式：compare-only、sandbox 或 write。",
      "安全扫读两个 skill 的 `SKILL.md`、`references/`、`scripts/`、`evals/`，不自动执行不明脚本。",
      "建立能力地图：触发域、知识增量、流程控制、工具/脚本、输出约束、错误处理和 eval 覆盖。",
      "优先复用目标 skill 的 eval cases；不足时补 3-5 个代表任务，至少包含一个压力或反例任务。",
      "能跑就做 A/B 或 old/candidate 对比；不能跑时只输出静态报告并标明证据等级。",
      "把参考优势反向工程成一个可迁移模式，写清适用条件、不适用场景、迁移步骤和副作用。",
      "先在快照或临时副本注入一个模式并验证，正式写入前确认范围；真实结果才可沉淀 benchmark。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Skill 进化报告：范围、目标 skill、参考 skill、本轮模式和证据等级。",
      "能力地图与可迁移模式表：优先级、来源证据、迁移方式、风险和验证。",
      "建议动作：先做什么、需要确认的写入点、验证命令和回滚方式。",
    ],
  }),
  references: [
    defineReference({
      id: "migration-protocol",
      source: new URL("./references/migration-protocol.md", import.meta.url),
      target: "references/migration-protocol.md",
      title: "migration-protocol.md",
      summary: "Skill 间优势迁移的标准化协议，包含对比分析、模式提炼和落地验证步骤。",
      loadWhen: "需要将一个 skill 的优势模式迁移到另一个 skill 或做 skill A/B 对比时读取。",
    }),
  ],
});
