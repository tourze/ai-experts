import { defineHook, HookEvent, KnownTool, Platform } from "../../../sdk";

import { existsSync, readFileSync } from "fs";
import { createRequire } from "module";
import { dirname, extname, resolve } from "path";
import { matchExt } from "./typescript-_utils.mjs";

export const typescriptSyntaxHook = defineHook({
  id: "typescript-syntax",
  description: "用 esbuild 检查 TypeScript 文件语法错误。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.PostToolUse,
  matcher: [KnownTool.Edit, KnownTool.Write, KnownTool.MultiEdit, KnownTool.ApplyPatch],
  entry: new URL("./typescript-syntax.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});

/**
 * TypeScript 语法检查器
 *
 * 策略：
 * 1. 优先用 esbuild transformSync（极快，纯解析不执行）
 * 2. 先从当前工作目录解析 esbuild；找不到时，再从目标文件目录向上解析
 * 3. esbuild 完全不可用时静默跳过（不阻塞工作流）
 *
 * 这样可以同时兼容普通项目与 monorepo。
 */

function matches(filePath) {
  return matchExt(filePath, [".ts", ".tsx", ".mts", ".cts"]);
}

async function check(filePath) {
  let transformSync;
  try {
    const searchRoots = [...new Set([
      resolve(process.cwd()),
      resolve(dirname(filePath)),
    ])];

    let esbuild = null;
    let lastError = null;

    for (const root of searchRoots) {
      try {
        esbuild = createRequire(resolve(root, "__hook__.cjs"))("esbuild");
        break;
      } catch (error) {
        if (error?.code !== "MODULE_NOT_FOUND") {
          lastError = error;
        }
      }
    }

    if (!esbuild) {
      if (lastError) {
        return {
          lang: "TypeScript Syntax",
          message: `加载 esbuild 失败：${lastError.message || lastError}`,
          decision: "report",
        };
      }

      return null;
    }

    transformSync = esbuild.transformSync;
  } catch (error) {
    return {
      lang: "TypeScript Syntax",
      message: `加载 esbuild 失败：${error.message || error}`,
      decision: "report",
    };
  }

  const ext = extname(filePath).slice(1);
  const loader = ext === "tsx" ? "tsx" : "ts";

  try {
    const code = readFileSync(filePath, "utf-8");
    transformSync(code, {
      loader,
      target: "esnext",
      sourcemap: false,
    });
    return null;
  } catch (err) {
    const msg = err?.errors
      ? err.errors.map((e) => `行 ${e.location?.line}: ${e.text}`).join("\n")
      : err?.message || String(err);
    return {
      lang: "TypeScript Syntax",
      message: msg,
      decision: "block",
    };
  }
}

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;
  if (!matches(filePath)) return null;
  const result = await check(filePath);
  if (!result) return null;
  return {
    decision: result.decision,
    reason: result.decision === "block"
      ? `[${result.lang}] ${result.message.trim()}\n\n请修复后再继续。`
      : `[${result.lang}] ${result.message.trim()}\n\nHook 已降级为提醒，请检查本地 esbuild 安装与解析路径。`,
  };
}
