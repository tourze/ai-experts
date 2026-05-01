#!/usr/bin/env node
// Thin execution wrapper for local one-shot agent CLIs.
//
// The exported builders are intentionally pure so tests can verify command
// construction without invoking Codex or Claude.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROVIDERS = new Set(["codex", "claude"]);

export function defaultModelForProvider(provider) {
  if (provider === "codex") return "gpt-5.4-mini";
  if (provider === "claude") return "sonnet";
  throw new Error(`unsupported provider: ${provider}`);
}

export function normalizeProvider(provider = "codex") {
  if (!PROVIDERS.has(provider)) {
    throw new Error(`unsupported provider: ${provider}`);
  }
  return provider;
}

export function buildCodexArgs({
  prompt,
  model = defaultModelForProvider("codex"),
  cwd = "/tmp",
  sandbox = "read-only",
  loadUserConfig = false,
  json = false,
  outputSchemaPath = null,
  outputLastMessagePath = null,
} = {}) {
  if (!prompt) throw new Error("prompt is required");
  const args = [
    "exec",
    "--ephemeral",
    "--skip-git-repo-check",
    "-s",
    sandbox,
    "-C",
    cwd,
    "-m",
    model,
  ];
  if (!loadUserConfig) args.push("--ignore-user-config", "--ignore-rules");
  if (json) args.push("--json");
  if (outputSchemaPath) args.push("--output-schema", outputSchemaPath);
  if (outputLastMessagePath) args.push("-o", outputLastMessagePath);
  args.push(prompt);
  return args;
}

export function buildClaudeArgs({
  prompt,
  model = defaultModelForProvider("claude"),
  loadUserConfig = false,
  outputFormat = "text",
  outputSchemaPath = null,
  settings = null,
} = {}) {
  if (!prompt) throw new Error("prompt is required");
  const args = ["-p", prompt, "--no-session-persistence", "--output-format", outputFormat, "--model", model];
  if (!loadUserConfig) args.push("--bare", "--disable-slash-commands");
  if (outputSchemaPath) args.push("--json-schema", readFileSync(outputSchemaPath, "utf-8"));
  if (settings) args.push("--settings", settings);
  return args;
}

export function buildAgentInvocation(options = {}) {
  const provider = normalizeProvider(options.provider);
  if (provider === "codex") {
    return {
      command: "codex",
      args: buildCodexArgs(options),
      cwd: options.processCwd ?? process.cwd(),
    };
  }
  return {
    command: "claude",
    args: buildClaudeArgs(options),
    cwd: options.cwd ? resolve(options.cwd) : process.cwd(),
  };
}

function resultError(command, args, result) {
  const stderr = result.stderr?.trim();
  const stdout = result.stdout?.trim();
  const parts = [
    `${command} exited ${result.status ?? "unknown"}`,
    stderr ? `stderr: ${stderr}` : "",
    stdout ? `stdout: ${stdout}` : "",
  ].filter(Boolean);
  return new Error(parts.join("\n"));
}

function isolatedCodexEnv(baseEnv = process.env) {
  const sourceHome = baseEnv.CODEX_HOME || resolve(homedir(), ".codex");
  const authPath = resolve(sourceHome, "auth.json");
  if (!existsSync(authPath)) {
    throw new Error(`cannot isolate Codex home: missing auth.json at ${authPath}`);
  }
  const tempHome = mkdtempSync(resolve(tmpdir(), "ai-experts-codex-home-"));
  symlinkSync(authPath, resolve(tempHome, "auth.json"));
  return {
    env: { ...baseEnv, CODEX_HOME: tempHome },
    cleanup: () => rmSync(tempHome, { recursive: true, force: true }),
  };
}

export function runAgent(options = {}) {
  const provider = normalizeProvider(options.provider);
  const model = options.model ?? defaultModelForProvider(provider);
  const invocation = buildAgentInvocation({ ...options, provider, model });
  const timeout = options.timeoutMs ?? 180_000;
  const envSetup = options.isolateCodexHome && provider === "codex"
    ? isolatedCodexEnv(options.env ?? process.env)
    : { env: options.env ?? process.env, cleanup: () => {} };
  let result;
  try {
    result = (options.runner ?? spawnSync)(invocation.command, invocation.args, {
      cwd: invocation.cwd,
      encoding: "utf-8",
      input: "",
      timeout,
      maxBuffer: options.maxBuffer ?? 20 * 1024 * 1024,
      env: envSetup.env,
    });
  } finally {
    envSetup.cleanup();
  }

  if (result.error) throw result.error;
  if (result.status !== 0) throw resultError(invocation.command, invocation.args, result);

  let output = result.stdout?.trimEnd() ?? "";
  if (options.outputLastMessagePath && existsSync(options.outputLastMessagePath)) {
    output = readFileSync(options.outputLastMessagePath, "utf-8").trimEnd();
  }
  return {
    provider,
    model,
    output,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    status: result.status,
  };
}

function parseArgs(argv) {
  const args = { provider: "codex", loadUserConfig: false, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--provider") args.provider = argv[++i];
    else if (arg === "--prompt") args.prompt = argv[++i];
    else if (arg === "--prompt-file") args.promptFile = argv[++i];
    else if (arg === "--model") args.model = argv[++i];
    else if (arg === "--cwd") args.cwd = argv[++i];
    else if (arg === "--sandbox") args.sandbox = argv[++i];
    else if (arg === "--load-user-config") args.loadUserConfig = true;
    else if (arg === "--json") args.json = true;
    else if (arg === "--output-format") args.outputFormat = argv[++i];
    else if (arg === "--output-schema") args.outputSchemaPath = argv[++i];
    else if (arg === "--out") args.outputLastMessagePath = argv[++i];
    else if (arg === "--timeout-ms") args.timeoutMs = Number.parseInt(argv[++i] ?? "", 10);
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`unknown argument: ${arg}`);
  }
  return args;
}

function promptFromArgs(args) {
  if (args.prompt) return args.prompt;
  if (args.promptFile === "-") return readFileSync(0, "utf-8");
  if (args.promptFile) return readFileSync(args.promptFile, "utf-8");
  throw new Error("--prompt or --prompt-file is required");
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      process.stdout.write(
        "usage: agent-runner.mjs --provider codex|claude (--prompt text | --prompt-file path|-) [--model name] [--cwd dir] [--load-user-config]\n",
      );
      process.exit(0);
    }
    const result = runAgent({ ...args, prompt: promptFromArgs(args) });
    process.stdout.write(`${result.output}\n`);
  } catch (err) {
    process.stderr.write(`agent-runner: ${err.message}\n`);
    process.exit(1);
  }
}
