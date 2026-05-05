import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
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
      reason: "如果问题仍未聚焦，转到 `incident-response`。",
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
