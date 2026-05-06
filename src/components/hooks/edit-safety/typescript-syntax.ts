import { defineHook, HookEvent, KnownTool, Platform, type LegacyHookPayload } from "../../sdk";

import { existsSync, readFileSync } from "fs";
import { createRequire } from "module";
import { dirname, extname, resolve } from "path";
import { matchExt } from "../_shared/hook-edit-write-utils";
import { getErrorCode, getErrorMessage } from "../_shared/error-utils";

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

function matches(filePath: string) {
  return matchExt(filePath, [".ts", ".tsx", ".mts", ".cts"]);
}

type TransformSyncLoader = "ts" | "tsx";
type TransformSyncOptions = {
  loader: TransformSyncLoader;
  target: string;
  sourcemap: boolean;
};
type TransformSyncFn = (code: string, options: TransformSyncOptions) => void;

function getTransformSync(mod: unknown): TransformSyncFn | null {
  if (typeof mod !== "object" || mod === null) return null;
  const candidate = (mod as { transformSync?: unknown }).transformSync;
  return typeof candidate === "function" ? (candidate as TransformSyncFn) : null;
}

type EsbuildErrorItem = {
  text?: unknown;
  location?: { line?: unknown } | null;
};

function formatEsbuildErrors(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  const entries = (error as { errors?: unknown }).errors;
  if (!Array.isArray(entries)) return null;

  const lines = entries
    .map((entry) => {
      if (typeof entry !== "object" || entry === null) return null;
      const item = entry as EsbuildErrorItem;
      const text = typeof item.text === "string" ? item.text : "";
      if (!text) return null;
      const lineNumber = typeof item.location?.line === "number" ? item.location.line : "?";
      return `行 ${lineNumber}: ${text}`;
    })
    .filter((line): line is string => Boolean(line));

  return lines.length > 0 ? lines.join("\n") : null;
}

async function check(filePath: string) {
  let transformSync: TransformSyncFn | null = null;
  try {
    const searchRoots = [...new Set([
      resolve(process.cwd()),
      resolve(dirname(filePath)),
    ])];

    let lastError: unknown = null;

    for (const root of searchRoots) {
      try {
        const loadedModule = createRequire(resolve(root, "__hook__.cjs"))("esbuild");
        const resolvedTransform = getTransformSync(loadedModule);
        if (!resolvedTransform) {
          lastError = new Error("esbuild.transformSync 不可用");
          continue;
        }
        transformSync = resolvedTransform;
        break;
      } catch (error: unknown) {
        if (getErrorCode(error) !== "MODULE_NOT_FOUND") {
          lastError = error;
        }
      }
    }

    if (!transformSync) {
      if (lastError) {
        return {
          lang: "TypeScript Syntax",
          message: `加载 esbuild 失败：${getErrorMessage(lastError)}`,
          decision: "report",
        };
      }

      return null;
    }
  } catch (error: unknown) {
    return {
      lang: "TypeScript Syntax",
      message: `加载 esbuild 失败：${getErrorMessage(error)}`,
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
  } catch (err: unknown) {
    const msg = formatEsbuildErrors(err) ?? getErrorMessage(err);
    return {
      lang: "TypeScript Syntax",
      message: msg,
      decision: "block",
    };
  }
}

export async function run(payload: LegacyHookPayload) {
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
