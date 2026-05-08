import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";

export const owaspAuthDataAuditSkill = defineSkill({
  id: "owasp-auth-data-audit",
  fullName: "OWASP 认证与数据安全审计",
  description: "当需要审计认证会话安全、密钥管理、敏感数据暴露或批量赋值漏洞时使用。适用于 token/JWT/session/cookie/OAuth 认证链路、`api_key`/`API_KEY`/`process.env` 密钥硬编码、`assign(`/`bind(`/`updateAll` 批量赋值等代码模式的安全审查。",
  useCases: [
    "当需要审计认证会话安全、密钥管理、敏感数据暴露或批量赋值漏洞时使用。适用于 token/JWT/session/cookie/OAuth 认证链路、`api_key`/`API_KEY`/`process.env` 密钥硬编码、`assign(`/`bind(`/`updateAll` 批量赋值等代码模式的安全审查。",
  ],
  constraints: [
    "每条认证、密钥或批量赋值发现必须绑定文件:行、代码片段、攻击向量和可利用性评估。",
    "认证结论必须覆盖令牌生命周期、传输安全、存储位置、撤销机制和敏感操作二次验证。",
    "密钥管理审计必须区分源码硬编码、配置泄漏、日志泄漏、历史提交残留和权限过大。",
    "批量赋值审计必须确认请求输入能否修改 role、isAdmin、balance、verified、status 等敏感字段。",
    "不要把前端路由守卫、`.gitignore` 或数据库约束当作唯一安全控制。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "JWT 长期有效且没有撤销机制，或 token 存在 localStorage。",
      pass: "短 access token、可撤销 refresh token、httpOnly cookie 或 BFF 模式。",
    }),
    defineAntiPattern({
      fail: "生产密钥写在源码、注释、CI 日志或历史提交中。",
      pass: "使用 secret manager/KMS、脱敏日志、轮换密钥并清理历史残留。",
    }),
    defineAntiPattern({
      fail: "直接把 request.body 或 $_POST 整体传给 ORM create/update。",
      pass: "显式字段白名单、DTO 校验和敏感字段服务端保护。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先按触发信号路由：token/JWT/session/cookie/OAuth 为认证会话，secret/key/password/PII/process.env 为密钥管理，assign/bind/updateAll/ORM save 为批量赋值。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "认证会话检查 access token 时长、JWT `exp/iat/nbf`、refresh token 撤销、cookie flags、SPA token 存储、session fixation、OAuth state/redirect_uri/code。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "敏感操作检查修改密码、绑定手机、提现等是否有 MFA 或服务端二次鉴权。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "密钥管理检查源码、配置、CI、日志、错误消息、`.env` 跟踪、历史提交和 scope/IP/rate limit。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "批量赋值检查 ORM/DTO 字段白名单，确认请求是否可改 role、isAdmin、balance、verified、status。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "每条发现按 confirmed、likely、speculative 标注可利用性，并给出最小修复和验证方法。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "认证与数据安全审计结果：认证会话、密钥管理、批量赋值三个分区。",
      "每条发现：位置、问题、攻击向量、严重度、证据、可利用性和修复建议。",
      "补救计划：令牌/会话调整、密钥轮换和脱敏、字段白名单/DTO 重构、历史泄漏处理。",
    ],
  }),
});
