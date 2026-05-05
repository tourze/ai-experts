import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

import { normalize } from "path";

export const phpProtectedPathsHook = defineHook({
  id: "php-protected-paths",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PreToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./php-protected-paths.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * 保护路径 hook（PreToolUse — Edit|Write）
 * PHP hook extracted PHP/Composer 专用版本。
 *
 * 在 Edit/Write 执行前检查目标路径，阻止修改 Composer 第三方依赖和自动生成产物。
 * 规则在 PROTECTED_PATTERNS 中集中管理，新增保护路径只需加一行。
 */

// ── 保护规则（仅 PHP/Composer 相关）：[正则, 描述] ──
const PROTECTED_PATTERNS = [
  [/\/vendor\/[^/]+\/[^/]+\//, "vendor/ 下的第三方 Composer 包不应手动修改"],
  [/\/vendor\/autoload\.php$/, "vendor/autoload.php 由 Composer 自动生成，不应手动修改"],
  [/\/vendor\/composer\//, "vendor/composer/ 由 Composer 自动生成，不应手动修改"],
  [/\/composer\.lock$/, "composer.lock 应通过 composer update 修改，不应手动编辑"],
  [/\/\.phpunit\.result\.cache$/, ".phpunit.result.cache 是测试缓存，自动生成"],
];

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath) return null;

  const normalized = normalize(filePath).replaceAll("\\", "/");

  for (const [pattern, reason] of PROTECTED_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        decision: "block",
        reason: `[Protected Path] 禁止修改 ${filePath}\n原因：${reason}\n\n如需修改第三方依赖，请通过包管理器（composer）或 patch 文件处理。`,
      };
    }
  }
  return null;
}
