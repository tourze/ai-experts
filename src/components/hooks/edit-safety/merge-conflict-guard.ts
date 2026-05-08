import { defineHook, HookEvent, KnownTool, Platform, type NormalizedHookPayload } from "../../sdk";

import { existsSync, readFileSync } from "fs";
import { extname, resolve } from "path";

export const mergeConflictGuardHook = defineHook({
  id: "merge-conflict-guard",
  description: "检测文件中残留的合并冲突标记。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./merge-conflict-guard.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
});

/**
 * 合并冲突标记拦截 hook（PostToolUse — Edit|Write）
 *
 * 检测文件中残留的 <<<<<<< / ======= / >>>>>>> 冲突标记，
 * 阻止带冲突标记的代码继续流转。
 */


// 仅对文本类代码/配置文件检查，跳过二进制和数据文件
const SKIP_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".webp", ".svg",
  ".mp3", ".mp4", ".wav", ".avi", ".mov",
  ".zip", ".tar", ".gz", ".bz2", ".7z", ".rar",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".so", ".dylib", ".dll", ".exe", ".bin",
  ".sqlite", ".db",
]);

export async function run(payload: NormalizedHookPayload) {
  const fileTargets = [
    payload?.tool?.input?.file_path,
    ...(payload?.tool?.fileTargets ?? []),
  ].filter((target): target is string => typeof target === "string" && target.length > 0);
  const uniqueTargets = [...new Set(fileTargets)];
  if (uniqueTargets.length === 0) return null;

  const markers: Array<{ file: string; line: number; type: string }> = [];

  for (const filePath of uniqueTargets) {
    const resolvedPath = resolve(payload.cwd, filePath);
    if (!existsSync(resolvedPath)) continue;

    // 跳过二进制文件
    const ext = extname(resolvedPath).toLowerCase();
    if (SKIP_EXTENSIONS.has(ext)) continue;

    const content = readFileSync(resolvedPath, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^<{7}\s/.test(line)) {
        markers.push({ file: filePath, line: i + 1, type: "<<<<<<< (冲突开始)" });
      } else if (/^={7}$/.test(line)) {
        markers.push({ file: filePath, line: i + 1, type: "======= (冲突分隔)" });
      } else if (/^>{7}\s/.test(line)) {
        markers.push({ file: filePath, line: i + 1, type: ">>>>>>> (冲突结束)" });
      }
    }
  }

  if (markers.length > 0) {
    const detail = markers
      .map((m) => `  ${m.file}:${m.line}: ${m.type}`)
      .join("\n");

    return {
      decision: "block",
      reason: [
        `[Merge Conflict] 检测到 ${markers.length} 处合并冲突标记：`,
        "",
        detail,
        "",
        "请解决所有冲突标记后再继续。",
      ].join("\n"),
    };
  }
  return null;
}
