import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

import { existsSync } from "fs";
import { execFileSync } from "child_process";
import { hasCommand, cmd, matchExt } from "../../_shared/hook-edit-write-utils";

export const devopsLintTerraformFmtHook = defineHook({
  id: "devops-lint-terraform-fmt",
  description: "用 terraform fmt 检查 HCL 格式规范。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./devops-lint-terraform-fmt.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * terraform fmt — Terraform 格式检查
 *
 * - 匹配 *.tf / *.tfvars
 * - 调用 terraform fmt -check -diff 检查是否符合 HCL canonical style
 * - report 模式：输出 diff 但不 block，与 lint-actionlint 策略一致
 * - terraform CLI 未安装时静默跳过
 *
 * 未来如需添加其他 Terraform 检查（tflint、硬编码凭据扫描、provider
 * 版本约束等），应作为新的 checkX() 函数加入本文件，在 run() 中按
 * 优先级顺序调用，保持 lint-shellcheck 式的单文件多检查结构，避免
 * 再次出现 lint-hadolint 那种跨文件拆分的过度设计。
 */

function matches(filePath) {
  return matchExt(filePath, [".tf", ".tfvars"]);
}

function runTerraformFmt(filePath) {
  if (!hasCommand("terraform")) return null;
  try {
    execFileSync(cmd("terraform"), ["fmt", "-check", "-diff", filePath], {
      stdio: "pipe",
      timeout: 15000,
    });
    return null;
  } catch (err) {
    // terraform fmt -check 非零退出：exit 3 表示需格式化、exit 2 表示错误
    const output =
      (err.stdout?.toString() || "") + (err.stderr?.toString() || "");
    return output.trim() || null;
  }
}

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;
  if (!matches(filePath)) return null;

  // terraform fmt 格式检查（report 级别）
  const fmtOutput = runTerraformFmt(filePath);
  if (fmtOutput) {
    return {
      decision: "report",
      reason: `[terraform fmt] ${fmtOutput}`,
    };
  }

  return null;
}
