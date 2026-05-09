import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";
const DEFAULT_CHUNK_SIZE = 1024;
const TRANSFER_SHELLS = new Set(["powershell", "bash", "sh"]);
function fail(ErrorClass: any, message: any): never {
  throw new ErrorClass(message);
}
function readValue(args: any, index: any, ErrorClass: any): any {
  if (index + 1 >= args.length) fail(ErrorClass, `缺少参数值: ${args[index]}`);
  return args[index + 1];
}
export function parseFileTransferArgs(
  args: any,
  direction: any,
  ErrorClass: any,
): any {
  if (args.length === 0) fail(ErrorClass, "缺少虚拟机选择器。");
  const options: Record<string, any> = {
    selector: args[0],
    shell: "powershell",
    currentUser: false,
    user: null,
    passwordEnv: null,
    resolvePaths: false,
    advancedTerminal: false,
    dryRun: false,
    chunkSize: DEFAULT_CHUNK_SIZE,
    localPath: null,
    guestPath: null,
  };
  const positional: any[] = [];
  for (let i = 1; i < args.length; i += 1) {
    const current = args[i];
    if (current === "--") {
      positional.push(...args.slice(i + 1));
      break;
    } else if (current === "--shell") {
      options.shell = readValue(args, i++, ErrorClass);
    } else if (current === "--current-user") {
      options.currentUser = true;
    } else if (current === "--user") {
      options.user = readValue(args, i++, ErrorClass);
    } else if (current === "--password-env") {
      options.passwordEnv = readValue(args, i++, ErrorClass);
    } else if (current === "--resolve-paths") {
      options.resolvePaths = true;
    } else if (current === "--advanced-terminal") {
      options.advancedTerminal = true;
    } else if (current === "--dry-run") {
      options.dryRun = true;
    } else if (current === "--chunk-size") {
      options.chunkSize = parseChunkSize(
        readValue(args, i++, ErrorClass),
        ErrorClass,
      );
    } else {
      positional.push(current);
    }
  }
  if (positional.length !== 2) {
    const shape =
      direction === "upload"
        ? "<local-path> <guest-path>"
        : "<guest-path> <local-path>";
    fail(ErrorClass, `文件传输参数必须是: ${shape}`);
  }
  if (direction === "upload") {
    [options.localPath, options.guestPath] = positional;
  } else {
    [options.guestPath, options.localPath] = positional;
  }
  return options;
}
function parseChunkSize(raw: any, ErrorClass: any): any {
  const value = Number.parseInt(raw, 10);
  if (!Number.isSafeInteger(value) || value <= 0)
    fail(ErrorClass, "`--chunk-size` 必须是正整数。");
  return value;
}
function assertTransferShell(shell: any, ErrorClass: any): any {
  if (!TRANSFER_SHELLS.has(shell)) {
    fail(
      ErrorClass,
      "文件传输仅支持 `--shell powershell`、`--shell bash` 或 `--shell sh`。",
    );
  }
}
function b64Utf16(value: any): any {
  return Buffer.from(value, "utf16le").toString("base64");
}
function psString(value: any): any {
  return `[Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('${b64Utf16(value)}'))`;
}
function shQuote(value: any): any {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}
function buildPowerShellUploadInit(guestPath: any): any {
  return [
    `$p=${psString(guestPath)}`,
    "$d=[IO.Path]::GetDirectoryName($p)",
    "if($d){[IO.Directory]::CreateDirectory($d)|Out-Null}",
    "[IO.File]::WriteAllBytes($p,[Convert]::FromBase64String(''))",
  ].join(";");
}
function buildPowerShellUploadChunk(guestPath: any, chunkBase64: any): any {
  return [
    `$p=${psString(guestPath)}`,
    `$b=[Convert]::FromBase64String('${chunkBase64}')`,
    "$fs=[IO.File]::Open($p,[IO.FileMode]::Append,[IO.FileAccess]::Write)",
    "try{$fs.Write($b,0,$b.Length)}finally{$fs.Dispose()}",
  ].join(";");
}
function buildPowerShellSizeCommand(guestPath: any): any {
  return `$p=${psString(guestPath)};if(!(Test-Path -LiteralPath $p -PathType Leaf)){throw \"Guest file not found: $p\"};(New-Object IO.FileInfo $p).Length`;
}
function buildPowerShellDownloadChunk(
  guestPath: any,
  offset: any,
  count: any,
): any {
  return [
    `$p=${psString(guestPath)}`,
    `$fs=[IO.File]::OpenRead($p)`,
    "try{",
    `[void]$fs.Seek(${offset},[IO.SeekOrigin]::Begin)`,
    `$b=New-Object byte[] ${count}`,
    "$r=$fs.Read($b,0,$b.Length)",
    "if($r -lt $b.Length){$o=New-Object byte[] $r;[Array]::Copy($b,0,$o,0,$r);$b=$o}",
    "[Convert]::ToBase64String($b)",
    "}finally{$fs.Dispose()}",
  ].join(";");
}
function buildRawPowerShellCommand(script: any): any {
  return [
    "powershell.exe",
    "-NoProfile",
    "-NonInteractive",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    script,
  ];
}
function buildShUploadInit(guestPath: any): any {
  const path = shQuote(guestPath);
  return `p=${path}; d=$(dirname -- "$p"); mkdir -p -- "$d"; : > "$p"`;
}
function buildShUploadChunk(guestPath: any, chunkBase64: any): any {
  return `printf %s ${shQuote(chunkBase64)} | base64 -d >> ${shQuote(guestPath)}`;
}
function buildShSizeCommand(guestPath: any): any {
  return `wc -c < ${shQuote(guestPath)} | tr -d '[:space:]'`;
}
function buildShDownloadChunk(guestPath: any, offset: any, count: any): any {
  return `dd if=${shQuote(guestPath)} bs=1 skip=${offset} count=${count} 2>/dev/null | base64 | tr -d '\\n'`;
}
function buildUploadInit(shell: any, guestPath: any): any {
  return shell === "powershell"
    ? buildPowerShellUploadInit(guestPath)
    : buildShUploadInit(guestPath);
}
function buildUploadChunk(shell: any, guestPath: any, chunkBase64: any): any {
  return shell === "powershell"
    ? buildPowerShellUploadChunk(guestPath, chunkBase64)
    : buildShUploadChunk(guestPath, chunkBase64);
}
function buildSizeCommand(shell: any, guestPath: any): any {
  return shell === "powershell"
    ? buildPowerShellSizeCommand(guestPath)
    : buildShSizeCommand(guestPath);
}
function buildDownloadChunk(
  shell: any,
  guestPath: any,
  offset: any,
  count: any,
): any {
  return shell === "powershell"
    ? buildPowerShellDownloadChunk(guestPath, offset, count)
    : buildShDownloadChunk(guestPath, offset, count);
}
function summarize(
  action: any,
  vm: any,
  options: any,
  bytes: any,
  chunks: any,
): any {
  return {
    action,
    vm,
    local_path: options.localPath,
    guest_path: options.guestPath,
    shell: options.shell,
    bytes,
    chunk_size: options.chunkSize,
    chunks,
  };
}
function runUploadCommand(
  vm: any,
  options: any,
  runners: any,
  command: any,
): any {
  if (options.shell === "powershell") {
    if (typeof runners.runGuestRawCommand !== "function") {
      throw new TypeError("PowerShell upload requires runGuestRawCommand");
    }
    return runners.runGuestRawCommand(
      vm,
      options,
      buildRawPowerShellCommand(command),
      { check: true },
    );
  }
  return runners.runGuestCommand(vm, options, command, { check: true });
}
export function uploadFile(
  vm: any,
  options: any,
  runners: any,
  ErrorClass: any,
): any {
  assertTransferShell(options.shell, ErrorClass);
  let file: Buffer;
  try {
    file = readFileSync(options.localPath);
  } catch (error: any) {
    fail(
      ErrorClass,
      `无法读取本地文件: ${options.localPath}\n错误: ${error.message}`,
    );
  }
  const chunks = Math.ceil(file.length / options.chunkSize);
  if (options.dryRun)
    return summarize("upload", vm, options, file.length, chunks);
  runUploadCommand(
    vm,
    options,
    runners,
    buildUploadInit(options.shell, options.guestPath),
  );
  for (let offset = 0; offset < file.length; offset += options.chunkSize) {
    const chunk = file
      .subarray(offset, offset + options.chunkSize)
      .toString("base64");
    runUploadCommand(
      vm,
      options,
      runners,
      buildUploadChunk(options.shell, options.guestPath, chunk),
    );
  }
  return summarize("upload", vm, options, file.length, chunks);
}
export function downloadFile(
  vm: any,
  options: any,
  runners: any,
  ErrorClass: any,
): any {
  assertTransferShell(options.shell, ErrorClass);
  if (options.dryRun) return summarize("download", vm, options, null, null);
  const sizeResult = runners.runGuestCommand(
    vm,
    options,
    buildSizeCommand(options.shell, options.guestPath),
    {
      check: true,
    },
  );
  const sizeText = sizeResult.stdout.trim();
  if (!/^\d+$/.test(sizeText)) {
    fail(ErrorClass, `客体文件大小返回异常: ${sizeText || "(empty)"}`);
  }
  const bytes = Number.parseInt(sizeText, 10);
  if (!Number.isSafeInteger(bytes))
    fail(ErrorClass, `客体文件过大，无法安全下载: ${sizeText}`);
  const parent = dirname(options.localPath);
  if (parent && parent !== ".") mkdirSync(parent, { recursive: true });
  writeFileSync(options.localPath, Buffer.alloc(0));
  let chunks = 0;
  for (let offset = 0; offset < bytes; offset += options.chunkSize) {
    const count = Math.min(options.chunkSize, bytes - offset);
    const result = runners.runGuestCommand(
      vm,
      options,
      buildDownloadChunk(options.shell, options.guestPath, offset, count),
      { check: true },
    );
    appendFileSync(
      options.localPath,
      Buffer.from(result.stdout.trim(), "base64"),
    );
    chunks += 1;
  }
  const written = statSync(options.localPath).size;
  if (written !== bytes)
    fail(ErrorClass, `下载后的文件大小不匹配: 期望 ${bytes}，实际 ${written}`);
  return summarize("download", vm, options, bytes, chunks);
}
