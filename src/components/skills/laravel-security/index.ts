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
import { laravelTddSkill } from "../laravel-tdd/index";
import { laravelVerificationSkill } from "../laravel-verification/index";

export const laravelSecuritySkill = defineSkill({
  id: "laravel-security",
  fullName: "Laravel 安全基线",
  description: "当用户提到 Laravel 安全、Sanctum、Policy、FormRequest、文件上传安全、CORS、安全头或密钥管理时使用。",
  useCases: [
    "新增登录、API 令牌、策略、上传接口、Webhook 或任何处理用户输入的 Laravel 端点。",
    "需要为 Laravel 应用补齐认证授权、验证、速率限制和部署安全设置。",
    "发布前检查安全配置、签名链接、CORS 与日志脱敏是否到位。",
    "需要实现层面的配套测试时参考 `laravel-tdd`；需要发布前全量自检时参考 `laravel-verification`。",
  ],
  constraints: [
    "认证不等于授权：`auth:sanctum` 保护入口，`Policy` / `authorize()` 决定资源权限。",
    "用户输入默认不可信，所有写入口先经 `FormRequest`，禁止把派生字段从请求直接灌进模型。",
    "批量赋值必须显式控制；敏感文件默认落到非公开磁盘，并校验 MIME、大小和扩展名。",
    "对登录、重置密码、OTP、导出等高风险入口设置独立限流，不共享宽松阈值。",
    "`APP_DEBUG=false`、密钥轮换、日志脱敏和 HTTPS 代理配置属于基线，而不是可选项。",
  ],
  checklist: [
    "每个受保护路由都同时检查“谁能进来”和“谁能操作这个资源”。",
    "文件上传是否验证 MIME、大小、目标磁盘和后续扫描流程。",
    "模型是否显式声明 `$fillable` 或 `$guarded`，避免 `Model::unguard()` 渗透全局。",
    "登录、重置密码、OTP、导出、Webhook 是否有独立速率限制和审计日志。",
    "`APP_DEBUG`、`APP_KEY`、HTTPS 代理、Cookie 标志位、CORS 和安全头是否在目标环境真实生效。",
  ],
  relatedSkills: [
    {
      get id() {
        return laravelVerificationSkill.id;
      },
      reason: "安全配置需要发布前环境、缓存、审计、迁移或依赖检查时联动。",
    },
    {
      get id() {
        return laravelTddSkill.id;
      },
      reason: "Policy、FormRequest、上传、限流或认证授权需要测试覆盖时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "只认证不鉴权",
      pass: "Policy + FormRequest",
    }),
    defineAntiPattern({
      fail: "批量赋值全开",
      pass: "显式 $fillable / $guarded 白名单",
    }),
    defineAntiPattern({
      fail: "上传文件放公开目录",
      pass: "非公开磁盘 + MIME/大小校验",
    }),
    defineAntiPattern({
      fail: "日志记录明文 token",
      pass: "敏感字段脱敏或不记录",
    }),
    defineAntiPattern({
      fail: "线上 APP_DEBUG=true",
      pass: "生产环境强制关闭 debug",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "为 Laravel 入口补认证授权、Policy、FormRequest、上传校验、限流、安全头、密钥管理、日志脱敏和生产配置基线。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先列出受保护路由、用户输入、文件上传、令牌、Webhook、高风险入口和目标部署环境。",
      "入口用 auth 中间件保护，资源权限用 Policy / authorize 判断，写入口先经过 FormRequest。",
      "上传校验 MIME、大小和磁盘；登录、重置密码、OTP、导出和 Webhook 设独立限流。",
      "FormRequest 上传和 RateLimiter 示例读取 `security-code-patterns`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "认证授权、Policy、FormRequest、上传、限流和日志脱敏结论。",
      "APP_DEBUG、APP_KEY、HTTPS 代理、Cookie、CORS、安全头和密钥风险。",
      "需要补的 Laravel 测试、发布检查和剩余安全风险。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "security-code-patterns",
      source: new URL("./references/security-code-patterns.md", import.meta.url),
      target: "references/security-code-patterns.md",
      title: "Laravel 安全代码模式",
      summary: "FormRequest 文件上传授权校验和 RateLimiter 独立限流示例。",
      loadWhen: "需要快速实现 Laravel 上传校验、入口授权或限流时读取。",
    }),
  ],
});
