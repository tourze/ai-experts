import { spawnSync } from "node:child_process";

export function runCommand(cmd: any): any {
  const proc = spawnSync(cmd[0], cmd.slice(1), { stdio: "inherit" });
  const spawnError = proc.error as NodeJS.ErrnoException | undefined;
  if (spawnError?.code === "ENOENT") {
    throw new Error(`required command not found: ${cmd[0]}`);
  }
  if (proc.status !== 0) {
    throw new Error(`command failed (${proc.status ?? 1}): ${cmd.join(" ")}`);
  }
}
function writeChunkText(chunk: any, encoding: any): any {
  const textEncoding =
    typeof encoding === "string" ? (encoding as BufferEncoding) : "utf8";
  if (Buffer.isBuffer(chunk)) {
    return chunk.toString(textEncoding);
  }
  if (chunk instanceof Uint8Array) {
    return Buffer.from(chunk).toString(textEncoding);
  }
  return String(chunk);
}
export function captureMainOutput(mainFn: any, args: any = []): any {
  const previousStdoutWrite = process.stdout.write;
  const previousStderrWrite = process.stderr.write;
  const previousExitCode = process.exitCode;
  let stdout = "";
  let stderr = "";
  function captureStdout(
    chunk: any,
    encodingOrCallback?: any,
    callback?: any,
  ): any {
    stdout += writeChunkText(chunk, encodingOrCallback);
    const done =
      typeof encodingOrCallback === "function" ? encodingOrCallback : callback;
    if (done) done();
    return true;
  }
  function captureStderr(
    chunk: any,
    encodingOrCallback?: any,
    callback?: any,
  ): any {
    stderr += writeChunkText(chunk, encodingOrCallback);
    const done =
      typeof encodingOrCallback === "function" ? encodingOrCallback : callback;
    if (done) done();
    return true;
  }
  try {
    process.stdout.write = captureStdout as any;
    process.stderr.write = captureStderr as any;
    const status = mainFn(args);
    if (status && typeof status.then === "function") {
      throw new Error("async helper output capture is not supported");
    }
    return {
      status: typeof status === "number" ? status : 0,
      stdout,
      stderr,
    };
  } finally {
    process.stdout.write = previousStdoutWrite;
    process.stderr.write = previousStderrWrite;
    process.exitCode = previousExitCode;
  }
}
export function helperJson(mainFn: any, extraArgs: any = []): any {
  const proc = mainFn(extraArgs);
  if (proc.status !== 0) {
    const stderr = (proc.stderr ?? "").trim();
    if (
      stderr.includes("ModuleCache") &&
      stderr.includes("Operation not permitted")
    ) {
      throw new Error(
        "macOS native helper needs module-cache access; rerun with escalated permissions",
      );
    }
    throw new Error(
      stderr || (proc.stdout ?? "").trim() || "macOS native helper failed",
    );
  }
  try {
    return JSON.parse(proc.stdout);
  } catch {
    throw new Error(
      `macOS native helper returned invalid JSON: ${proc.stdout.trim()}`,
    );
  }
}
