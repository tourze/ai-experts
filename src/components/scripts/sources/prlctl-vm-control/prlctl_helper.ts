#!/usr/bin/env node

import { accessSync, constants } from "node:fs";
import { delimiter, join } from "node:path";
import { spawnSync } from "node:child_process";
import { downloadFile, parseFileTransferArgs, uploadFile } from "./file_transfer";
import { buildPowerShellCommand, decodeBytes, parsePowerShellEnvelope } from "./powershell_output";

class PrlctlError extends Error {}

function commandExists(command) {
  const pathValue = process.env.PATH ?? "";
  if (!pathValue) return false;

  const extensions = process.platform === "win32"
    ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM").split(";")
    : [""];

  for (const dir of pathValue.split(delimiter)) {
    if (!dir) continue;
    for (const ext of extensions) {
      const candidate = join(dir, process.platform === "win32" ? `${command}${ext}` : command);
      try {
        accessSync(candidate, constants.X_OK);
        return true;
      } catch {
        // Keep searching.
      }
    }
  }
  return false;
}

function runProcess(command, args, { check = true } = {}) {
  const result = spawnSync(command, args, {
    encoding: "buffer",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    if (result.error.code === "ENOENT") {
      throw new PrlctlError(`找不到可执行文件: ${command}`);
    }
    throw new PrlctlError(`执行命令失败: ${[command, ...args].join(" ")}\n错误: ${result.error.message}`);
  }

  const completed = {
    args: [command, ...args],
    returncode: result.status ?? 1,
    stdout: decodeBytes(result.stdout),
    stderr: decodeBytes(result.stderr),
  };

  if (check && completed.returncode !== 0) {
    throw new PrlctlError(formatFailure(completed.args, completed));
  }
  return completed;
}

function formatFailure(command, result) {
  const lines = [
    `命令失败: ${command.join(" ")}`,
    `退出码: ${result.returncode}`,
  ];
  if (result.stdout.trim()) lines.push(`stdout: ${result.stdout.trim()}`);
  if (result.stderr.trim()) lines.push(`stderr: ${result.stderr.trim()}`);
  return lines.join("\n");
}

function runPrlctl(args, options = {}) {
  if (!commandExists("prlctl")) {
    throw new PrlctlError("找不到 `prlctl`。请先安装 Parallels Desktop 并确认 CLI 已加入 PATH。");
  }
  return runProcess("prlctl", args, options);
}

function normalizeSelector(selector) {
  let trimmed = String(selector ?? "").trim();
  if (!trimmed) throw new PrlctlError("虚拟机选择器不能为空。");
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    trimmed = trimmed.slice(1, -1);
  }
  return trimmed.toLowerCase();
}

function parseJsonOutput(raw, context, expectedType) {
  let payload;
  try {
    payload = JSON.parse(raw || "[]");
  } catch (error) {
    throw new PrlctlError(`${context} 返回的 JSON 无法解析: ${error.message}`);
  }

  if (expectedType === "array" && !Array.isArray(payload)) {
    throw new PrlctlError(`${context} 返回格式异常。`);
  }
  if (expectedType === "object" && (payload === null || Array.isArray(payload) || typeof payload !== "object")) {
    throw new PrlctlError(`${context} 返回格式异常。`);
  }
  return payload;
}

function vmFromObject(value) {
  return {
    uuid: String(value.uuid ?? "").trim(),
    name: String(value.name ?? "").trim(),
    status: String(value.status ?? "").trim(),
    ip_configured: String(value.ip_configured ?? "").trim(),
  };
}

function loadVms() {
  const result = runPrlctl(["list", "-a", "-j"]);
  const payload = parseJsonOutput(result.stdout, "`prlctl list -a -j`", "array");
  const records = [];
  for (const item of payload) {
    if (item === null || Array.isArray(item) || typeof item !== "object") {
      throw new PrlctlError("`prlctl list -a -j` 返回的虚拟机条目不是对象。");
    }
    records.push(vmFromObject(item));
  }
  return records;
}

function resolveVm(selector) {
  const normalized = normalizeSelector(selector);
  const strippedSelector = String(selector).trim();
  const vms = loadVms();

  const exactUuid = vms.filter((item) => normalizeSelector(item.uuid) === normalized);
  if (exactUuid.length === 1) return exactUuid[0];

  const exactName = vms.filter((item) => item.name === strippedSelector);
  if (exactName.length === 1) return exactName[0];

  const exactNameCi = vms.filter((item) => item.name.toLowerCase() === strippedSelector.toLowerCase());
  if (exactNameCi.length === 1) return exactNameCi[0];

  const partial = vms.filter((item) =>
    item.name.toLowerCase().includes(normalized) || normalizeSelector(item.uuid).includes(normalized),
  );
  if (partial.length === 1) return partial[0];
  if (partial.length === 0) throw new PrlctlError(`找不到匹配的虚拟机: ${selector}`);

  const candidates = partial
    .sort((left, right) => left.name.toLowerCase().localeCompare(right.name.toLowerCase()))
    .map((item) => `- ${item.name} [${item.uuid}] (${item.status})`)
    .join("\n");
  throw new PrlctlError(`虚拟机选择器不唯一: ${selector}\n${candidates}`);
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function printVmTable(vms) {
  const rows = [
    ["UUID", "STATUS", "IP", "NAME"],
    ...vms.map((item) => [item.uuid, item.status, item.ip_configured || "-", item.name]),
  ];
  const widths = rows[0].map((_, index) => Math.max(...rows.map((row) => String(row[index]).length)));
  rows.forEach((row, rowIndex) => {
    console.log(row.map((cell, index) => String(cell).padEnd(widths[index])).join("  "));
    if (rowIndex === 0) console.log(widths.map((width) => "-".repeat(width)).join("  "));
  });
}

function buildGuestCommand(shellName, commandParts) {
  const parts = commandParts.filter((part) => part !== "--");
  if (parts.length === 0) {
    throw new PrlctlError("缺少客体命令。请在 `--` 后提供要执行的内容。");
  }
  if (shellName === "raw") return parts;

  const joined = parts.join(" ").trim();
  if (!joined) throw new PrlctlError("客体命令不能为空。");

  if (shellName === "powershell") {
    return buildPowerShellCommand(joined);
  }
  if (shellName === "cmd") return ["cmd.exe", "/d", "/s", "/c", joined];
  if (shellName === "bash") return ["bash", "-lc", joined];
  if (shellName === "sh") return ["sh", "-lc", joined];
  throw new PrlctlError(`不支持的 shell 类型: ${shellName}`);
}

function validateGuestLoginOptions(options) {
  if (options.currentUser && options.user) {
    throw new PrlctlError("`--current-user` 与 `--user` 不能同时使用。");
  }
  if (options.passwordEnv && !options.user) {
    throw new PrlctlError("`--password-env` 只能与 `--user` 一起使用。");
  }
  if (options.user && !options.passwordEnv) {
    throw new PrlctlError("使用 `--user` 时必须同时传入 `--password-env`，避免交互式密码提示。");
  }
}

function appendGuestLoginArgs(prlctlArgs, options) {
  if (options.currentUser) prlctlArgs.push("--current-user");
  if (options.user) prlctlArgs.push("--user", options.user);
  if (options.passwordEnv) {
    const password = process.env[options.passwordEnv];
    if (password === undefined) throw new PrlctlError(`环境变量不存在: ${options.passwordEnv}`);
    prlctlArgs.push("--password", password);
  }
  if (options.resolvePaths) prlctlArgs.push("--resolve-paths");
  if (options.advancedTerminal) prlctlArgs.push("--use-advanced-terminal");
}

function runGuestCommand(vm, options, commandParts, { check = false } = {}) {
  const prlctlArgs = ["exec", vm.uuid];
  appendGuestLoginArgs(prlctlArgs, options);
  prlctlArgs.push(...buildGuestCommand(options.shell, Array.isArray(commandParts) ? commandParts : [commandParts]));

  const result = runPrlctl(prlctlArgs, { check: false });
  let completed = result;
  if (options.shell === "powershell") {
    const decoded = parsePowerShellEnvelope(result);
    if (decoded?.error) throw new PrlctlError(decoded.error);
    if (decoded) completed = decoded;
  }
  if (check && completed.returncode !== 0) {
    throw new PrlctlError(formatFailure(completed.args, completed));
  }
  return completed;
}

function runGuestRawCommand(vm, options, commandParts, { check = false } = {}) {
  const parts = Array.isArray(commandParts) ? commandParts : [commandParts];
  if (parts.length === 0) throw new PrlctlError("缺少客体命令。");

  const prlctlArgs = ["exec", vm.uuid];
  appendGuestLoginArgs(prlctlArgs, options);
  prlctlArgs.push(...parts);

  const completed = runPrlctl(prlctlArgs, { check: false });
  if (check && completed.returncode !== 0) {
    throw new PrlctlError(formatFailure(completed.args, completed));
  }
  return completed;
}

function emitCommandResult(result) {
  if (result.stdout) {
    process.stdout.write(result.stdout);
    if (!result.stdout.endsWith("\n")) process.stdout.write("\n");
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
    if (!result.stderr.endsWith("\n")) process.stderr.write("\n");
  }
  return result.returncode;
}

function readOption(args, index) {
  if (index + 1 >= args.length) throw new PrlctlError(`缺少参数值: ${args[index]}`);
  return args[index + 1];
}

function parseList(args) {
  const options = { status: [], json: false };
  for (let i = 0; i < args.length; i += 1) {
    const current = args[i];
    if (current === "--json") options.json = true;
    else if (current === "--status") options.status.push(readOption(args, i++));
    else throw new PrlctlError(`未知参数: ${current}`);
  }
  return options;
}

function parseSelectorOptions(args) {
  if (args.length === 0) throw new PrlctlError("缺少虚拟机选择器。");
  const options = { selector: args[0], json: false };
  for (let i = 1; i < args.length; i += 1) {
    if (args[i] === "--json") options.json = true;
    else throw new PrlctlError(`未知参数: ${args[i]}`);
  }
  return options;
}

function parseExec(args) {
  if (args.length === 0) throw new PrlctlError("缺少虚拟机选择器。");
  const options = {
    selector: args[0],
    shell: "raw",
    currentUser: false,
    user: null,
    passwordEnv: null,
    resolvePaths: false,
    advancedTerminal: false,
    dryRun: false,
    command: [],
  };

  for (let i = 1; i < args.length; i += 1) {
    const current = args[i];
    if (current === "--") {
      options.command.push(...args.slice(i + 1));
      break;
    } else if (current === "--shell") {
      options.shell = readOption(args, i++);
    } else if (current === "--current-user") {
      options.currentUser = true;
    } else if (current === "--user") {
      options.user = readOption(args, i++);
    } else if (current === "--password-env") {
      options.passwordEnv = readOption(args, i++);
    } else if (current === "--resolve-paths") {
      options.resolvePaths = true;
    } else if (current === "--advanced-terminal") {
      options.advancedTerminal = true;
    } else if (current === "--dry-run") {
      options.dryRun = true;
    } else {
      options.command.push(current);
    }
  }
  return options;
}

function parsePower(args) {
  if (args.length < 2) throw new PrlctlError("缺少虚拟机选择器或电源动作。");
  const options = { selector: args[0], action: args[1], option: [], dryRun: false };
  for (let i = 2; i < args.length; i += 1) {
    if (args[i] === "--option") options.option.push(readOption(args, i++));
    else if (args[i] === "--dry-run") options.dryRun = true;
    else throw new PrlctlError(`未知参数: ${args[i]}`);
  }
  return options;
}

function commandList(args) {
  const options = parseList(args);
  let vms = loadVms();
  if (options.status.length > 0) {
    const selected = new Set(options.status.map((value) => value.trim().toLowerCase()).filter(Boolean));
    vms = vms.filter((item) => selected.has(item.status.toLowerCase()));
  }
  if (options.json) printJson(vms);
  else printVmTable(vms);
  return 0;
}

function commandResolve(args) {
  const options = parseSelectorOptions(args);
  const vm = resolveVm(options.selector);
  if (options.json) printJson(vm);
  else console.log(`${vm.uuid}\t${vm.status}\t${vm.name}`);
  return 0;
}

function commandStatus(args) {
  const options = parseSelectorOptions(args);
  const vm = resolveVm(options.selector);
  if (options.json) printJson({ uuid: vm.uuid, name: vm.name, status: vm.status });
  else console.log(vm.status);
  return 0;
}

function commandInfo(args) {
  const { selector } = parseSelectorOptions(args);
  const vm = resolveVm(selector);
  const result = runPrlctl(["list", "-i", "-j", vm.uuid]);
  const payload = parseJsonOutput(result.stdout, `\`prlctl list -i -j ${vm.uuid}\``, "array");
  if (payload.length === 0) throw new PrlctlError(`无法读取虚拟机详情: ${vm.name}`);
  if (payload[0] === null || Array.isArray(payload[0]) || typeof payload[0] !== "object") {
    throw new PrlctlError(`\`prlctl list -i -j ${vm.uuid}\` 返回的首个条目不是对象。`);
  }
  printJson(payload[0]);
  return 0;
}

function commandExec(args) {
  const options = parseExec(args);
  validateGuestLoginOptions(options);

  const vm = resolveVm(options.selector);
  if (options.dryRun) {
    const prlctlArgs = ["exec", vm.uuid];
    appendGuestLoginArgs(prlctlArgs, options);
    prlctlArgs.push(...buildGuestCommand(options.shell, options.command));
    printJson({ vm, command: ["prlctl", ...prlctlArgs] });
    return 0;
  }

  return emitCommandResult(runGuestCommand(vm, options, options.command, { check: false }));
}

function commandUpload(args) {
  const options = parseFileTransferArgs(args, "upload", PrlctlError);
  validateGuestLoginOptions(options);
  const vm = resolveVm(options.selector);
  printJson(uploadFile(vm, options, { runGuestCommand, runGuestRawCommand }, PrlctlError));
  return 0;
}

function commandDownload(args) {
  const options = parseFileTransferArgs(args, "download", PrlctlError);
  validateGuestLoginOptions(options);
  const vm = resolveVm(options.selector);
  printJson(downloadFile(vm, options, { runGuestCommand, runGuestRawCommand }, PrlctlError));
  return 0;
}

function commandPower(args) {
  const options = parsePower(args);
  const validActions = new Set(["start", "stop", "restart", "reset", "suspend", "resume"]);
  if (!validActions.has(options.action)) throw new PrlctlError(`不支持的电源动作: ${options.action}`);

  const vm = resolveVm(options.selector);
  const prlctlArgs = [options.action, vm.uuid, ...options.option];
  if (options.dryRun) {
    printJson({ vm, command: ["prlctl", ...prlctlArgs] });
    return 0;
  }
  return emitCommandResult(runPrlctl(prlctlArgs, { check: false }));
}

function commandSnapshots(args) {
  const { selector } = parseSelectorOptions(args);
  const vm = resolveVm(selector);
  const result = runPrlctl(["snapshot-list", vm.uuid, "-j"], { check: false });
  if (result.returncode !== 0) return emitCommandResult(result);
  printJson(parseJsonOutput(result.stdout, `\`prlctl snapshot-list ${vm.uuid} -j\``, "array"));
  return 0;
}

function printUsage() {
  console.error(`Usage:
  node prlctl_helper.mjs list [--json] [--status STATUS]
  node prlctl_helper.mjs resolve <selector> [--json]
  node prlctl_helper.mjs status <selector> [--json]
  node prlctl_helper.mjs info <selector>
  node prlctl_helper.mjs exec <selector> [options] -- <command>
  node prlctl_helper.mjs upload <selector> [options] -- <local-path> <guest-path>
  node prlctl_helper.mjs download <selector> [options] -- <guest-path> <local-path>
  node prlctl_helper.mjs power <selector> <action> [--option VALUE] [--dry-run]
  node prlctl_helper.mjs snapshots <selector>`);
}

function main(argv) {
  const [command, ...args] = argv;
  if (!command || command === "-h" || command === "--help") {
    printUsage();
    return command ? 0 : 1;
  }

  switch (command) {
    case "list":
      return commandList(args);
    case "resolve":
      return commandResolve(args);
    case "status":
      return commandStatus(args);
    case "info":
      return commandInfo(args);
    case "exec":
      return commandExec(args);
    case "upload":
      return commandUpload(args);
    case "download":
      return commandDownload(args);
    case "power":
      return commandPower(args);
    case "snapshots":
      return commandSnapshots(args);
    default:
      throw new PrlctlError(`未知命令: ${command}`);
  }
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  if (error instanceof PrlctlError) {
    console.error(error.message);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
