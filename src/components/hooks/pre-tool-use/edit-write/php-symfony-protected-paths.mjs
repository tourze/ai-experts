/**
 * 保护路径 hook（PreToolUse — Edit|Write）
 * ── Symfony hooks 专用版本 ──
 *
 * 从中央 hooks/pre-tool-use/edit-write/protected-paths.mjs 提取，
 * PROTECTED_PATTERNS 仅保留 Symfony 项目相关的保护规则。
 *
 * 在 Edit/Write 执行前检查目标路径，阻止修改 Symfony 自动生成的文件和目录。
 * 规则在 PROTECTED_PATTERNS 中集中管理，新增保护路径只需加一行。
 */
import { normalize } from "node:path";

// ── Symfony 专用保护规则：[正则, 描述] ──
const PROTECTED_PATTERNS = [
  [/\/symfony\.lock$/, "symfony.lock 由 Symfony Flex 自动生成，不应手动编辑"],
  [/\/var\/cache\//, "var/cache/ 是 Symfony 运行时缓存，自动生成"],
  [/\/var\/log\//, "var/log/ 是日志目录，不应手动编辑"],
  [/\/public\/build\//, "public/build/ 是 Webpack Encore 编译产物，应通过 npm run build 生成"],
  [/\/public\/bundles\//, "public/bundles/ 由 assets:install 命令生成，不应手动修改"],
  [/\/migrations\/Version\d+\.php$/, "已存在的迁移文件不可修改，只能新建迁移"],
];

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath) return null;

  const normalized = normalize(filePath).replaceAll("\\", "/");

  for (const [pattern, reason] of PROTECTED_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        decision: "block",
        reason: `[Protected Path] 禁止修改 ${filePath}\n原因：${reason}\n\n如需修改第三方依赖，请通过包管理器（composer/npm）或 patch 文件处理。`,
      };
    }
  }
  return null;
}
