import { defineHook, HookEvent, KnownTool, Platform, type NormalizedHookPayload } from "../../sdk";

export const securitySecretLeakGuardHook = defineHook({
  id: "security-secret-leak-guard",
  description: "拦截读取私钥、凭据文件及通过网络发送敏感变量等泄露风险。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Bash],
  entry: new URL("./security-secret-leak-guard.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
});

/**
 * 敏感信息泄露拦截 hook（PreToolUse — Bash）
 *
 * 拦截通过 Bash 命令可能导致密钥泄露的操作：
 *   - cat/echo/print 输出私钥、凭据文件
 *   - curl/wget 上传包含密钥变量的请求
 *   - 将敏感环境变量 echo 到文件或管道
 *   - base64 编码私钥（常见泄露前奏）
 */

// ── 拦截：输出敏感文件内容 ──
const SENSITIVE_FILE_READ: readonly (readonly [RegExp, string])[] = [
  [
    /\b(?:cat|head|tail|less|more|bat)\s+[^\n|;]*(?:\.pem|\.key|\.p12|\.pfx|id_rsa|id_ed25519|\.jks|\.keystore)\b/i,
    "正在读取可能包含私钥的文件，内容将显示在终端/日志中",
  ],
  [
    /\b(?:cat|head|tail)\s+[^\n|;]*(?:\/\.env(?:\s|$)|credentials\.json|\.aws\/credentials|\.docker\/config\.json|\.netrc|\.git-credentials)/i,
    "正在读取凭据文件，内容将暴露在终端/日志中",
  ],
];

// ── 拦截：通过网络发送敏感变量 ──
const SENSITIVE_NETWORK: readonly (readonly [RegExp, string])[] = [
  [
    /\bcurl\b[^;|&]*(?:PRIVATE_KEY|SECRET_KEY|API_SECRET|AWS_SECRET|DATABASE_PASSWORD|DB_PASSWORD)/i,
    "curl 命令中引用了敏感环境变量，可能导致密钥通过网络泄露",
  ],
  [
    /\b(?:curl|wget|http)\b[^;|&]*(?:--data|--form|-d|-F)\s[^;|&]*(?:password|secret|token|api.?key)/i,
    "HTTP 请求中包含敏感参数名，请确认是否为安全的目标地址",
  ],
];

// ── 拦截：base64 编码私钥 ──
const SENSITIVE_ENCODE: readonly (readonly [RegExp, string])[] = [
  [
    /\bbase64\b[^;|&]*(?:\.pem|\.key|id_rsa|id_ed25519|PRIVATE)/i,
    "正在 base64 编码私钥文件——这通常是泄露或不安全传输的前奏",
  ],
];

// ── 拦截：echo 密钥到文件 ──
const SENSITIVE_ECHO: readonly (readonly [RegExp, string])[] = [
  [
    /\becho\b[^;|&]*(?:PRIVATE_KEY|SECRET_KEY|API_SECRET|AWS_SECRET_ACCESS_KEY|DATABASE_PASSWORD)[^;|&]*>/i,
    "正在将敏感环境变量写入文件，请确认目标文件不会被提交",
  ],
];

const ALL_RULES = [
  ...SENSITIVE_FILE_READ,
  ...SENSITIVE_NETWORK,
  ...SENSITIVE_ENCODE,
  ...SENSITIVE_ECHO,
];

export async function run(payload: NormalizedHookPayload) {
  const command = payload?.tool?.input?.command || "";

  for (const [pattern, reason] of ALL_RULES) {
    if (pattern.test(command)) {
      return {
        decision: "block",
        reason: [
          "[Secret Leak Guard] 已拦截可能泄露敏感信息的命令",
          "",
          `原因：${reason}`,
          `命令：${command}`,
          "",
          "如确需执行，请先得到用户明确授权。",
        ].join("\n"),
      };
    }
  }

  return null;
}
