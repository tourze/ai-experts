import { existsSync } from "fs";
import { execFileSync } from "child_process";
import { hasCommand, cmd, matchExt } from "./_utils.mjs";

function matches(filePath) {
  return matchExt(filePath, [".yaml", ".yml"]);
}

async function check(filePath) {
  const ruby = hasCommand("ruby") ? "ruby" : null;
  try {
    if (ruby) {
      execFileSync(cmd(ruby), [
        "-e",
        'require "psych"; Psych.parse_stream(File.read(ARGV[0], encoding: "UTF-8"))',
        filePath,
      ], { stdio: "pipe", timeout: 10000 });
      return null;
    }

    const py = hasCommand("python3") ? "python3" : hasCommand("python") ? "python" : null;
    if (!py) return null;

    execFileSync(cmd(py), [
      "-c",
      `import sys
from pathlib import Path
try:
 import yaml
except ImportError:
 sys.exit(0)
with Path(sys.argv[1]).open("r", encoding="utf-8") as fh:
 list(yaml.safe_load_all(fh))`,
      filePath,
    ], { stdio: "pipe", timeout: 10000 });
    return null;
  } catch (err) {
    const output = (err.stdout?.toString() || "") + (err.stderr?.toString() || "");
    return output.trim() ? { lang: "YAML Syntax", message: output } : null;
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
