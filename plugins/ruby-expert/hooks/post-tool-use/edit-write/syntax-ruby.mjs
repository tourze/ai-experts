import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cmd, hasCommand, matchExt, matchName } from "./_utils.mjs";

const RUBY_EXTENSIONS = [".rb", ".rake", ".gemspec", ".ru"];
const RUBY_FILE_NAMES = [
  "Gemfile",
  "Rakefile",
  "Guardfile",
  "Capfile",
  "Fastfile",
  "Podfile",
  "Appraisals",
  "config.ru",
];

function matches(filePath) {
  return matchExt(filePath, RUBY_EXTENSIONS) || matchName(filePath, RUBY_FILE_NAMES);
}

async function check(filePath) {
  if (!hasCommand("ruby")) return null;
  try {
    execFileSync(cmd("ruby"), ["-c", filePath], { stdio: "pipe", timeout: 15000 });
    return null;
  } catch (err) {
    const output = (err.stdout?.toString() || "") + (err.stderr?.toString() || "");
    return output.trim() ? { lang: "Ruby Syntax", message: output } : null;
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
