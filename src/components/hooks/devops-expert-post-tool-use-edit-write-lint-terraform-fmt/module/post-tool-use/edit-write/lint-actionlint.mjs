/**
 * actionlint — GitHub Actions workflow 静态检查
 *
 * - 匹配 .github/workflows/ 下的 *.yml / *.yaml
 * - 调用 actionlint 检查表达式、matrix、shell、reusable workflow 等
 * - report 模式：输出警告但不 block（首个 lint hook 落地采用保守策略，
 *   观察误报率后再考虑收紧为 block）
 * - actionlint 未安装时静默跳过，保持降级友好
 * - 项目可通过 .github/actionlint.yaml 自定义规则，actionlint 自行发现
 */
import { existsSync } from "fs";
import { execFileSync } from "child_process";
import { hasCommand, cmd, matchExt, pathContains } from "./_utils.mjs";

function matches(filePath) {
  return (
    pathContains(filePath, ".github/workflows") &&
    matchExt(filePath, [".yml", ".yaml"])
  );
}

function runActionlint(filePath) {
  if (!hasCommand("actionlint")) return null;
  try {
    execFileSync(cmd("actionlint"), ["-no-color", filePath], {
      stdio: "pipe",
      timeout: 15000,
    });
    return null;
  } catch (err) {
    const output =
      (err.stdout?.toString() || "") + (err.stderr?.toString() || "");
    return output.trim() || null;
  }
}

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;
  if (!matches(filePath)) return null;

  const output = runActionlint(filePath);
  if (!output) return null;

  return {
    decision: "report",
    reason: `[actionlint] ${output}`,
  };
}
