import { spawnSync } from "node:child_process";

function pythonCommand() {
  return process.env.PYTHON ?? process.env.PYTHON3 ?? (process.platform === "win32" ? "python" : "python3");
}

export function runPythonModule(moduleName, args, skillsDir) {
  const code = [
    "import sys",
    `sys.path.insert(0, ${JSON.stringify(skillsDir)})`,
    `from ${moduleName} import main`,
    "raise SystemExit(main())",
  ].join("; ");

  const result = spawnSync(pythonCommand(), ["-c", code, ...args], {
    stdio: "inherit",
  });

  if (result.error) {
    console.error(result.error.message);
    return 1;
  }
  if (result.signal) {
    console.error(`Python process terminated by ${result.signal}`);
    return 1;
  }
  return result.status ?? 1;
}
