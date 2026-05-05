import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { hasCommand, cmd, matchExt } from "./python-_utils.mjs";

function matches(filePath) {
  return matchExt(filePath, [".py", ".pyi"]);
}

function findPythonBinary() {
  if (hasCommand("python3")) {
    return "python3";
  }
  if (hasCommand("python")) {
    return "python";
  }
  return null;
}

async function check(filePath) {
  const py = findPythonBinary();
  if (!py) return null;
  try {
    execFileSync(cmd(py), ["-m", "py_compile", filePath], { stdio: "pipe", timeout: 15000 });
    return null;
  } catch (err) {
    const output = (err.stdout?.toString() || "") + (err.stderr?.toString() || "");
    return output.trim() ? { lang: "Python Syntax", message: output } : null;
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
