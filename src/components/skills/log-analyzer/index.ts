import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
