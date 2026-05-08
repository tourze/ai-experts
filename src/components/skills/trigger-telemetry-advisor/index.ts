import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkillOutputs,
  defineWorkflow,
  defineSkill,
  defineWorkflowStep,
} from "../../sdk";

export const triggerTelemetryAdvisorSkill = defineSkill({
  id: "trigger-telemetry-advisor",
  fullName: "Trigger Telemetry Advisor",
  description: "当用户要分析 hook/skill telemetry、触发审计、dispatch 错误或 SKILL 脚本运行故障时使用。",
  useCases: [
    "当用户要分析 hook/skill telemetry、触发审计、dispatch 错误或 SKILL 脚本运行故障时使用。",
  ],
  constraints: [
    "优先使用本地可验证 telemetry、hook 配置和源码证据，不凭触发描述推断。",
    "当前会话分析依赖 `session_id` 或 `transcript_path`；缺失时必须标注数据质量限制并退回工作区时间窗分析。",
    "不同 workspace、session、platform 和 hook id 不能混用口径。",
    "不要在分析阶段清理或轮转 telemetry；清理只在用户明确要求时执行。",
    "外部报告不得原样贴完整命令、prompt 或敏感路径，必要时脱敏。",
  ],
  checklist: [
    "是否确认 ai-experts hook telemetry 已安装并启用。",
    "是否读取 runtime 记录、hook 配置和相关 skill 定义。",
    "是否标注 session 级过滤是否可用、旧格式日志和 runtime 数据缺失。",
    "是否按 P0/P1/P2 给发现，并绑定 hook 名、decision 计数、文件路径或 skill 名。",
    "建议是否能落到具体文件、测试、description、eval 或 telemetry 配置。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "telemetry 记录为 0 时直接判断 hook/skill 健康。",
      pass: "先验证安装、环境变量、工作区分桶路径和 telemetry 开关。",
    }),
    defineAntiPattern({
      fail: "高频 report 只建议“优化描述”。",
      pass: "给出具体 reason、触发条件、降噪方式或测试补充点。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认当前仓库是否实际安装并启用了 ai-experts hook telemetry。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "读取 runtime 记录、hook 配置和相关 skill 定义，优先使用本地日志而不是触发描述。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "当前会话请求先检查 `session_id` 或 `transcript_path`；缺失时退回工作区时间窗分析。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "跨进程或跨目录总览按 workspace、session、platform 和 hook id 聚合，避免混用口径。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "人工校准热点时优先定位 `error`、重复 `block`、高频不可行动 `report`、`skip` 缺失和异常耗时。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "回到源码和测试验证规则是否过宽，再给出具体修改文件和最小验证命令。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "范围与数据质量：工作区/会话、天数、记录数、旧格式日志和 runtime 数据缺口。",
      "P0/P1/P2 关键发现：hook 名、decision 计数、文件路径、skill 名或缺失 eval 数。",
      "建议改动、验证命令、数据口径限制和需要脱敏的报告内容。",
    ],
  }),
});
