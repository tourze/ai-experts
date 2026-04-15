import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { hasCommand, cmd, matchExt, matchName } from "./_utils.mjs";

const PERL_EXTENSIONS = [".pl", ".pm", ".t", ".psgi"];
const PERL_FILE_NAMES = [
  "Makefile.PL",
  "Build.PL",
];

function matches(filePath) {
  return matchExt(filePath, PERL_EXTENSIONS) || matchName(filePath, PERL_FILE_NAMES);
}

async function check(filePath) {
  if (!hasCommand("perl")) return null;
  try {
    execFileSync(cmd("perl"), ["-c", filePath], { stdio: "pipe", timeout: 15000 });
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
