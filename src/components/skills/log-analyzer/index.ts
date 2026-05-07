import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { incidentResponseSkill } from "../incident-response/index";

export const logAnalyzerSkill = defineSkill({
  id: "log-analyzer",
  fullName: "日志分析",
  description: "当用户需要查日志、对齐时间线、关联错误上下文或定位根因时使用。",
  useCases: [
    "按时间窗追踪异常请求、崩溃、超时或重试风暴。",
    "需要从系统日志和应用日志里抽出关键线索。",
    "已知服务异常，但还不知道第一处异常副作用在哪里出现。",
  ],
  constraints: [
    "先缩小时间范围，再扩大搜索关键词；不要一上来全量扫大日志。",
    "读取日志时要告诉用户来源文件或来源命令。",
    "输出前必须裁剪或脱敏 token、密码、邮箱和完整 IP。",
    "优先找“第一条异常”和“重复模式”，不要只贴最后一条报错。",
  ],
  checklist: [
    "是否明确了时间范围、日志源、关键词和关联 ID。",
    "是否提炼出第一条异常、最高频异常和受影响组件。",
    "是否补充了上下文行，而不是单独摘一条孤立报错。",
    "是否识别出周期性、突发性或发布后回归模式。",
  ],
  relatedSkills: [
    {
      get id() {
        return incidentResponseSkill.id;
      },
      reason: "日志线索指向线上事故、影响面扩大或需要处置编排时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "贴原始日志让用户自己找",
      pass: "提炼关键模式 + 时间线",
    }),
    defineAntiPattern({
      fail: "全量扫大日志",
      pass: "先窗口再关键词",
    }),
    defineAntiPattern({
      fail: "分享日志保留敏感信息",
      pass: "脱敏",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认时间范围、日志源、关键词、请求 ID / trace ID / host / service 等关联线索。",
      "从小时间窗开始筛选，再逐步扩大；常用命令包括 `journalctl --since ... -p err`、`grep -in ... | tail`、`jq 'select(...)' ...`。",
      "同时找第一条异常、最高频异常、上下文行和发布/配置/流量变化点；不要只贴最后一条错误。",
      "输出前脱敏 token、密码、邮箱和完整 IP；如果影响面扩大或需要处置编排，联动 incident response。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "日志来源文件或命令、时间窗、筛选条件和脱敏后的关键片段。",
      "时间线：第一条异常、重复模式、受影响组件、上下游先后关系和证据强度。",
      "根因假设、仍需验证的问题、下一步命令或 incident response 交接条件。",
    ],
  }),
});
