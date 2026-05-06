import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { extname, join } from "node:path";
import { afterAll, beforeAll, describe, test } from "vitest";
import { Platform } from "../../src/build/core.ts";
import { compileHookModules } from "../../src/build/hooks.ts";
import { componentHooks } from "../../src/components/hooks/index.ts";
import { repoRoot } from "../components/test-helpers";

type JsonRecord = Record<string, unknown>;
type ReplayCase = {
  platform: Platform;
  event: "UserPromptSubmit" | "PreToolUse" | "PostToolUse" | "SessionStart";
  input: JsonRecord;
};

const claudeHistoryPath = join(homedir(), ".claude", "history.jsonl");
const codexHistoryPath = join(homedir(), ".codex", "history.jsonl");
const codexSessionsRoot = join(homedir(), ".codex", "sessions");
const claudeTelemetryPath = join(homedir(), ".claude", "hook-telemetry", "decisions.jsonl");

const hasRealHistoryData = existsSync(claudeHistoryPath) && existsSync(codexHistoryPath) && existsSync(claudeTelemetryPath);
const describeRealHistory = hasRealHistoryData ? describe : describe.skip;

let tmpRoot = "";
let claudeHooksRoot = "";
let codexHooksRoot = "";
let sampleJsonPath = "";
let sampleMdPath = "";
let sampleTsPath = "";
let sampleEnvPath = "";

function readJsonlTail(filePath: string, tailCount: number): JsonRecord[] {
  const lines = readFileSync(filePath, "utf-8").split(/\r?\n/).filter((line) => line.trim() !== "");
  return lines.slice(-tailCount).flatMap((line) => {
    try {
      const parsed = JSON.parse(line);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
      return [parsed as JsonRecord];
    } catch {
      return [];
    }
  });
}

function trimPrompt(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (text.length === 0) return null;
  if (text.length > 600) return text.slice(0, 600);
  return text;
}

function readLatestCodexSessionPrompts(maxPrompts: number): string[] {
  if (!existsSync(codexSessionsRoot)) return [];

  const files: string[] = [];
  const stack = [codexSessionsRoot];
  while (stack.length > 0) {
    const dir = stack.pop() as string;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && entry.name.endsWith(".jsonl")) files.push(full);
    }
  }
  if (files.length === 0) return [];

  files.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  const latestFile = files[0];
  const prompts: string[] = [];
  for (const line of readFileSync(latestFile, "utf-8").split(/\r?\n/).filter((item) => item.trim() !== "")) {
    try {
      const parsed = JSON.parse(line) as JsonRecord;
      if (parsed.type !== "response_item") continue;
      const payload = parsed.payload;
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) continue;
      if ((payload as JsonRecord).type !== "message" || (payload as JsonRecord).role !== "user") continue;
      const content = (payload as JsonRecord).content;
      if (!Array.isArray(content)) continue;
      for (const item of content) {
        if (!item || typeof item !== "object" || Array.isArray(item)) continue;
        const text = trimPrompt((item as JsonRecord).text);
        if (text) prompts.push(text);
      }
    } catch {
      // ignore malformed line
    }
  }
  return prompts.slice(-maxPrompts);
}

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

function mapTelemetryToReplayCases(entries: readonly JsonRecord[]): ReplayCase[] {
  const cases: ReplayCase[] = [];
  for (const entry of entries) {
    const mappedEvent = mapTelemetryEvent(entry.event);
    if (!mappedEvent) continue;

    if (mappedEvent === "UserPromptSubmit") {
      const prompt = trimPrompt(entry.detail) ?? "请检查 hooks 行为是否符合预期";
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

    const toolName = typeof entry.tool === "string" && entry.tool.trim() !== "" ? entry.tool : "Bash";
    if (toolName === "Bash") {
      const command = typeof entry.detail === "string" && entry.detail.includes("Dangerous")
        ? "git reset --hard HEAD"
        : "echo hook-replay";
      cases.push({
        platform: Platform.Claude,
        event: mappedEvent,
        input: {
          cwd: repoRoot,
          tool_name: "Bash",
          tool_input: {
            command,
          },
        },
      });
      continue;
    }

    if (["Edit", "Write", "MultiEdit", "apply_patch"].includes(toolName)) {
      const filePath = pickSampleFilePath(entry.file);
      const toolInput: JsonRecord = {
        file_path: filePath,
      };
      if (mappedEvent === "PostToolUse" && toolName === "apply_patch") {
        toolInput.command = `*** Update File: ${filePath}\n@@\n-const x = 1;\n+const x = 2;\n`;
      }
      cases.push({
        platform: Platform.Claude,
        event: mappedEvent,
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
  if (!hasRealHistoryData) return;

  tmpRoot = mkdtempSync(join(tmpdir(), "ai-experts-real-history-hooks-"));
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

describeRealHistory("hooks real-history replay", () => {
  test("reads recent prompts from ~/.claude and ~/.codex history", () => {
    const claudeRecords = readJsonlTail(claudeHistoryPath, 120);
    const codexRecords = readJsonlTail(codexHistoryPath, 120);

    const claudePrompts = claudeRecords
      .map((record) => trimPrompt(record.display))
      .filter((prompt): prompt is string => prompt !== null);
    const codexPrompts = codexRecords
      .map((record) => trimPrompt(record.text))
      .filter((prompt): prompt is string => prompt !== null);
    const codexSessionPrompts = readLatestCodexSessionPrompts(20);

    assert.ok(claudePrompts.length > 0, "expected recent Claude prompts from ~/.claude/history.jsonl");
    assert.ok(codexPrompts.length > 0, "expected recent Codex prompts from ~/.codex/history.jsonl");
    assert.ok(codexSessionPrompts.length > 0, "expected recent Codex prompts from ~/.codex/sessions/*/*.jsonl");
  });

  test("validates recent ~/.claude hook telemetry schema", () => {
    const telemetryEntries = readJsonlTail(claudeTelemetryPath, 200);
    assert.ok(telemetryEntries.length > 0, "expected recent hook telemetry entries");

    const allowedDecisions = new Set(["allow", "audit", "block", "context", "report"]);
    for (const entry of telemetryEntries) {
      assert.equal(typeof entry.event, "string");
      assert.equal(typeof entry.hook, "string");
      assert.equal(typeof entry.decision, "string");
      assert.equal(allowedDecisions.has(String(entry.decision)), true);
    }
  });

  test("replays recent real-history prompts and telemetry samples through dispatcher", () => {
    const claudeRecords = readJsonlTail(claudeHistoryPath, 120);
    const codexRecords = readJsonlTail(codexHistoryPath, 120);
    const telemetryEntries = readJsonlTail(claudeTelemetryPath, 160);

    const claudePrompts = claudeRecords
      .map((record) => trimPrompt(record.display))
      .filter((prompt): prompt is string => prompt !== null)
      .slice(-12);
    const codexPrompts = codexRecords
      .map((record) => trimPrompt(record.text))
      .filter((prompt): prompt is string => prompt !== null)
      .slice(-12);
    const codexSessionPrompts = readLatestCodexSessionPrompts(12);

    const replayCases: ReplayCase[] = [
      ...claudePrompts.map((prompt): ReplayCase => ({
        platform: Platform.Claude,
        event: "UserPromptSubmit",
        input: { cwd: repoRoot, prompt },
      })),
      ...codexPrompts.map((prompt): ReplayCase => ({
        platform: Platform.Codex,
        event: "UserPromptSubmit",
        input: { cwd: repoRoot, prompt },
      })),
      ...codexSessionPrompts.map((prompt): ReplayCase => ({
        platform: Platform.Codex,
        event: "UserPromptSubmit",
        input: { cwd: repoRoot, prompt },
      })),
      ...mapTelemetryToReplayCases(telemetryEntries).slice(-24),
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
    ];

    assert.ok(replayCases.length >= 20, "expected enough replay samples from real history and telemetry");

    let nonEmptyOutputs = 0;
    let outputWithDecisionOrContext = 0;

    for (const replayCase of replayCases) {
      const hooksRoot = replayCase.platform === Platform.Claude ? claudeHooksRoot : codexHooksRoot;
      const output = runDispatch(hooksRoot, replayCase.platform, replayCase.event, replayCase.input).trim();
      if (output === "") continue;
      nonEmptyOutputs += 1;

      const parsed = JSON.parse(output) as JsonRecord;
      const hasDecision = typeof parsed.decision === "string";
      const maybeHookOutput = parsed.hookSpecificOutput;
      const hasContext =
        !!maybeHookOutput &&
        typeof maybeHookOutput === "object" &&
        !Array.isArray(maybeHookOutput) &&
        typeof (maybeHookOutput as JsonRecord).additionalContext === "string";

      if (hasDecision || hasContext) {
        outputWithDecisionOrContext += 1;
      }
    }

    assert.ok(nonEmptyOutputs > 0, "expected at least one hook output from replay samples");
    assert.ok(outputWithDecisionOrContext > 0, "expected hook outputs to include decision or additionalContext");
  });
});
