import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
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
      reason: "需要实现层面的配套测试时参考 `laravel-tdd`；需要发布前全量自检时参考 `laravel-verification`。",
    },
    {
      get id() {
        return laravelTddSkill.id;
      },
      reason: "需要实现层面的配套测试时参考 `laravel-tdd`；需要发布前全量自检时参考 `laravel-verification`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
