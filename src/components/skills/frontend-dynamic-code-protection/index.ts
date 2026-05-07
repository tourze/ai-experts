import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const frontendDynamicCodeProtectionSkill = defineSkill({
  id: "frontend-dynamic-code-protection",
  fullName: "前端动态化代码保护",
  description: "当用户需要为 H5/Web 前端的人机对抗、防刷量、反爬虫、请求参数保护、JavaScript 混淆或动态化代码保护设计、审计或改进方案时使用；尤其是登录注册、投票领券、风控校验、API 参数签名、客户端加密和高收益活动页面。",
  useCases: [
    "高收益 Web/H5 页面面临脚本刷量、请求伪造、批量注册、投票、领券或爬虫采集。",
    "需要审计“客户端加密”“参数签名”“JS 混淆”“anti-bot challenge”是否只是表面保护。",
    "需要设计短生命周期、动态生成、服务端可验证的前端保护逻辑。",
    "需要把前端保护接入威胁建模、风控、缓存、构建和验收测试。",
  ],
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  checklist: [
    "是否明确这是反自动化成本控制，而不是绝对安全承诺。",
    "是否把可逆变换、signature 生成、有效期和服务端验签绑定起来。",
    "是否避免在 JS 中长期暴露密钥、规则阈值、函数编号和可稳定匹配的特征。",
    "是否单独处理缓存、构建速度、灰度回滚和失败降级。",
    "是否有服务端风控、限流、权限校验和业务一致性校验兜底。",
    "是否覆盖重放、过期、并发、多标签页、弱网和低端设备。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "把 `terser` 压缩后的 bundle 当保护；浏览器格式化后参数构造仍可读。",
      pass: "把保护点放在服务端挑战、签名和行为校验上，混淆只作为辅助手段。",
    }),
    defineAntiPattern({
      fail: "在 JS 中写固定密钥、固定函数编号或固定规则阈值；攻击者提取一次即可长期复用。",
      pass: "密钥和规则留在服务端，客户端只拿短期动态片段。",
    }),
    defineAntiPattern({
      fail: "动态保护片段使用长期缓存；旧片段会导致正常用户验签失败，也会扩大重放窗口。",
      pass: "动态保护片段设置短 TTL，并绑定版本、会话和服务端验证。",
    }),
    defineAntiPattern({
      fail: "只加混淆不做服务端验签、重放限制、限流和业务一致性校验。",
      pass: "组合服务端验签、重放限制、限流和业务一致性校验。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "为 H5/Web 高收益场景设计前端动态化代码保护、短生命周期 signature、服务端验签、重放限制、缓存策略和风控信号闭环。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先明确资产、攻击者类型和成本目标，确认这是反自动化成本控制而非绝对安全承诺。",
      "审计参数生成、签名、混淆、challenge、缓存和服务端验签入口，区分请求伪造、脚本自动化和重放攻击。",
      "将保护逻辑独立构建、短缓存、灰度发布，signature 绑定组合标识、随机数、时间戳、版本和上下文。",
      "完整对抗目标、动态化设计、工程约束和验证监控流程读取 `protection-framework`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "前端保护资产、攻击模型、可见逻辑和服务端最终判定边界。",
      "动态片段、signature、缓存、灰度、验签、重放限制和风控日志方案。",
      "重放、过期、多标签、弱网、低端设备、性能和业务转化验证清单。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "protection-framework",
      source: new URL("./references/protection-framework.md", import.meta.url),
      target: "references/protection-framework.md",
      title: "前端动态化代码保护框架",
      summary: "前端动态化代码保护的来源材料、核心判断、工作流、工程约束、验证和监控方法。",
      loadWhen: "需要设计或审计 H5/Web 参数保护、anti-bot challenge 或动态签名方案时读取。",
    }),
  ],
});
