import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

import { basename, normalize } from "node:path";

export const securitySecretWriteGuardHook = defineHook({
  id: "security-secret-write-guard",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./security-secret-write-guard.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * 敏感文件写入拦截 hook（PreToolUse — Edit|Write）
 *
 * 阻止向可能包含密钥、凭据或证书的路径写入内容。
 * 分两层：
 *   Block — 高置信度敏感路径（.env, *.pem, *.key, id_rsa 等）
 *   Report — 中置信度敏感路径（*credential*, *secret*, *token* 等关键词匹配）
 *
 * 白名单豁免测试夹具、文档和模板文件。
 */

// ── 白名单：这些路径不应触发拦截 ──
const WHITELIST = [
  /(?:^|\/)(?:test|tests|__tests__|__mocks__|fixtures|testdata|mock)\//i,
  /(?:^|\/)(?:example|examples|sample|samples|template|templates)\//i,
  /(?:^|\/)(?:docs?|documentation)\//i,
  /\.(?:md|rst|adoc)$/i,               // 文档标记文件（不含 .txt —— 太宽泛）
  /\.env\.example$/i,                    // 模板文件
  /\.env\.template$/i,
  /\.env\.sample$/i,
];

// ── Block 级：高置信度敏感文件 ──
const BLOCK_PATTERNS = [
  // 环境变量文件（排除 .example/.template/.sample）
  [/(?:^|\/)\.env(?:\.[^.]+)?$/i,       ".env 文件通常包含数据库密码、API 密钥等敏感信息"],
  // 私钥和证书
  [/\.pem$/i,                            ".pem 文件可能包含私钥或证书"],
  [/\.key$/i,                            ".key 文件可能包含私钥"],
  [/\.p12$/i,                            ".p12 文件包含证书和私钥"],
  [/\.pfx$/i,                            ".pfx 文件包含证书和私钥"],
  [/\.jks$/i,                            ".jks Java KeyStore 文件包含密钥"],
  [/\.keystore$/i,                       ".keystore 文件包含密钥"],
  // SSH 密钥
  [/\bid_(?:rsa|ed25519|ecdsa|dsa)$/i,  "SSH 私钥文件"],
  [/(?:^|\/)\.ssh\/.*$/,                 ".ssh/ 目录下的文件可能包含私钥或配置"],
  // 常见凭据文件名
  [/(?:^|\/)credentials\.json$/i,        "credentials.json 通常包含服务账号凭据"],
  [/(?:^|\/)service[-_]?account[-_]?key/i, "服务账号密钥文件"],
  [/(?:^|\/)gcloud\/.*credentials/i,     "GCloud 凭据文件"],
  [/(?:^|\/)\.aws\/credentials$/i,       "AWS 凭据文件"],
  [/(?:^|\/)\.docker\/config\.json$/i,   "Docker 配置可能包含 registry 认证信息"],
  [/(?:^|\/)\.npmrc$/i,                  ".npmrc 可能包含 npm registry token"],
  [/(?:^|\/)\.pypirc$/i,                 ".pypirc 可能包含 PyPI 上传 token"],
  [/(?:^|\/)\.netrc$/i,                  ".netrc 包含明文登录凭据"],
  [/(?:^|\/)\.git-credentials$/i,        ".git-credentials 包含明文 Git 凭据"],
  [/(?:^|\/)htpasswd$/i,                 "htpasswd 包含 HTTP 认证凭据"],
];

// ── Report 级：中置信度（文件名含敏感关键词）──
const REPORT_PATTERNS = [
  [/secret/i,                            "文件名包含 'secret'，请确认不含敏感数据"],
  [/credential/i,                        "文件名包含 'credential'，请确认不含敏感数据"],
  [/(?:^|[/_.-])token(?:[/_.-]|$)/i,    "文件名包含 'token'，请确认不含敏感数据"],
  [/(?:^|[/_.-])passwd(?:[/_.-]|$)/i,   "文件名包含 'passwd'，请确认不含敏感数据"],
  [/(?:^|[/_.-])password(?:[/_.-]|$)/i, "文件名包含 'password'，请确认不含敏感数据"],
  [/(?:^|[/_.-])apikey(?:[/_.-]|$)/i,   "文件名包含 'apikey'，请确认不含敏感数据"],
  [/(?:^|[/_.-])api[-_]?key(?:[/_.-]|$)/i, "文件名包含 'api_key'，请确认不含敏感数据"],
];

function isWhitelisted(filePath) {
  return WHITELIST.some((pattern) => pattern.test(filePath));
}

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath) return null;

  const normalized = normalize(filePath).replaceAll("\\", "/");

  // 白名单路径直接放行
  if (isWhitelisted(normalized)) return null;

  // .env 文件特殊处理：排除 .env.example / .env.template / .env.sample
  // （已在白名单中处理，这里做双重保险）
  const name = basename(normalized);

  // Block 级检查
  for (const [pattern, reason] of BLOCK_PATTERNS) {
    if (pattern.test(normalized)) {
      // .env.example 等模板文件放行（双重保险）
      if (/\.env\./i.test(name) && /(?:example|template|sample|dist)$/i.test(name)) {
        return null;
      }
      return {
        decision: "block",
        reason: [
          "[Secret Write Guard] 已拦截向敏感文件的写入操作",
          "",
          `文件：${filePath}`,
          `原因：${reason}`,
          "",
          "如确需写入：",
          "  1. 请先确认该文件不会被提交到版本控制（检查 .gitignore）",
          "  2. 得到用户明确授权后再执行",
        ].join("\n"),
      };
    }
  }

  // Report 级检查（仅对文件名做匹配，减少路径中间段误触）
  for (const [pattern, reason] of REPORT_PATTERNS) {
    if (pattern.test(name)) {
      return {
        decision: "report",
        reason: `[Secret Write Notice] ${reason}\n文件：${filePath}`,
      };
    }
  }

  return null;
}
