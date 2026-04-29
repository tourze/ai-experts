import { createHash } from "node:crypto";
import { existsSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";

export const TELEMETRY_ROOT = process.env.AI_EXPERTS_HOOK_TELEMETRY_DIR ||
  join(homedir(), ".claude", "hook-telemetry");
export const EXPLICIT_TELEMETRY_FILE = process.env.AI_EXPERTS_HOOK_TELEMETRY_FILE || null;

export function workspaceBucketDir(workspacePath) {
  const resolved = resolve(workspacePath);
  const hash = createHash("sha256").update(resolved).digest("hex").slice(0, 12);
  const rawName = basename(resolved) || "workspace";
  const slug = rawName.replace(/[^A-Za-z0-9._-]+/g, "-").slice(0, 48) || "workspace";
  return join(TELEMETRY_ROOT, "workspaces", `${hash}-${slug}`);
}

export function telemetryFilesInDir(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    return [];
  }
  return readdirSync(dir)
    .filter((name) => /^decisions\.jsonl(?:\.\d+)?$/.test(name))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
    .map((name) => join(dir, name));
}

export function allWorkspaceTelemetryFiles() {
  const workspacesRoot = join(TELEMETRY_ROOT, "workspaces");
  if (!existsSync(workspacesRoot) || !statSync(workspacesRoot).isDirectory()) {
    return [];
  }
  return readdirSync(workspacesRoot)
    .map((name) => join(workspacesRoot, name))
    .filter((dir) => existsSync(dir) && statSync(dir).isDirectory())
    .flatMap((dir) => telemetryFilesInDir(dir));
}

export function telemetrySources(args) {
  if (args.telemetryFile) {
    return {
      description: args.telemetryFile,
      files: existsSync(args.telemetryFile) ? [args.telemetryFile] : [],
    };
  }

  if (args.allWorkspaces) {
    return {
      description: `${join(TELEMETRY_ROOT, "workspaces", "*/decisions.jsonl*")}`,
      files: allWorkspaceTelemetryFiles(),
    };
  }

  const dir = workspaceBucketDir(args.workspace);
  return {
    description: `${dir}/decisions.jsonl*`,
    files: telemetryFilesInDir(dir),
  };
}

export function sessionKey(entry) {
  return entry.session_id || entry.transcript_path || null;
}

export function applySessionFilter(entries, session) {
  if (!session) {
    return { entries, label: null };
  }

  if (session === "latest") {
    const latest = [...entries]
      .filter((entry) => sessionKey(entry))
      .sort((left, right) => (right.ts ?? 0) - (left.ts ?? 0))[0];
    const key = latest ? sessionKey(latest) : null;
    return {
      entries: key ? entries.filter((entry) => sessionKey(entry) === key) : [],
      label: key || "latest (no session_id/transcript_path found)",
    };
  }

  return {
    entries: entries.filter((entry) => entry.session_id === session || entry.transcript_path === session),
    label: session,
  };
}
