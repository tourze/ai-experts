#!/usr/bin/env node
/**
 * 为 eval 结果生成并提供 review 页面。
 */

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const METADATA_FILES = new Set(["transcript.md", "user_notes.md", "metrics.json"]);

const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".json",
  ".csv",
  ".py",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".yaml",
  ".yml",
  ".xml",
  ".html",
  ".css",
  ".sh",
  ".rb",
  ".go",
  ".rs",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".sql",
  ".r",
  ".toml",
]);

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"]);

const MIME_OVERRIDES: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

function getMimeType(path: string): string {
  const ext = extname(path).toLowerCase();
  if (MIME_OVERRIDES[ext]) return MIME_OVERRIDES[ext];

  if (ext === ".json") return "application/json";
  if (ext === ".csv") return "text/csv";
  if (ext === ".md") return "text/markdown";
  if (ext === ".html") return "text/html";
  if (ext === ".pdf") return "application/pdf";
  if (IMAGE_EXTENSIONS.has(ext)) return `image/${ext.replace(".", "") === "jpg" ? "jpeg" : ext.replace(".", "")}`;

  return "application/octet-stream";
}

function resolveViewerTemplatePath(): string {
  const candidates = [
    join(__dirname, "viewer.html"),
    join(__dirname, "../../../skills/skill-creator/assets/eval-viewer/viewer.html"),
    join(__dirname, "../../skills/skill-creator/assets/eval-viewer/viewer.html"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error("viewer.html not found for generate_review.ts");
}

export function findRuns(workspace: string): any[] {
  const runs: any[] = [];
  findRunsRecursive(workspace, workspace, runs);
  runs.sort((a, b) => {
    const aEval = Number.isFinite(a.eval_id) ? a.eval_id : Number.POSITIVE_INFINITY;
    const bEval = Number.isFinite(b.eval_id) ? b.eval_id : Number.POSITIVE_INFINITY;
    if (aEval !== bEval) return aEval - bEval;
    return String(a.id).localeCompare(String(b.id));
  });
  return runs;
}

function findRunsRecursive(root: string, current: string, runs: any[]): void {
  if (!isDir(current)) return;

  const outputsDir = join(current, "outputs");
  if (isDir(outputsDir)) {
    const run = buildRun(root, current);
    if (run) runs.push(run);
    return;
  }

  const skip = new Set(["node_modules", ".git", "__pycache__", "skill", "inputs"]);
  for (const childName of safeReadDir(current)) {
    if (skip.has(childName)) continue;
    const childPath = join(current, childName);
    if (isDir(childPath)) {
      findRunsRecursive(root, childPath, runs);
    }
  }
}

function buildRun(root: string, runDir: string): any | null {
  let prompt = "";
  let evalId: number | null = null;

  for (const candidate of [join(runDir, "eval_metadata.json"), join(resolve(runDir, ".."), "eval_metadata.json")]) {
    if (!existsSync(candidate)) continue;
    try {
      const metadata = JSON.parse(readFileSync(candidate, "utf8"));
      prompt = String(metadata.prompt ?? "");
      evalId = Number.isFinite(metadata.eval_id) ? Number(metadata.eval_id) : null;
      if (prompt) break;
    } catch {
      // ignore
    }
  }

  if (!prompt) {
    for (const candidate of [join(runDir, "transcript.md"), join(runDir, "outputs", "transcript.md")]) {
      if (!existsSync(candidate)) continue;
      try {
        const text = readFileSync(candidate, "utf8");
        const match = text.match(/## Eval Prompt\n\n([\s\S]*?)(?=\n##|$)/);
        if (match?.[1]) {
          prompt = match[1].trim();
          break;
        }
      } catch {
        // ignore
      }
    }
  }

  if (!prompt) {
    prompt = "（未找到 prompt）";
  }

  const runId = relative(root, runDir).replaceAll("/", "-").replaceAll("\\", "-");
  const outputsDir = join(runDir, "outputs");
  const outputFiles: any[] = [];

  if (isDir(outputsDir)) {
    for (const name of safeReadDir(outputsDir)) {
      const filePath = join(outputsDir, name);
      if (!isFile(filePath)) continue;
      if (METADATA_FILES.has(name)) continue;
      outputFiles.push(embedFile(filePath));
    }
  }

  let grading: any = null;
  for (const candidate of [join(runDir, "grading.json"), join(resolve(runDir, ".."), "grading.json")]) {
    if (!existsSync(candidate)) continue;
    try {
      grading = JSON.parse(readFileSync(candidate, "utf8"));
      if (grading) break;
    } catch {
      // ignore
    }
  }

  return {
    id: runId,
    prompt,
    eval_id: evalId,
    outputs: outputFiles,
    grading,
  };
}

function embedFile(path: string): any {
  const ext = extname(path).toLowerCase();
  const mime = getMimeType(path);

  if (TEXT_EXTENSIONS.has(ext)) {
    try {
      return {
        name: fileName(path),
        type: "text",
        content: readFileSync(path, "utf8"),
      };
    } catch {
      return { name: fileName(path), type: "error", content: "（读取文件失败）" };
    }
  }

  if (IMAGE_EXTENSIONS.has(ext)) {
    try {
      const b64 = readFileSync(path).toString("base64");
      return {
        name: fileName(path),
        type: "image",
        mime,
        data_uri: `data:${mime};base64,${b64}`,
      };
    } catch {
      return { name: fileName(path), type: "error", content: "（读取文件失败）" };
    }
  }

  if (ext === ".pdf") {
    try {
      const b64 = readFileSync(path).toString("base64");
      return {
        name: fileName(path),
        type: "pdf",
        data_uri: `data:${mime};base64,${b64}`,
      };
    } catch {
      return { name: fileName(path), type: "error", content: "（读取文件失败）" };
    }
  }

  if (ext === ".xlsx") {
    try {
      const b64 = readFileSync(path).toString("base64");
      return {
        name: fileName(path),
        type: "xlsx",
        data_b64: b64,
      };
    } catch {
      return { name: fileName(path), type: "error", content: "（读取文件失败）" };
    }
  }

  try {
    const b64 = readFileSync(path).toString("base64");
    return {
      name: fileName(path),
      type: "binary",
      mime,
      data_uri: `data:${mime};base64,${b64}`,
    };
  } catch {
    return { name: fileName(path), type: "error", content: "（读取文件失败）" };
  }
}

export function loadPreviousIteration(workspace: string): Record<string, { feedback: string; outputs: any[] }> {
  const result: Record<string, { feedback: string; outputs: any[] }> = {};

  const feedbackMap: Record<string, string> = {};
  const feedbackPath = join(workspace, "feedback.json");
  if (existsSync(feedbackPath)) {
    try {
      const data = JSON.parse(readFileSync(feedbackPath, "utf8"));
      for (const review of data.reviews ?? []) {
        const runId = String(review.run_id ?? "");
        const feedback = String(review.feedback ?? "").trim();
        if (runId && feedback) feedbackMap[runId] = feedback;
      }
    } catch {
      // ignore
    }
  }

  for (const run of findRuns(workspace)) {
    result[run.id] = {
      feedback: feedbackMap[run.id] ?? "",
      outputs: run.outputs ?? [],
    };
  }

  for (const [runId, feedback] of Object.entries(feedbackMap)) {
    if (!result[runId]) {
      result[runId] = { feedback, outputs: [] };
    }
  }

  return result;
}

export function generateHtml(
  runs: any[],
  skillName: string,
  previous: Record<string, { feedback: string; outputs: any[] }> | null = null,
  benchmark: any = null,
): string {
  const templatePath = resolveViewerTemplatePath();
  const template = readFileSync(templatePath, "utf8");

  const previousFeedback: Record<string, string> = {};
  const previousOutputs: Record<string, any[]> = {};

  if (previous) {
    for (const [runId, data] of Object.entries(previous)) {
      if (data.feedback) {
        previousFeedback[runId] = data.feedback;
      }
      if (Array.isArray(data.outputs) && data.outputs.length > 0) {
        previousOutputs[runId] = data.outputs;
      }
    }
  }

  const embedded: any = {
    skill_name: skillName,
    runs,
    previous_feedback: previousFeedback,
    previous_outputs: previousOutputs,
  };
  if (benchmark) {
    embedded.benchmark = benchmark;
  }

  return template.replace("/*__EMBEDDED_DATA__*/", `const EMBEDDED_DATA = ${JSON.stringify(embedded)};`);
}

function killPort(port: number): void {
  try {
    const result = spawnSync("lsof", ["-ti", `:${port}`], { encoding: "utf8", timeout: 5000 });
    const pids = result.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    for (const pid of pids) {
      spawnSync("kill", ["-TERM", pid], { stdio: "ignore" });
    }
  } catch {
    // ignore
  }
}

function serve(
  workspace: string,
  skillName: string,
  feedbackPath: string,
  previous: Record<string, { feedback: string; outputs: any[] }>,
  benchmarkPath: string | null,
  port: number,
): void {
  const server = createServer((req, res) => {
    handleRequest(req, res, workspace, skillName, feedbackPath, previous, benchmarkPath);
  });

  server.once("error", () => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const finalPort = typeof address === "object" && address ? address.port : port;
      printServerBanner(finalPort, workspace, feedbackPath, previous, benchmarkPath);
      openBrowser(`http://localhost:${finalPort}`);
    });
  });

  server.listen(port, "127.0.0.1", () => {
    printServerBanner(port, workspace, feedbackPath, previous, benchmarkPath);
    openBrowser(`http://localhost:${port}`);
  });

  process.on("SIGINT", () => {
    console.log("\n已停止。");
    server.close(() => process.exit(0));
  });
}

function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  workspace: string,
  skillName: string,
  feedbackPath: string,
  previous: Record<string, { feedback: string; outputs: any[] }>,
  benchmarkPath: string | null,
): void {
  const path = req.url ?? "/";

  if (req.method === "GET" && (path === "/" || path === "/index.html")) {
    const runs = findRuns(workspace);
    let benchmark: any = null;
    if (benchmarkPath && existsSync(benchmarkPath)) {
      try {
        benchmark = JSON.parse(readFileSync(benchmarkPath, "utf8"));
      } catch {
        benchmark = null;
      }
    }

    const html = generateHtml(runs, skillName, previous, benchmark);
    const content = Buffer.from(html, "utf8");

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Length", String(content.length));
    res.end(content);
    return;
  }

  if (req.method === "GET" && path === "/api/feedback") {
    let data = Buffer.from("{}", "utf8");
    if (existsSync(feedbackPath)) {
      data = readFileSync(feedbackPath);
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Length", String(data.length));
    res.end(data);
    return;
  }

  if (req.method === "POST" && path === "/api/feedback") {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => {
      try {
        const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        if (!payload || typeof payload !== "object" || !("reviews" in payload)) {
          throw new Error("期望收到包含 'reviews' key 的 JSON object");
        }
        writeFileSync(feedbackPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

        const ok = Buffer.from('{"ok":true}', "utf8");
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Length", String(ok.length));
        res.end(ok);
      } catch (error) {
        const body = Buffer.from(JSON.stringify({ error: String((error as Error).message ?? error) }), "utf8");
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Length", String(body.length));
        res.end(body);
      }
    });
    return;
  }

  res.statusCode = 404;
  res.end("Not Found");
}

function openBrowser(url: string): void {
  const platform = process.platform;
  if (platform === "darwin") {
    spawnSync("open", [url], { stdio: "ignore" });
  } else if (platform === "win32") {
    spawnSync("cmd", ["/c", "start", "", url], { stdio: "ignore" });
  } else {
    spawnSync("xdg-open", [url], { stdio: "ignore" });
  }
}

function printServerBanner(
  port: number,
  workspace: string,
  feedbackPath: string,
  previous: Record<string, { feedback: string; outputs: any[] }>,
  benchmarkPath: string | null,
): void {
  console.log("\n  Eval Viewer");
  console.log("  ─────────────────────────────────");
  console.log(`  URL:       http://localhost:${port}`);
  console.log(`  Workspace: ${workspace}`);
  console.log(`  Feedback:  ${feedbackPath}`);
  if (Object.keys(previous).length > 0) {
    console.log(`  Previous:  loaded (${Object.keys(previous).length} 个 runs)`);
  }
  if (benchmarkPath) {
    console.log(`  Benchmark: ${benchmarkPath}`);
  }
  console.log("\n  按 Ctrl+C 停止。\n");
}

function parseCliArgs() {
  const parsed = parseArgs({
    allowPositionals: true,
    options: {
      help: { type: "boolean", short: "h" },
      port: { type: "string", short: "p" },
      "skill-name": { type: "string", short: "n" },
      "previous-workspace": { type: "string" },
      benchmark: { type: "string" },
      static: { type: "string", short: "s" },
    },
  });

  if (parsed.values.help) {
    return { help: true };
  }

  const workspaceArg = parsed.positionals[0];
  if (!workspaceArg) {
    console.error("错误：缺少 workspace 目录路径");
    process.exit(1);
  }

  const workspace = resolve(workspaceArg);
  if (!isDir(workspace)) {
    console.error(`错误：${workspace} 不是目录`);
    process.exit(1);
  }

  const runs = findRuns(workspace);
  if (runs.length === 0) {
    console.error(`在 ${workspace} 中未找到 runs`);
    process.exit(1);
  }

  const port = Number(parsed.values.port ?? "3117");
  const skillName = String(parsed.values["skill-name"] ?? fileName(workspace).replace(/-workspace$/, ""));
  const feedbackPath = join(workspace, "feedback.json");

  let previous: Record<string, { feedback: string; outputs: any[] }> = {};
  if (parsed.values["previous-workspace"]) {
    previous = loadPreviousIteration(resolve(String(parsed.values["previous-workspace"])));
  }

  const benchmarkPath = parsed.values.benchmark ? resolve(String(parsed.values.benchmark)) : null;
  let benchmark: any = null;
  if (benchmarkPath && existsSync(benchmarkPath)) {
    try {
      benchmark = JSON.parse(readFileSync(benchmarkPath, "utf8"));
    } catch {
      benchmark = null;
    }
  }

  const staticOutputPath = parsed.values.static ? resolve(String(parsed.values.static)) : null;

  return {
    workspace,
    runs,
    port,
    skillName,
    feedbackPath,
    previous,
    benchmarkPath,
    benchmark,
    staticOutputPath,
  };
}

export function main(): void {
  const {
    help,
    workspace,
    runs,
    port,
    skillName,
    feedbackPath,
    previous,
    benchmarkPath,
    benchmark,
    staticOutputPath,
  } = parseCliArgs();

  if (help) {
    console.log("Usage: node generate_review.mjs <workspace> [--static output.html] [--skill-name name] [--port 3117]");
    return;
  }

  if (staticOutputPath) {
    const html = generateHtml(runs, skillName, previous, benchmark);
    mkdirSync(dirname(staticOutputPath), { recursive: true });
    writeFileSync(staticOutputPath, html, "utf8");
    console.log(`\n  静态 viewer 已写入：${staticOutputPath}\n`);
    return;
  }

  killPort(port);
  serve(workspace, skillName, feedbackPath, previous, benchmarkPath, port);
}

function safeReadDir(path: string): string[] {
  try {
    return readdirSync(path).sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function isDir(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function fileName(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).pop() ?? path;
}

if (process.argv[1] && resolve(process.argv[1]) === __filename) {
  main();
}
