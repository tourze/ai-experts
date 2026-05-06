#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const fixtureDir = __filename.slice(0, __filename.lastIndexOf("/"));
const outputFile = join(fixtureDir, "sanitized-session-fixture.json");

const CLAUDE_HISTORY = join(homedir(), ".claude", "history.jsonl");
const CODEX_HISTORY = join(homedir(), ".codex", "history.jsonl");
const CLAUDE_HOOK_TELEMETRY = join(homedir(), ".claude", "hook-telemetry", "decisions.jsonl");
const CODEX_SESSIONS_ROOT = join(homedir(), ".codex", "sessions");

const LIMITS = {
  claudeHistory: 160,
  codexHistory: 160,
  codexSessionPrompts: 160,
  claudeHookTelemetry: 220,
};

function ensureFile(path, label) {
  if (!existsSync(path)) {
    throw new Error(`${label} not found: ${path}`);
  }
}

function safeParseJson(line) {
  try {
    const parsed = JSON.parse(line);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function readJsonl(filePath) {
  const lines = readFileSync(filePath, "utf-8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.map((line) => safeParseJson(line)).filter((line) => line !== null);
}

function walkJsonlFiles(root) {
  const results = [];
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
        results.push(full);
      }
    }
  }
  return results.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
}

function sanitizeText(value) {
  if (typeof value !== "string") return value;
  let text = value;
  text = text.replace(/\r/g, "");
  text = text.replace(/\/Users\/[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._~\/-]+)?/g, "<ABS_PATH>");
  text = text.replace(/[A-Z]:\\(?:[^\\\s"']+\\)*[^\\\s"']*/g, "<WIN_PATH>");
  text = text.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "<UUID>");
  text = text.replace(/\b[0-9a-f]{32,}\b/gi, "<HEX>");
  text = text.replace(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}\b/g, "<EMAIL>");
  text = text.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "<IP>");
  text = text.replace(/\b(sk|rk|pk)-[A-Za-z0-9_-]{12,}\b/g, "<TOKEN>");
  text = text.replace(/\bAKIA[0-9A-Z]{16}\b/g, "<AWS_KEY>");
  text = text.replace(/[ \t]{2,}/g, " ");
  return text;
}

function shortHash(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 16);
}

function pickRecent(items, limit) {
  if (!Array.isArray(items)) return [];
  return items.slice(-limit);
}

function normalizeTs(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function extractCodexSessionPrompts() {
  if (!existsSync(CODEX_SESSIONS_ROOT)) return [];
  const files = walkJsonlFiles(CODEX_SESSIONS_ROOT).slice(0, 6);
  const prompts = [];

  for (const filePath of files) {
    const records = readJsonl(filePath);
    for (const record of records) {
      if (record.type !== "response_item") continue;
      const payload = record.payload;
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) continue;
      if (payload.type !== "message" || payload.role !== "user") continue;
      const contents = Array.isArray(payload.content) ? payload.content : [];
      for (const content of contents) {
        if (!content || typeof content !== "object" || Array.isArray(content)) continue;
        const text = sanitizeText(content.text);
        if (typeof text !== "string") continue;
        const trimmed = text.trim();
        if (!trimmed) continue;
        prompts.push({
          ts: normalizeTs(record.timestamp),
          prompt: trimmed.slice(0, 600),
          sourceFileHash: shortHash(filePath),
        });
      }
    }
  }

  return pickRecent(prompts, LIMITS.codexSessionPrompts);
}

function extractClaudeHistory() {
  const records = readJsonl(CLAUDE_HISTORY);
  const normalized = records
    .map((record) => {
      const prompt = sanitizeText(record.display);
      if (typeof prompt !== "string" || prompt.trim() === "") return null;
      return {
        ts: normalizeTs(record.timestamp),
        prompt: prompt.trim().slice(0, 600),
        sessionHash: record.sessionId ? shortHash(record.sessionId) : null,
      };
    })
    .filter((record) => record !== null);
  return pickRecent(normalized, LIMITS.claudeHistory);
}

function extractCodexHistory() {
  const records = readJsonl(CODEX_HISTORY);
  const normalized = records
    .map((record) => {
      const prompt = sanitizeText(record.text);
      if (typeof prompt !== "string" || prompt.trim() === "") return null;
      return {
        ts: normalizeTs(record.ts),
        prompt: prompt.trim().slice(0, 600),
        sessionHash: record.session_id ? shortHash(record.session_id) : null,
      };
    })
    .filter((record) => record !== null);
  return pickRecent(normalized, LIMITS.codexHistory);
}

function extractClaudeHookTelemetry() {
  const records = readJsonl(CLAUDE_HOOK_TELEMETRY);
  const normalized = records.map((record) => ({
    ts: normalizeTs(record.ts),
    event: sanitizeText(record.event),
    decision: sanitizeText(record.decision),
    hook: sanitizeText(record.hook),
    tool: sanitizeText(record.tool),
    file: sanitizeText(record.file),
    detail: sanitizeText(record.detail),
    pluginHash: record.plugin ? shortHash(record.plugin) : null,
    durationMs: typeof record.duration_ms === "number" ? record.duration_ms : null,
  }));
  return pickRecent(normalized, LIMITS.claudeHookTelemetry);
}

function main() {
  ensureFile(CLAUDE_HISTORY, "Claude history");
  ensureFile(CODEX_HISTORY, "Codex history");
  ensureFile(CLAUDE_HOOK_TELEMETRY, "Claude hook telemetry");

  const fixture = {
    schema: "ai-experts-real-history-fixture/v1",
    generatedAt: new Date().toISOString(),
    source: {
      claudeHistory: "~/.claude/history.jsonl",
      codexHistory: "~/.codex/history.jsonl",
      codexSessions: "~/.codex/sessions/**/*.jsonl",
      claudeHookTelemetry: "~/.claude/hook-telemetry/decisions.jsonl",
    },
    redaction: {
      notes: [
        "absolute paths, UUIDs, long hex ids, emails, IPs, API-like tokens are masked",
        "session ids and plugin ids are stored only as short hashes",
      ],
    },
    samples: {
      claudeHistory: extractClaudeHistory(),
      codexHistory: extractCodexHistory(),
      codexSessionPrompts: extractCodexSessionPrompts(),
      claudeHookTelemetry: extractClaudeHookTelemetry(),
    },
  };

  mkdirSync(fixtureDir, { recursive: true });
  writeFileSync(outputFile, JSON.stringify(fixture, null, 2) + "\n", "utf-8");

  console.log(`wrote ${outputFile}`);
  console.log(`claudeHistory=${fixture.samples.claudeHistory.length}`);
  console.log(`codexHistory=${fixture.samples.codexHistory.length}`);
  console.log(`codexSessionPrompts=${fixture.samples.codexSessionPrompts.length}`);
  console.log(`claudeHookTelemetry=${fixture.samples.claudeHookTelemetry.length}`);
}

main();
