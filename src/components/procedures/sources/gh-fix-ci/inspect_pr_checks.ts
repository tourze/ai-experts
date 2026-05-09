#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { spawnSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { delimiter, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const procedure = defineCliProcedure({
  id: "gh-fix-ci-inspect-pr-checks",
  entry: procedureEntry(import.meta.url),
  description:
    "检查指定 GitHub PR 的 CI 检查状态，提取失败检查的日志片段和运行元数据，支持 JSON 输出。",
  owners: { skillIds: ["gh-fix-ci"] },
  target: "scripts/inspect_pr_checks.mjs",
  runtime: "node",
  params: [
    {
      flag: "--repo",
      type: "路径",
      description: "Git 仓库路径（默认 .）",
      required: false,
    },
    {
      flag: "--pr",
      type: "数字",
      description: "PR 编号（默认从当前分支检测）",
      required: false,
    },
    {
      flag: "--max-lines",
      type: "数字",
      description: "最大输出行数（默认 160）",
      required: false,
    },
    {
      flag: "--context",
      type: "数字",
      description: "失败标记上下文行数（默认 30）",
      required: false,
    },
    {
      flag: "--json",
      type: "",
      description: "JSON 格式输出，传此标志即启用",
      required: false,
    },
  ],

  exampleArgs: { args: ["--pr", "123", "--max-lines", "160"] },
});

const FAILURE_CONCLUSIONS = new Set([
  "failure",
  "cancelled",
  "timed_out",
  "action_required",
]);
const FAILURE_STATES = new Set([
  "failure",
  "error",
  "cancelled",
  "timed_out",
  "action_required",
]);
const FAILURE_BUCKETS = new Set(["fail"]);
const FAILURE_MARKERS: any[] = [
  "error",
  "fail",
  "failed",
  "traceback",
  "exception",
  "assert",
  "panic",
  "fatal",
  "timeout",
  "segmentation fault",
];
const DEFAULT_MAX_LINES = 160;
const DEFAULT_CONTEXT_LINES = 30;
const PENDING_LOG_MARKERS: any[] = [
  "still in progress",
  "log will be available when it is complete",
];
function run(command: any, args: any, options: any = {}): any {
  return spawnSync(command, args, {
    cwd: options.cwd,
    encoding: options.encoding ?? "utf-8",
  });
}
export function runGhCommand(args: any, cwd: any): any {
  const result = run("gh", args, { cwd });
  return {
    returncode: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}
export function runGhCommandRaw(args: any, cwd: any): any {
  const result = spawnSync("gh", args, { cwd });
  return {
    returncode: result.status ?? 1,
    stdout: result.stdout ?? Buffer.alloc(0),
    stderr: (result.stderr ?? Buffer.alloc(0)).toString("utf-8"),
  };
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    repo: ".",
    pr: null,
    maxLines: DEFAULT_MAX_LINES,
    context: DEFAULT_CONTEXT_LINES,
    json: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      args.json = true;
    } else if (
      arg === "--repo" ||
      arg === "--pr" ||
      arg === "--max-lines" ||
      arg === "--context"
    ) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) {
        throw new Error(`${arg} requires a value`);
      }
      index += 1;
      if (arg === "--repo") args.repo = value;
      if (arg === "--pr") args.pr = value;
      if (arg === "--max-lines") args.maxLines = Number.parseInt(value, 10);
      if (arg === "--context") args.context = Number.parseInt(value, 10);
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }
  if (!Number.isInteger(args.maxLines)) {
    throw new Error("--max-lines must be an integer");
  }
  if (!Number.isInteger(args.context)) {
    throw new Error("--context must be an integer");
  }
  return args;
}
export function main(argv: readonly string[]): any {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    return 1;
  }
  const repoRoot = findGitRoot(args.repo);
  if (!repoRoot) {
    console.error("Error: not inside a Git repository.");
    return 1;
  }
  if (!ensureGhAvailable(repoRoot)) {
    return 1;
  }
  const prValue = resolvePr(args.pr, repoRoot);
  if (!prValue) {
    return 1;
  }
  const checks = fetchChecks(prValue, repoRoot);
  if (!checks) {
    return 1;
  }
  const failing = checks.filter(isFailing);
  if (!failing.length) {
    console.log(`PR #${prValue}: no failing checks detected.`);
    return 0;
  }
  const results = failing.map((check: any) =>
    analyzeCheck(check, {
      repoRoot,
      maxLines: Math.max(1, args.maxLines),
      context: Math.max(1, args.context),
    }),
  );
  if (args.json) {
    console.log(JSON.stringify({ pr: prValue, results }, null, 2));
  } else {
    renderResults(prValue, results);
  }
  return 1;
}
export function findGitRoot(start: any): any {
  const result = run("git", ["rev-parse", "--show-toplevel"], {
    cwd: resolve(start),
  });
  if (result.status !== 0) {
    return null;
  }
  return result.stdout.trim();
}
function commandExists(command: any): any {
  const paths = (process.env.PATH ?? "").split(delimiter).filter(Boolean);
  const extensions =
    process.platform === "win32"
      ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM").split(";")
      : [""];
  for (const dir of paths) {
    for (const ext of extensions) {
      if (
        existsSync(
          resolve(
            dir,
            process.platform === "win32" ? `${command}${ext}` : command,
          ),
        )
      ) {
        return true;
      }
    }
  }
  return false;
}
export function ensureGhAvailable(repoRoot: any): any {
  if (!commandExists("gh")) {
    console.error("Error: gh is not installed or not on PATH.");
    return false;
  }
  const result = runGhCommand(["auth", "status"], repoRoot);
  if (result.returncode === 0) {
    return true;
  }
  const message = (result.stderr || result.stdout || "").trim();
  console.error(message || "Error: gh not authenticated.");
  return false;
}
export function resolvePr(prValue: any, repoRoot: any): any {
  if (prValue) {
    return prValue;
  }
  const result = runGhCommand(["pr", "view", "--json", "number"], repoRoot);
  if (result.returncode !== 0) {
    const message = (result.stderr || result.stdout || "").trim();
    console.error(message || "Error: unable to resolve PR.");
    return null;
  }
  try {
    const data = JSON.parse(result.stdout || "{}");
    return data.number ? String(data.number) : null;
  } catch {
    console.error("Error: unable to parse PR JSON.");
    return null;
  }
}
export function fetchChecks(prValue: any, repoRoot: any): any {
  const primaryFields: any[] = [
    "name",
    "state",
    "conclusion",
    "detailsUrl",
    "startedAt",
    "completedAt",
  ];
  let result = runGhCommand(
    ["pr", "checks", prValue, "--json", primaryFields.join(",")],
    repoRoot,
  );
  if (result.returncode !== 0) {
    const message = [result.stderr, result.stdout]
      .filter(Boolean)
      .join("\n")
      .trim();
    const availableFields = parseAvailableFields(message);
    if (availableFields.length) {
      const fallbackFields: any[] = [
        "name",
        "state",
        "bucket",
        "link",
        "startedAt",
        "completedAt",
        "workflow",
      ];
      const selectedFields = fallbackFields.filter((field: any) =>
        availableFields.includes(field),
      );
      if (!selectedFields.length) {
        console.error("Error: no usable fields available for gh pr checks.");
        return null;
      }
      result = runGhCommand(
        ["pr", "checks", prValue, "--json", selectedFields.join(",")],
        repoRoot,
      );
      if (result.returncode !== 0) {
        const fallbackMessage = (result.stderr || result.stdout || "").trim();
        console.error(fallbackMessage || "Error: gh pr checks failed.");
        return null;
      }
    } else {
      console.error(message || "Error: gh pr checks failed.");
      return null;
    }
  }
  try {
    const data = JSON.parse(result.stdout || "[]");
    if (!Array.isArray(data)) {
      console.error("Error: unexpected checks JSON shape.");
      return null;
    }
    return data;
  } catch {
    console.error("Error: unable to parse checks JSON.");
    return null;
  }
}
export function isFailing(check: any): any {
  const conclusion = normalizeField(check.conclusion);
  if (FAILURE_CONCLUSIONS.has(conclusion)) {
    return true;
  }
  const state = normalizeField(check.state ?? check.status);
  if (FAILURE_STATES.has(state)) {
    return true;
  }
  const bucket = normalizeField(check.bucket);
  return FAILURE_BUCKETS.has(bucket);
}
export function analyzeCheck(
  check: any,
  { repoRoot, maxLines, context }: any,
): any {
  const url = check.detailsUrl ?? check.link ?? "";
  const runId = extractRunId(url);
  const jobId = extractJobId(url);
  const base: Record<string, any> = {
    name: check.name ?? "",
    detailsUrl: url,
    runId,
    jobId,
  };
  if (!runId) {
    base.status = "external";
    base.note = "No GitHub Actions run id detected in detailsUrl.";
    return base;
  }
  const metadata = fetchRunMetadata(runId, repoRoot);
  const { logText, logError, logStatus } = fetchCheckLog({
    runId,
    jobId,
    repoRoot,
  });
  if (logStatus === "pending") {
    base.status = "log_pending";
    base.note = logError || "Logs are not available yet.";
    if (metadata) base.run = metadata;
    return base;
  }
  if (logError) {
    base.status = "log_unavailable";
    base.error = logError;
    if (metadata) base.run = metadata;
    return base;
  }
  base.status = "ok";
  base.run = metadata ?? {};
  base.logSnippet = extractFailureSnippet(logText, maxLines, context);
  base.logTail = tailLines(logText, maxLines);
  return base;
}
export function extractRunId(url: any): any {
  if (!url) return null;
  for (const pattern of [/\/actions\/runs\/(\d+)/, /\/runs\/(\d+)/]) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}
export function extractJobId(url: any): any {
  if (!url) return null;
  let match = url.match(/\/actions\/runs\/\d+\/job\/(\d+)/);
  if (match) return match[1];
  match = url.match(/\/job\/(\d+)/);
  return match ? match[1] : null;
}
export function fetchRunMetadata(runId: any, repoRoot: any): any {
  const fields: any[] = [
    "conclusion",
    "status",
    "workflowName",
    "name",
    "event",
    "headBranch",
    "headSha",
    "url",
  ];
  const result = runGhCommand(
    ["run", "view", runId, "--json", fields.join(",")],
    repoRoot,
  );
  if (result.returncode !== 0) {
    return null;
  }
  try {
    const data = JSON.parse(result.stdout || "{}");
    return data && typeof data === "object" && !Array.isArray(data)
      ? data
      : null;
  } catch {
    return null;
  }
}
export function fetchCheckLog({ runId, jobId, repoRoot }: any): any {
  const { logText, logError } = fetchRunLog(runId, repoRoot);
  if (!logError) {
    return { logText, logError: "", logStatus: "ok" };
  }
  if (isLogPendingMessage(logError) && jobId) {
    const job = fetchJobLog(jobId, repoRoot);
    if (job.logText) {
      return { logText: job.logText, logError: "", logStatus: "ok" };
    }
    if (job.logError && isLogPendingMessage(job.logError)) {
      return { logText: "", logError: job.logError, logStatus: "pending" };
    }
    if (job.logError) {
      return { logText: "", logError: job.logError, logStatus: "error" };
    }
    return { logText: "", logError, logStatus: "pending" };
  }
  if (isLogPendingMessage(logError)) {
    return { logText: "", logError, logStatus: "pending" };
  }
  return { logText: "", logError, logStatus: "error" };
}
export function fetchRunLog(runId: any, repoRoot: any): any {
  const result = runGhCommand(["run", "view", runId, "--log"], repoRoot);
  if (result.returncode !== 0) {
    const error = (result.stderr || result.stdout || "").trim();
    return { logText: "", logError: error || "gh run view failed" };
  }
  return { logText: result.stdout, logError: "" };
}
export function fetchJobLog(jobId: any, repoRoot: any): any {
  const repoSlug = fetchRepoSlug(repoRoot);
  if (!repoSlug) {
    return {
      logText: "",
      logError: "Error: unable to resolve repository name for job logs.",
    };
  }
  const endpoint = `/repos/${repoSlug}/actions/jobs/${jobId}/logs`;
  const result = runGhCommandRaw(["api", endpoint], repoRoot);
  if (result.returncode !== 0) {
    const message = (result.stderr || result.stdout.toString("utf-8")).trim();
    return { logText: "", logError: message || "gh api job logs failed" };
  }
  if (isZipPayload(result.stdout)) {
    return {
      logText: "",
      logError: "Job logs returned a zip archive; unable to parse.",
    };
  }
  return { logText: result.stdout.toString("utf-8"), logError: "" };
}
export function fetchRepoSlug(repoRoot: any): any {
  const result = runGhCommand(
    ["repo", "view", "--json", "nameWithOwner"],
    repoRoot,
  );
  if (result.returncode !== 0) {
    return null;
  }
  try {
    const data = JSON.parse(result.stdout || "{}");
    return data.nameWithOwner ? String(data.nameWithOwner) : null;
  } catch {
    return null;
  }
}
export function normalizeField(value: any): any {
  if (value == null) {
    return "";
  }
  return String(value).trim().toLowerCase();
}
export function parseAvailableFields(message: any): any {
  if (!message.includes("Available fields:")) {
    return [];
  }
  const fields: any[] = [];
  let collecting = false;
  for (const line of message.split(/\r?\n/)) {
    if (line.includes("Available fields:")) {
      collecting = true;
      continue;
    }
    if (!collecting) {
      continue;
    }
    const field = line.trim();
    if (field) {
      fields.push(field);
    }
  }
  return fields;
}
export function isLogPendingMessage(message: any): any {
  const lowered = message.toLowerCase();
  return PENDING_LOG_MARKERS.some((marker: any) => lowered.includes(marker));
}
export function isZipPayload(payload: any): any {
  return payload.subarray(0, 2).equals(Buffer.from("PK"));
}
export function extractFailureSnippet(
  logText: any,
  maxLines: any,
  context: any,
): any {
  const lines = splitLines(logText);
  if (!lines.length) {
    return "";
  }
  const markerIndex = findFailureIndex(lines);
  if (markerIndex == null) {
    return lines.slice(-maxLines).join("\n");
  }
  const start = Math.max(0, markerIndex - context);
  const end = Math.min(lines.length, markerIndex + context);
  let window = lines.slice(start, end);
  if (window.length > maxLines) {
    window = window.slice(-maxLines);
  }
  return window.join("\n");
}
export function findFailureIndex(lines: any): any {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const lowered = lines[index].toLowerCase();
    if (FAILURE_MARKERS.some((marker: any) => lowered.includes(marker))) {
      return index;
    }
  }
  return null;
}
export function tailLines(text: any, maxLines: any): any {
  if (maxLines <= 0) {
    return "";
  }
  return splitLines(text).slice(-maxLines).join("\n");
}
export function renderResults(prNumber: any, results: any): any {
  const resultList: any[] = [...results];
  console.log(`PR #${prNumber}: ${resultList.length} failing checks analyzed.`);
  for (const result of resultList) {
    console.log("-".repeat(60));
    console.log(`Check: ${result.name ?? ""}`);
    if (result.detailsUrl) console.log(`Details: ${result.detailsUrl}`);
    if (result.runId) console.log(`Run ID: ${result.runId}`);
    if (result.jobId) console.log(`Job ID: ${result.jobId}`);
    console.log(`Status: ${result.status ?? "unknown"}`);
    const runMeta = result.run ?? {};
    if (Object.keys(runMeta).length) {
      const branch = runMeta.headBranch ?? "";
      const sha = String(runMeta.headSha ?? "").slice(0, 12);
      const workflow = runMeta.workflowName ?? runMeta.name ?? "";
      const conclusion = runMeta.conclusion ?? runMeta.status ?? "";
      console.log(`Workflow: ${workflow} (${conclusion})`);
      if (branch || sha) console.log(`Branch/SHA: ${branch} ${sha}`);
      if (runMeta.url) console.log(`Run URL: ${runMeta.url}`);
    }
    if (result.note) console.log(`Note: ${result.note}`);
    if (result.error) {
      console.log(`Error fetching logs: ${result.error}`);
      continue;
    }
    const snippet = result.logSnippet ?? "";
    if (snippet) {
      console.log("Failure snippet:");
      console.log(indentBlock(snippet, "  "));
    } else {
      console.log("No snippet available.");
    }
  }
  console.log("-".repeat(60));
}
export function indentBlock(text: any, prefix: any = "  "): any {
  return splitLines(text)
    .map((line: any) => `${prefix}${line}`)
    .join("\n");
}
export function splitLines(text: any): any {
  if (!text) {
    return [];
  }
  const lines = text.split(/\r?\n/);
  if (lines.at(-1) === "") {
    lines.pop();
  }
  return lines;
}
