import { createHash } from "node:crypto";
import {
  appendFileSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readSync,
  renameSync,
  rmSync,
  statSync,
} from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import type { LegacyHookPayload } from "../../sdk";

const COMPONENT_NAME = "hooks";
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const DEFAULT_MAX_FILES = 5;

type AuditTelemetryData = Record<string, unknown>;

export type HookTelemetryEntry = {
  ts?: number;
  pid?: number;
  session_id?: string | null;
  transcript_path?: string | null;
  workspace?: string;
  component?: string;
  hook?: string;
  event?: string;
  decision?: string;
  audit_type?: string;
  missing_route?: boolean;
  routed_but_not_used?: boolean;
  skills_recommended?: string[];
  skills_used?: string[];
  [key: string]: unknown;
};

function telemetryRoot() {
  return process.env.AI_EXPERTS_HOOK_TELEMETRY_DIR ||
    join(homedir(), ".ai-components", "hook-telemetry");
}

function parsePositiveInt(value: string | number | null | undefined, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function telemetryMaxBytes() {
  return parsePositiveInt(process.env.AI_EXPERTS_HOOK_TELEMETRY_MAX_BYTES, DEFAULT_MAX_BYTES);
}

function telemetryMaxFiles() {
  return parsePositiveInt(process.env.AI_EXPERTS_HOOK_TELEMETRY_MAX_FILES, DEFAULT_MAX_FILES);
}

function workspacePathForTelemetry(payload: LegacyHookPayload): string {
  if (typeof process.env.AI_EXPERTS_HOOK_TELEMETRY_WORKSPACE === "string" &&
      process.env.AI_EXPERTS_HOOK_TELEMETRY_WORKSPACE.trim()) {
    return resolve(process.env.AI_EXPERTS_HOOK_TELEMETRY_WORKSPACE);
  }
  if (typeof payload?.cwd === "string" && payload.cwd.trim()) {
    return resolve(payload.cwd);
  }
  const filePath = payload?.tool_input?.file_path;
  if (typeof filePath === "string" && filePath.trim()) {
    return resolve(dirname(filePath));
  }
  return resolve(process.cwd());
}

function telemetryBucketForWorkspace(workspacePath: string, root = telemetryRoot()): string {
  const hash = createHash("sha256").update(workspacePath).digest("hex").slice(0, 12);
  const rawName = basename(workspacePath) || "workspace";
  const slug = rawName.replace(/[^A-Za-z0-9._-]+/g, "-").slice(0, 48) || "workspace";
  return join(root, "workspaces", `${hash}-${slug}`);
}

export function telemetryFileForPayload(payload: LegacyHookPayload, root = telemetryRoot()): {
  workspacePath: string;
  dir: string;
  file: string;
} {
  const workspacePath = workspacePathForTelemetry(payload);
  const dir = telemetryBucketForWorkspace(workspacePath, root);
  return {
    workspacePath,
    dir,
    file: join(dir, "decisions.jsonl"),
  };
}

function rotateTelemetryFile(filePath: string): void {
  if (!existsSync(filePath)) {
    return;
  }

  try {
    if (statSync(filePath).size < telemetryMaxBytes()) {
      return;
    }

    const rotations = Math.max(0, telemetryMaxFiles() - 1);
    if (rotations === 0) {
      rmSync(filePath, { force: true });
      return;
    }

    const oldest = `${filePath}.${rotations}`;
    if (existsSync(oldest)) {
      rmSync(oldest, { force: true });
    }

    for (let index = rotations; index >= 1; index -= 1) {
      const source = index === 1 ? filePath : `${filePath}.${index - 1}`;
      const target = `${filePath}.${index}`;
      if (existsSync(source)) {
        renameSync(source, target);
      }
    }
  } catch {
    // Telemetry must never affect user-facing hook behavior.
  }
}

export function recordAuditTelemetry(payload: LegacyHookPayload, data: AuditTelemetryData): void {
  if (process.env.AI_EXPERTS_HOOK_TELEMETRY === "0") {
    return;
  }

  try {
    const telemetry = telemetryFileForPayload(payload);
    if (!existsSync(telemetry.dir)) {
      mkdirSync(telemetry.dir, { recursive: true });
    }
    rotateTelemetryFile(telemetry.file);
    appendFileSync(
      telemetry.file,
      JSON.stringify({
        ts: Date.now(),
        pid: process.pid,
        session_id: payload?.session_id ?? null,
        transcript_path: payload?.transcript_path ?? null,
        workspace: telemetry.workspacePath,
        component: COMPONENT_NAME,
        ...data,
      }) + "\n",
      "utf-8",
    );
  } catch {
    // Telemetry must never affect user-facing hook behavior.
  }
}

export function readRecentTelemetryEntries(payload: LegacyHookPayload, maxBytes = 256 * 1024): HookTelemetryEntry[] {
  const entries: HookTelemetryEntry[] = [];
  const { file } = telemetryFileForPayload(payload);
  if (!existsSync(file)) {
    return entries;
  }

  try {
    const size = statSync(file).size;
    const length = Math.min(size, maxBytes);
    const buffer = Buffer.alloc(length);
    const fd = openSync(file, "r");
    try {
      readSync(fd, buffer, 0, length, size - length);
    } finally {
      closeSync(fd);
    }

    entries.push(...buffer
      .toString("utf-8")
      .split("\n")
      .filter(Boolean)
      .map((line): HookTelemetryEntry | null => {
        try {
          return JSON.parse(line) as HookTelemetryEntry;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is HookTelemetryEntry => entry !== null));
  } catch {
    // Telemetry reads should be best effort.
  }
  return entries;
}
