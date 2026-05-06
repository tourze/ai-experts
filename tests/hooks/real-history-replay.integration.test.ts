import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { afterAll, beforeAll, describe, test } from "vitest";
import { Platform } from "../../src/build/core.ts";
import { compileHookModules } from "../../src/build/hooks.ts";
import { componentHooks } from "../../src/components/hooks/index.ts";
import { repoRoot } from "../components/test-helpers";

type JsonRecord = Record<string, unknown>;
type FixturePrompt = {
  ts: number | null;
  prompt: string;
  sessionHash?: string | null;
  sourceFileHash?: string | null;
};
type FixtureTelemetry = {
  ts: number | null;
  event: string | null;
  decision: string | null;
  hook: string | null;
  tool: string | null;
  file: string | null;
  detail: string | null;
  pluginHash: string | null;
  durationMs: number | null;
};
type RealHistoryFixture = {
  schema: string;
  generatedAt: string;
  source: Record<string, string>;
  redaction: { notes: string[] };
  samples: {
    claudeHistory: FixturePrompt[];
    codexHistory: FixturePrompt[];
    codexSessionPrompts: FixturePrompt[];
    claudeHookTelemetry: FixtureTelemetry[];
  };
};

type ReplayCase = {
  platform: Platform;
  event: "UserPromptSubmit" | "PreToolUse" | "PostToolUse" | "SessionStart";
  input: JsonRecord;
};

const fixturePath = join(repoRoot, "tests/fixtures/real-history/sanitized-session-fixture.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf-8")) as RealHistoryFixture;

let tmpRoot = "";
let claudeHooksRoot = "";
let codexHooksRoot = "";
let sampleJsonPath = "";
let sampleMdPath = "";
let sampleTsPath = "";
let sampleEnvPath = "";

function pickSampleFilePath(sourcePath: unknown): string {
  if (typeof sourcePath !== "string") {
    return sampleTsPath;
  }
  const ext = extname(sourcePath).toLowerCase();
  if (ext === ".json") return sampleJsonPath;
  if (ext === ".md") return sampleMdPath;
  if (ext === ".env") return sampleEnvPath;
  return sampleTsPath;
}

function mapTelemetryEvent(value: unknown): ReplayCase["event"] | null {
  if (typeof value !== "string") return null;
  if (value.startsWith("user-prompt-submit")) return "UserPromptSubmit";
  if (value.startsWith("session-start")) return "SessionStart";
  if (value.startsWith("pre-tool-use")) return "PreToolUse";
  if (value.startsWith("post-tool-use")) return "PostToolUse";
  return null;
}

function mapTelemetryToReplayCases(entries: readonly FixtureTelemetry[]): ReplayCase[] {
  const cases: ReplayCase[] = [];

  for (const entry of entries) {
    const mappedEvent = mapTelemetryEvent(entry.event);
    if (!mappedEvent) continue;

    if (mappedEvent === "UserPromptSubmit") {
      const prompt = typeof entry.detail === "string" && entry.detail.trim() !== ""
        ? entry.detail
        : "请验证 hooks 行为";
      cases.push({
        platform: Platform.Claude,
        event: "UserPromptSubmit",
        input: {
          cwd: repoRoot,
          prompt,
        },
      });
      continue;
    }

    if (mappedEvent === "SessionStart") {
      cases.push({
        platform: Platform.Claude,
        event: "SessionStart",
        input: {
          cwd: repoRoot,
          prompt: "session bootstrap",
        },
      });
      continue;
    }

    if (mappedEvent === "PreToolUse") {
      const fromDangerousDetail = typeof entry.detail === "string" && /dangerous|block|reset|rm|force/i.test(entry.detail);
      cases.push({
        platform: Platform.Claude,
        event: "PreToolUse",
        input: {
          cwd: repoRoot,
          tool_name: "Bash",
          tool_input: {
            command: fromDangerousDetail ? "git reset --hard HEAD" : "echo hook-replay",
          },
        },
      });
      continue;
    }

    if (mappedEvent === "PostToolUse") {
      const toolName = entry.tool === "Write" ? "Write" : "apply_patch";
      const filePath = pickSampleFilePath(entry.file);
      const toolInput: JsonRecord = {
        file_path: filePath,
      };
      if (toolName === "apply_patch") {
        toolInput.command = `*** Update File: ${filePath}\n@@\n-const x = 1;\n+const x = 2;\n`;
      }
      cases.push({
        platform: Platform.Claude,
        event: "PostToolUse",
        input: {
          cwd: repoRoot,
          tool_name: toolName,
          tool_input: toolInput,
        },
      });
    }
  }

  return cases;
}

function runDispatch(hooksRoot: string, platform: Platform, event: ReplayCase["event"], input: JsonRecord): string {
  return execFileSync(
    process.execPath,
    [join(hooksRoot, "dispatch.mjs"), "--platform", platform, "--event", event],
    {
      cwd: repoRoot,
      input: JSON.stringify(input),
      encoding: "utf-8",
    },
  );
}

beforeAll(async () => {
  tmpRoot = mkdtempSync(join(tmpdir(), "ai-experts-real-history-hooks-fixture-"));
  claudeHooksRoot = join(tmpRoot, "claude-hooks");
  codexHooksRoot = join(tmpRoot, "codex-hooks");

  await compileHookModules(componentHooks, claudeHooksRoot, Platform.Claude);
  await compileHookModules(componentHooks, codexHooksRoot, Platform.Codex);

  sampleJsonPath = join(tmpRoot, "sample.json");
  sampleMdPath = join(tmpRoot, "sample.md");
  sampleTsPath = join(tmpRoot, "sample.ts");
  sampleEnvPath = join(tmpRoot, ".env");

  writeFileSync(sampleJsonPath, "{\"ok\": true}\n", "utf-8");
  writeFileSync(sampleMdPath, "# replay\n", "utf-8");
  writeFileSync(sampleTsPath, "export const value = 1;\n", "utf-8");
  writeFileSync(sampleEnvPath, "API_KEY=test\n", "utf-8");
});

afterAll(() => {
  if (tmpRoot) {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
});

describe("hooks real-history fixture replay", () => {
  test("fixture schema and sample volumes are complete", () => {
    assert.equal(fixture.schema, "ai-experts-real-history-fixture/v1");
    assert.equal(typeof fixture.generatedAt, "string");

    assert.ok(fixture.samples.claudeHistory.length >= 80, "expected enough claude history samples");
    assert.ok(fixture.samples.codexHistory.length >= 80, "expected enough codex history samples");
    assert.ok(fixture.samples.codexSessionPrompts.length >= 20, "expected enough codex session prompt samples");
    assert.ok(fixture.samples.claudeHookTelemetry.length >= 40, "expected enough claude hook telemetry samples");
  });

  test("fixture is redacted (no raw local absolute path/uuid/email/token)", () => {
    const raw = JSON.stringify(fixture);
    assert.equal(/\/Users\//.test(raw), false, "fixture must not leak macOS absolute paths");
    assert.equal(/[A-Z]:\\\\/.test(raw), false, "fixture must not leak Windows absolute paths");
    assert.equal(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i.test(raw), false, "fixture must not leak UUIDs");
    assert.equal(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}\b/.test(raw), false, "fixture must not leak email");
    assert.equal(/\b(sk|rk|pk)-[A-Za-z0-9_-]{12,}\b/.test(raw), false, "fixture must not leak API-like tokens");
  });

  test("replays fixture prompts and telemetry samples through hook dispatcher", () => {
    const claudePrompts = fixture.samples.claudeHistory.slice(-32).map((item): ReplayCase => ({
      platform: Platform.Claude,
      event: "UserPromptSubmit",
      input: { cwd: repoRoot, prompt: item.prompt },
    }));
    const codexPrompts = fixture.samples.codexHistory.slice(-32).map((item): ReplayCase => ({
      platform: Platform.Codex,
      event: "UserPromptSubmit",
      input: { cwd: repoRoot, prompt: item.prompt },
    }));
    const codexSessionPrompts = fixture.samples.codexSessionPrompts.slice(-32).map((item): ReplayCase => ({
      platform: Platform.Codex,
      event: "UserPromptSubmit",
      input: { cwd: repoRoot, prompt: item.prompt },
    }));

    const replayCases: ReplayCase[] = [
      ...claudePrompts,
      ...codexPrompts,
      ...codexSessionPrompts,
      ...mapTelemetryToReplayCases(fixture.samples.claudeHookTelemetry).slice(-48),
      {
        platform: Platform.Claude,
        event: "PreToolUse",
        input: {
          cwd: repoRoot,
          tool_name: "Bash",
          tool_input: { command: "git reset --hard HEAD" },
        },
      },
      {
        platform: Platform.Claude,
        event: "PostToolUse",
        input: {
          cwd: repoRoot,
          tool_name: "apply_patch",
          tool_input: {
            command: "*** Update File: dist/codex/AGENTS.md\n@@\n-old\n+new\n",
          },
        },
      },
      {
        platform: Platform.Claude,
        event: "PreToolUse",
        input: {
          cwd: repoRoot,
          tool_name: "Write",
          tool_input: { file_path: ".env", content: "API_KEY=test" },
        },
      },
    ];

    assert.ok(replayCases.length >= 120, "expected sufficient replay coverage");

    let nonEmptyOutputs = 0;
    let outputsWithDecisionOrContext = 0;
    let blockCount = 0;
    let contextCount = 0;

    for (const replayCase of replayCases) {
      const hooksRoot = replayCase.platform === Platform.Claude ? claudeHooksRoot : codexHooksRoot;
      const output = runDispatch(hooksRoot, replayCase.platform, replayCase.event, replayCase.input).trim();
      if (output === "") continue;
      nonEmptyOutputs += 1;

      const parsed = JSON.parse(output) as JsonRecord;
      const decision = parsed.decision;
      const maybeHookOutput = parsed.hookSpecificOutput;
      const hasContext = !!maybeHookOutput &&
        typeof maybeHookOutput === "object" &&
        !Array.isArray(maybeHookOutput) &&
        typeof (maybeHookOutput as JsonRecord).additionalContext === "string";

      if (typeof decision === "string" || hasContext) {
        outputsWithDecisionOrContext += 1;
      }
      if (decision === "block") {
        blockCount += 1;
      }
      if (hasContext) {
        contextCount += 1;
      }
    }

    assert.ok(nonEmptyOutputs > 0, "expected non-empty hook outputs");
    assert.ok(outputsWithDecisionOrContext > 0, "expected outputs to include decision or context");
    assert.ok(blockCount > 0, "expected at least one blocking hook decision");
    assert.ok(contextCount > 0, "expected at least one additionalContext output");
  });
});
