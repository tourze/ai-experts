#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { spawn } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import { homedir } from "node:os";
import {
  basename,
  delimiter,
  dirname,
  isAbsolute,
  relative,
  resolve,
} from "node:path";

export const procedure = defineCliProcedure({
  id: "remote-ssh-command-ssh-exec",
  entry: procedureEntry(import.meta.url),
  description:
    "通过 SSH 在远端机器执行命令：从 ~/.host/ 读取主机 JSON 配置，命令从 stdin 读取，支持超时控制和执行历史记录。",
  owners: { skillIds: ["remote-ssh-command"] },
  target: "scripts/ssh-exec.mjs",
  runtime: "node",

  exampleArgs: { args: ["~/.host/my-server.json"] },
});

const DEFAULT_TIMEOUT_SECONDS = 120;
const TIMEOUT_EXIT_CODE = 124;
function expandHome(inputPath: any, homeDir: any = homedir()): any {
  if (inputPath === "~") return homeDir;
  if (inputPath.startsWith("~/")) return resolve(homeDir, inputPath.slice(2));
  return inputPath;
}
function isInside(parent: any, child: any): any {
  const rel = relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}
export function commandExists(command: any, env: any = process.env): any {
  const paths = (env.PATH ?? "").split(delimiter).filter(Boolean);
  const extensions =
    process.platform === "win32"
      ? (env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM").split(";")
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
export function resolveHostConfigPath(
  inputPath: any,
  homeDir: any = homedir(),
): any {
  if (!inputPath) {
    throw new Error("Usage: node scripts/ssh-exec.mjs ~/.host/<host>.json");
  }
  const hostDir = resolve(homeDir, ".host");
  const resolvedPath = resolve(expandHome(inputPath, homeDir));
  const realHostDir = realpathSync(hostDir);
  const realConfigPath = realpathSync(resolvedPath);
  if (!isInside(realHostDir, realConfigPath)) {
    throw new Error("Host config must be stored under ~/.host/");
  }
  if (!basename(realConfigPath).endsWith(".json")) {
    throw new Error("Host config path must end with .json");
  }
  return realConfigPath;
}
export function historyPathForConfig(configPath: any): any {
  const fileName = basename(configPath);
  const stem = fileName.endsWith(".json") ? fileName.slice(0, -5) : fileName;
  return resolve(dirname(configPath), `${stem}.history`);
}
export function parseHostConfig(rawConfig: any): any {
  const config =
    typeof rawConfig === "string" ? JSON.parse(rawConfig) : rawConfig;
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("Host config must be a JSON object");
  }
  if (typeof config.host !== "string" || config.host.trim() === "") {
    throw new Error("Host config requires non-empty host");
  }
  if (typeof config.user !== "string" || config.user.trim() === "") {
    throw new Error("Host config requires non-empty user");
  }
  const port = config.port == null ? 22 : config.port;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Host config port must be an integer between 1 and 65535");
  }
  const timeoutSeconds =
    config.timeoutSeconds == null
      ? DEFAULT_TIMEOUT_SECONDS
      : config.timeoutSeconds;
  if (!Number.isInteger(timeoutSeconds) || timeoutSeconds < 1) {
    throw new Error("Host config timeoutSeconds must be a positive integer");
  }
  if (!config.auth || config.auth.type !== "password") {
    throw new Error('First version only supports auth.type = "password"');
  }
  if (
    typeof config.auth.password !== "string" ||
    config.auth.password.length === 0
  ) {
    throw new Error("Password auth requires non-empty auth.password");
  }
  return {
    host: config.host.trim(),
    port,
    user: config.user.trim(),
    timeoutSeconds,
    auth: {
      type: "password",
      password: config.auth.password,
    },
  };
}
export function buildSshpassInvocation(config: any, command: any): any {
  return {
    command: "sshpass",
    args: [
      "-e",
      "ssh",
      "-p",
      String(config.port),
      "-o",
      "StrictHostKeyChecking=accept-new",
      "-o",
      "BatchMode=no",
      `${config.user}@${config.host}`,
      command,
    ],
    env: {
      ...process.env,
      SSHPASS: config.auth.password,
    },
  };
}
export function appendHistory(historyPath: any, entry: any): any {
  appendFileSync(historyPath, `${JSON.stringify(entry)}\n`, {
    encoding: "utf-8",
    mode: 0o600,
  });
}
export function buildHistoryEntry(
  config: any,
  command: any,
  startedAt: any,
  result: any,
): any {
  return {
    timestamp: startedAt.toISOString(),
    host: config.host,
    user: config.user,
    command,
    exitCode: result.timedOut ? null : result.exitCode,
    durationMs: result.durationMs,
    timedOut: result.timedOut,
  };
}
export function readStdin(stdin: any = process.stdin): any {
  return new Promise((resolveRead: any, rejectRead: any) => {
    const chunks: any[] = [];
    stdin.on("data", (chunk: any) => chunks.push(Buffer.from(chunk)));
    stdin.on("error", rejectRead);
    stdin.on("end", () => resolveRead(Buffer.concat(chunks).toString("utf-8")));
  });
}
export function runRemoteCommand(config: any, command: any): any {
  const invocation = buildSshpassInvocation(config, command);
  const started = Date.now();
  return new Promise((resolveRun: any, rejectRun: any) => {
    const child = spawn(invocation.command, invocation.args, {
      env: invocation.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout: any[] = [];
    const stderr: any[] = [];
    let timedOut = false;
    let killTimer: any = null;
    let settled = false;
    const cleanup = () => {
      clearTimeout(timeoutTimer);
      if (killTimer) clearTimeout(killTimer);
    };
    const timeoutTimer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      killTimer = setTimeout(() => child.kill("SIGKILL"), 5000);
    }, config.timeoutSeconds * 1000);
    child.stdout.on("data", (chunk: any) => stdout.push(Buffer.from(chunk)));
    child.stderr.on("data", (chunk: any) => stderr.push(Buffer.from(chunk)));
    child.on("error", (error: any) => {
      if (settled) return;
      settled = true;
      cleanup();
      rejectRun(error);
    });
    child.on("close", (code: any) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolveRun({
        exitCode: timedOut ? TIMEOUT_EXIT_CODE : (code ?? 1),
        stdout: Buffer.concat(stdout),
        stderr: Buffer.concat(stderr),
        durationMs: Date.now() - started,
        timedOut,
      });
    });
  });
}
export async function main(
  argv: readonly string[],
  streams: any = process,
): Promise<any> {
  if (argv.length !== 1) {
    streams.stderr.write(
      "Usage: node scripts/ssh-exec.mjs ~/.host/<host>.json\n",
    );
    return 1;
  }
  let configPath;
  let config;
  try {
    configPath = resolveHostConfigPath(argv[0]);
    config = parseHostConfig(readFileSync(configPath, "utf-8"));
  } catch (error: any) {
    streams.stderr.write(`Error: ${error.message}\n`);
    return 1;
  }
  const command = await readStdin(streams.stdin);
  if (command.trim().length === 0) {
    streams.stderr.write("Error: remote command must be provided on stdin.\n");
    return 1;
  }
  const historyPath = historyPathForConfig(configPath);
  const startedAt = new Date();
  if (!commandExists("sshpass")) {
    const result: Record<string, any> = {
      exitCode: 1,
      durationMs: Date.now() - startedAt.getTime(),
      timedOut: false,
    };
    appendHistory(
      historyPath,
      buildHistoryEntry(config, command, startedAt, result),
    );
    streams.stderr.write(
      "Error: sshpass is not installed. Run this first: remote-ssh-command-install-sshpass procedure.\n",
    );
    return 1;
  }
  let result;
  try {
    result = await runRemoteCommand(config, command);
  } catch (error: any) {
    result = {
      exitCode: 1,
      stdout: Buffer.alloc(0),
      stderr: Buffer.from(`Error: ${error.message}\n`),
      durationMs: Date.now() - startedAt.getTime(),
      timedOut: false,
    };
  }
  appendHistory(
    historyPath,
    buildHistoryEntry(config, command, startedAt, result),
  );
  if (result.stdout.length > 0) streams.stdout.write(result.stdout);
  if (result.stderr.length > 0) streams.stderr.write(result.stderr);
  return result.exitCode;
}
