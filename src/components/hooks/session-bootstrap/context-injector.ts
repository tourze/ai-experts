import { defineHook, HookEvent, KnownTool, Platform, type NormalizedHookPayload } from "../../sdk";

import { execFileSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

export const contextInjectorHook = defineHook({
  id: "context-injector",
  description: "注入 Git 状态、脏文件摘要与记忆文件存在性等起手上下文。",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.SessionStart,
  entry: new URL("./context-injector.ts", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
});

/**
 * context-injector (SessionStart) — 注入仓库起手上下文
 *
 * 行为:
 *   会话启动时(startup / resume / clear / compact)读取 cwd 的 git 状态 +
 *   本地记忆文件存在性,通过 additionalContext 一次性注入 Claude,
 *   省去每次起手重复执行 `git status` / `ls <记忆文件>` 的探测成本。
 *
 * 为什么要这么做:
 *   AI 编码会话审计显示 `git status` 近半年出现 271 次,几乎每次会话起手都
 *   要探测一遍仓库状态;会话里的第一个 Grep 也几乎总是搜项目根的记忆文件。
 *   把这些「必跑的第一枪」前置到 SessionStart hook
 *   里一次性注入,减少重复工具调用,也给并行进程场景提供「动手前必须先看
 *   脏文件数」的提醒(对齐记忆文件中的「并行进程协作约束」)。
 *
 * 与其他 hook 的关系:
 *   • 与 prompt-guidance/* 是正交维度:本 hook 在会话启动时触发一次,
 *     prompt-submit hooks 在每次 prompt 时触发。两者注入到不同的 context 段。
 *   • 与 command-safety/* 是正交维度:那些 hook 在执行命令前拦截,本 hook
 *     在命令执行前就把状态告诉 Claude,减少不必要的探测命令。
 *
 * 非目标:
 *   - 不 block(SessionStart 没有 block 概念,只能注入 context)
 *   - 不执行任何写入操作
 *   - 不依赖任何项目特定约定;非 git 仓库 / cwd 缺失直接放行
 *   - 不解析记忆文件内容,只报告存在性,让 Claude 自己读
 *   - 不打印 git diff 全文(可能很长),只给文件级摘要
 *
 * 失败策略:
 *   - 任何一步出错 → return null(fail-open)
 *   - 宁可漏注入,也不要让 SessionStart 阻塞会话启动
 *   - git 命令统一短超时 + stderr 静默,避免在异常仓库下卡住
 *
 * 幂等性:
 *   - SessionStart 一次会话只触发一次,不会累积污染
 *   - 即使是 source === "resume",再注入一份当前仓库状态也有价值
 *     (resume 时 git 状态可能已变)
 */


// 短超时:本 hook 在 SessionStart 路径上,绝不能拖慢启动。
const EXEC_TIMEOUT_MS = 2000;

// 脏文件预览上限:超过则截断,避免 context 被一份巨大的 git status 淹没。
const DIRTY_PREVIEW_LIMIT = 10;

// 本地记忆文件清单。这些文件存在时只报告存在性,不读内容。
const MEMORY_FILES = ["MEMORY.md", "CLAUDE.md", "AGENTS.md"];

/**
 * 安全执行 git 命令。任何异常(非 git 仓库 / 权限问题 / 超时)统一返回空串。
 * 不抛异常,因为 SessionStart 必须 fail-open。
 */
function safeGit(args: readonly string[], cwd: string): string {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: EXEC_TIMEOUT_MS,
    }).trim();
  } catch {
    return "";
  }
}

function findRepoRoot(cwd: string): string {
  return safeGit(["rev-parse", "--show-toplevel"], cwd);
}

export async function run(payload: NormalizedHookPayload) {
  const cwd = payload?.cwd;
  if (typeof cwd !== "string" || !cwd) return null;

  const repoRoot = findRepoRoot(cwd);
  if (!repoRoot) return null;

  const branch = safeGit(["branch", "--show-current"], cwd) || "(detached)";
  const status = safeGit(["status", "--short"], cwd);
  const lastCommit = safeGit(["log", "-1", "--format=%h %s"], cwd);

  const dirtyLines = status ? status.split("\n").filter(Boolean) : [];
  const dirty = dirtyLines.length;

  const memoryFiles = MEMORY_FILES.filter((f) => existsSync(join(repoRoot, f)));
  const hasCursorRules = existsSync(join(repoRoot, ".cursorrules"));

  const lines = [
    "<SUBAGENT-STOP>",
    "如果你是被派遣执行特定任务的 subagent，跳过本段上下文，直接执行你的任务。",
    "</SUBAGENT-STOP>",
    "",
    "[Session Context] 起手上下文",
    "",
    "本段由 hooks/session-bootstrap/context-injector.ts 在 SessionStart 时一次性",
    "注入,代替每次会话起手重复执行 `git status` / `ls <记忆文件>` 的探测。",
    "",
    `  cwd:       ${cwd}`,
    `  仓库根:    ${repoRoot}`,
    `  分支:      ${branch}`,
    `  脏文件数:  ${dirty}`,
    `  最近提交:  ${lastCommit || "(none)"}`,
    `  记忆文件:  ${memoryFiles.length > 0 ? `已发现 ${memoryFiles.length} 个` : "(无)"}`,
    `  本地规则:  ${hasCursorRules ? "已发现 .cursorrules" : "(无)"}`,
  ];

  // 记忆文件缺失时注入建议 — 审计显示缺少记忆文件的项目每次会话需重复
  // 说明项目背景,创建后可一劳永逸。
  if (memoryFiles.length === 0) {
    lines.push(
      "",
      "  💡 当前项目缺少记忆文件。建议在合适时机提醒用户创建,内容应包含:",
      "     项目概述、技术栈、常用命令、Git 工作流、项目特定约束。",
      "     这能让后续会话自动获得项目上下文,避免重复说明。",
    );
  }

  if (dirty > 0) {
    const preview = dirtyLines
      .slice(0, DIRTY_PREVIEW_LIMIT)
      .map((l) => `    ${l}`);

    lines.push(
      "",
      "  ⚠ 工作区有未提交改动。按记忆文件中的「并行进程协作约束」,",
      "    动手前必须先 `git diff` 确认这些改动是否为并行进程或其他任务产出,",
      "    禁止覆盖、回退、重排他人工作;无关 hunk 必须移出本次提交范围。",
      "",
      "  改动预览:",
      ...preview,
    );

    if (dirtyLines.length > DIRTY_PREVIEW_LIMIT) {
      const remaining = dirtyLines.length - DIRTY_PREVIEW_LIMIT;
      lines.push(`    ...(还有 ${remaining} 行,自行 git status 查看)`);
    }
  }

  return {
    decision: "context",
    reason: lines.join("\n"),
  };
}
