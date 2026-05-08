import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  HookEvent,
  Platform,
  type NormalizedHookPayload,
} from "../../src/components/sdk";
import { run as runDangerousCommandGuard } from "../../src/components/hooks/command-safety/dangerous-command-guard";
import { run as runGitDestructiveGuard } from "../../src/components/hooks/command-safety/git-destructive-command-guard";
import { run as runCatWriteGuard } from "../../src/components/hooks/command-safety/cat-write-guard";
import { run as runSyntaxJson } from "../../src/components/hooks/edit-safety/syntax-json";
import { run as runGeneratedDistGuard } from "../../src/components/hooks/edit-safety/generated-dist-guard";
import { run as runMergeConflictGuard } from "../../src/components/hooks/edit-safety/merge-conflict-guard";
import { run as runJavascriptEnvDetector } from "../../src/components/hooks/session-bootstrap/javascript-env-detector";
import { run as runComponentRoutingReminder } from "../../src/components/hooks/skill-routing/component-routing-reminder";

const tempDirs: string[] = [];

function createTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop() as string, { recursive: true, force: true });
  }
});

function makeHookPayload(
  event: HookEvent,
  overrides: Partial<NormalizedHookPayload> = {},
): NormalizedHookPayload {
  return {
    platform: Platform.Codex,
    event,
    cwd: process.cwd(),
    raw: {},
    tool: { input: {} },
    ...overrides,
  };
}

function makeNormalizedPayload(
  event: HookEvent,
  overrides: Partial<NormalizedHookPayload> = {},
): NormalizedHookPayload {
  return {
    platform: Platform.Codex,
    event,
    cwd: process.cwd(),
    raw: {},
    ...overrides,
  };
}

describe("hooks implementation coverage", () => {
  test("dangerous-command-guard blocks destructive rm command", async () => {
    const result = await runDangerousCommandGuard(
      makeHookPayload(HookEvent.PreToolUse, {
        tool: { input: { command: "rm -rf /" } },
      }),
    );

    expect(result?.decision).toBe("block");
    expect(result?.reason).toContain("[Dangerous Command]");
    expect(result?.reason).toContain("rm -r /");
  });

  test("dangerous-command-guard ignores safe command", async () => {
    const result = await runDangerousCommandGuard(
      makeHookPayload(HookEvent.PreToolUse, {
        tool: { input: { command: "ls -la" } },
      }),
    );
    expect(result).toBeNull();
  });

  test("git-destructive-command-guard blocks reset --hard and allows --force-with-lease", async () => {
    const blocked = await runGitDestructiveGuard(
      makeHookPayload(HookEvent.PreToolUse, {
        tool: { input: { command: "git reset --hard HEAD" } },
      }),
    );
    expect(blocked?.decision).toBe("block");
    expect(blocked?.reason).toContain("[Dangerous Git Command]");

    const allowed = await runGitDestructiveGuard(
      makeHookPayload(HookEvent.PreToolUse, {
        tool: { input: { command: "git push --force-with-lease origin main" } },
      }),
    );
    expect(allowed).toBeNull();
  });

  test("cat-write-guard reports tmp heredoc write and blocks normal heredoc write", async () => {
    const reported = await runCatWriteGuard(
      makeHookPayload(HookEvent.PreToolUse, {
        tool: { input: { command: "cat > /tmp/demo.txt <<'EOF'\nhello\nEOF" } },
      }),
    );
    expect(reported?.decision).toBe("report");
    expect(reported?.reason).toContain("/tmp");

    const blocked = await runCatWriteGuard(
      makeHookPayload(HookEvent.PreToolUse, {
        tool: { input: { command: "cat > src/demo.ts <<'EOF'\nconsole.log(1)\nEOF" } },
      }),
    );
    expect(blocked?.decision).toBe("block");
    expect(blocked?.reason).toContain("已拦截 cat heredoc 写文件");

    const piped = await runCatWriteGuard(
      makeHookPayload(HookEvent.PreToolUse, {
        tool: { input: { command: "cat <<'EOF' | sed 's/a/b/'\nhello\nEOF" } },
      }),
    );
    expect(piped).toBeNull();
  });

  test("syntax-json blocks invalid json and skips non-json path", async () => {
    const dir = createTempDir("ai-experts-hook-json-");
    const invalidJson = join(dir, "broken.json");
    const textFile = join(dir, "note.txt");
    writeFileSync(invalidJson, "{\"a\": }", "utf-8");
    writeFileSync(textFile, "plain text", "utf-8");

    const blocked = await runSyntaxJson(
      makeHookPayload(HookEvent.PreToolUse, {
        tool: { input: { file_path: invalidJson } },
      }),
    );
    expect(blocked?.decision).toBe("block");
    expect(blocked?.reason).toContain("[JSON Syntax]");

    const skipped = await runSyntaxJson(
      makeHookPayload(HookEvent.PreToolUse, {
        tool: { input: { file_path: textFile } },
      }),
    );
    expect(skipped).toBeNull();
  });

  test("generated-dist-guard reports dist edits and ignores non-dist files", async () => {
    const reported = await runGeneratedDistGuard(
      makeNormalizedPayload(HookEvent.PostToolUse, {
        tool: { fileTargets: ["dist/claude/CLAUDE.md"] },
      }),
    );
    expect(reported?.kind).toBe("report");
    expect((reported as { message?: string }).message).toContain("Generated dist output");

    const skipped = await runGeneratedDistGuard(
      makeNormalizedPayload(HookEvent.PostToolUse, {
        tool: { fileTargets: ["src/components/hooks/index.ts"] },
      }),
    );
    expect(skipped).toBeNull();
  });

  test("merge-conflict-guard checks dispatcher file targets from apply_patch", async () => {
    const root = createTempDir("ai-experts-hook-conflict-");
    const cleanFile = join(root, "clean.ts");
    const conflictedFile = join(root, "conflicted.ts");
    writeFileSync(cleanFile, "const value = 1;\n", "utf-8");
    writeFileSync(
      conflictedFile,
      [
        "<<<<<<< HEAD",
        "const value = 1;",
        "=======",
        "const value = 2;",
        ">>>>>>> branch",
        "",
      ].join("\n"),
      "utf-8",
    );

    const blocked = await runMergeConflictGuard(
      makeNormalizedPayload(HookEvent.PostToolUse, {
        cwd: root,
        tool: {
          input: {},
          fileTargets: ["clean.ts", "conflicted.ts"],
        },
      }),
    );
    expect(blocked?.decision).toBe("block");
    expect(blocked?.reason).toContain("conflicted.ts:1");
    expect(blocked?.reason).toContain("conflicted.ts:3");
    expect(blocked?.reason).toContain("conflicted.ts:5");

    const skipped = await runMergeConflictGuard(
      makeNormalizedPayload(HookEvent.PostToolUse, {
        cwd: root,
        tool: {
          input: {},
          fileTargets: ["clean.ts"],
        },
      }),
    );
    expect(skipped).toBeNull();
  });

  test("javascript-env-detector emits context for detected project facts", async () => {
    const root = createTempDir("ai-experts-hook-js-env-");
    const projectRoot = join(root, "project");
    const srcDir = join(projectRoot, "src");
    mkdirSync(srcDir, { recursive: true });

    writeFileSync(
      join(projectRoot, "package.json"),
      JSON.stringify({
        name: "demo-app",
        packageManager: "pnpm@9.1.0",
        type: "module",
        dependencies: { react: "18.2.0" },
      }),
      "utf-8",
    );
    writeFileSync(join(projectRoot, ".node-version"), "20.11.0\n", "utf-8");

    const result = await runJavascriptEnvDetector(
      makeHookPayload(HookEvent.SessionStart, { cwd: srcDir }),
    );
    expect(result?.decision).toBe("context");
    expect(result?.reason).toContain("[JS Env]");
    expect(result?.reason).toContain("项目名: demo-app");
    expect(result?.reason).toContain("Node 版本: 20.11.0");
    expect(result?.reason).toContain("包管理器: pnpm@9.1.0");
    expect(result?.reason).toContain("框架: React 18.2.0");
  });

  test("component-routing-reminder injects context only for component-related prompts", async () => {
    const matched = await runComponentRoutingReminder(
      makeNormalizedPayload(HookEvent.UserPromptSubmit, {
        prompt: "请检查 dist/claude 和 hooks 的组织方式",
      }),
    );
    expect(matched?.kind).toBe("add-context");
    expect((matched as { message?: string }).message).toContain("source of truth");

    const skipped = await runComponentRoutingReminder(
      makeNormalizedPayload(HookEvent.UserPromptSubmit, {
        prompt: "帮我总结这段普通文案",
      }),
    );
    expect(skipped).toBeNull();
  });
});
