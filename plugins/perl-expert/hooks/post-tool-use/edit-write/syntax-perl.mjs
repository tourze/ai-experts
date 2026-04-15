import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { hasCommand, cmd, matchExt, matchName } from "./_utils.mjs";

const PERL_EXTENSIONS = [".pl", ".pm", ".t", ".psgi"];
const PERL_FILE_NAMES = [
  "Makefile.PL",
  "Build.PL",
];

// macOS sandbox: deny network/file-write, allow reads — prevents BEGIN{} side effects
const SANDBOX_PROFILE =
  "(version 1)(deny default)(allow process-exec)(allow process-fork)" +
  "(allow file-read*)(allow sysctl-read)(allow mach-lookup)";

function matches(filePath) {
  return matchExt(filePath, PERL_EXTENSIONS) || matchName(filePath, PERL_FILE_NAMES);
}

async function check(filePath) {
  if (!hasCommand("perl")) return null;
  const safeEnv = { ...process.env, PERL5OPT: "", PERL5LIB: "" };
  const opts = { stdio: "pipe", timeout: 15000, env: safeEnv };
  try {
    if (process.platform === "darwin" && hasCommand("sandbox-exec")) {
      execFileSync(
        cmd("sandbox-exec"),
        ["-p", SANDBOX_PROFILE, cmd("perl"), "-c", filePath],
        opts,
      );
    } else {
      execFileSync(cmd("perl"), ["-c", filePath], opts);
    }
    return null;
  } catch (err) {
    const output = (err.stdout?.toString() || "") + (err.stderr?.toString() || "");
    return output.trim() ? { lang: "Perl Syntax", message: output } : null;
  }
}

export async function run(payload) {
  const filePath = payload?.tool_input?.file_path;
  if (!filePath || !existsSync(filePath)) return null;
  if (!matches(filePath)) return null;
  const result = await check(filePath);
  if (!result) return null;
  return {
    decision: "block",
    reason: `[${result.lang}] ${result.message.trim()}\n\n请修复后再继续。`,
  };
}
