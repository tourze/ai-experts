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
import { architectureReviewerSkill } from "../architecture-reviewer/index";
import { planReviewSkill } from "../plan-review/index";

export const apiTraceReaderSkill = defineSkill({
  id: "api-trace-reader",
  fullName: "api-trace-reader",
  description: "在需要只读追踪接口、任务、事件或定时任务的调用链时使用。",
  useCases: [
    "当用户问“这个接口都干了什么”“什么情况会触发”“帮我串一下调用链”时使用。",
    "适合定位数据库写入、缓存变更、消息投递、定时任务和事件监听的真实来源。",
    "需要基于只读证据串起真实代码调用链，而不是评审方案或直接改代码。",
  ],
  constraints: [
    "只允许只读操作：`Read` / `Grep` / `Glob` / 只读 Bash。",
    "禁止 `Edit` / `Write` / 迁移 / 清缓存 / 推送 / 任何会改状态的命令。",
    "每条结论必须带 `file:line`、日志片段或 grep 证据，禁止“我猜”。",
    "输出标题固定为 `入口`、`调用链`、`数据读写`、`异步副作用`、`风险点`、`验证方式`。",
  ],
  checklist: [
    "是否确认了入口是 HTTP、CLI、消费者、定时任务、事件还是 webhook。",
    "是否列出了每一级调用者、被调者和关键参数流向。",
    "是否单列了 READ / WRITE / CACHE / MQ / EXTERNAL / FS 副作用。",
    "是否补齐异步链路、重试逻辑、监听器和延迟任务。",
  ],
  relatedSkills: [
    {
      get id() {
        return architectureReviewerSkill.id;
      },
      reason: "调用链发现上升为系统级结构、企业就绪或子系统审计问题时联动。",
    },
    {
      get id() {
        return planReviewSkill.id;
      },
      reason: "用户要审查方案、RFC 或实现计划，而不是追踪已存在调用链时转向。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "边追边改",
      pass: "严格只读",
    }),
    defineAntiPattern({
      fail: "主干 only",
      pass: "全副作用",
    }),
    defineAntiPattern({
      fail: "没证据下结论",
      pass: "file:line 锚定",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "只读追踪接口、任务、事件或定时任务的真实调用链，定位数据读写、异步副作用、风险点和验证方式。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先判断入口类型是 HTTP、CLI、消费者、定时任务、事件还是 webhook，必要时读取 `entry-types`。",
      "沿代码逐级追踪调用者、被调者、关键参数和分支条件，不执行会改状态的命令。",
      "单列 READ / WRITE / CACHE / MQ / EXTERNAL / FS 副作用，并补齐重试、监听器、延迟任务和异步链路。",
      "输出格式对齐 `output-example`，风险分级读取 `risk-rubric`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "`入口`、`调用链`、`数据读写`、`异步副作用`、`风险点`、`验证方式` 六段输出。",
      "每条结论的 `file:line`、日志片段、grep 证据或明确待验证项。",
      "主链路、旁路副作用和需要上升到架构审计或计划评审的风险。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "entry-types",
      source: new URL("./references/entry-types.md", import.meta.url),
      target: "references/entry-types.md",
      title: "entry-types.md",
      summary: "API 入口类型分类：HTTP、CLI、消费者、定时任务、事件与 webhook。",
      loadWhen: "需要识别追踪目标的入口类型或判断调用链起始点时读取。",
    }),
    defineReference({
      id: "output-example",
      source: new URL("./references/output-example.md", import.meta.url),
      target: "references/output-example.md",
      title: "output-example.md",
      summary: "API 调用链追踪报告的输出模板与写作规范示例。",
      loadWhen: "需要生成标准格式的调用链追踪报告时读取。",
    }),
    defineReference({
      id: "risk-rubric",
      source: new URL("./references/risk-rubric.md", import.meta.url),
      target: "references/risk-rubric.md",
      title: "risk-rubric.md",
      summary: "API 调用链风险分级标准与评估维度说明。",
      loadWhen: "需要评估追踪结果中的风险等级或制定修复优先级时读取。",
    }),
  ],
});
