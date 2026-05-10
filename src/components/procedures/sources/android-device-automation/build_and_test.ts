#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { spawn } from "node:child_process";
import { existsSync, statSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const procedure = defineCliProcedure({
  id: "android-device-automation-build-and-test",
  entry: procedureEntry(import.meta.url),
  description:
    "构建和测试 Android Gradle 项目：查找 gradlew、执行 Gradle task、收集输出。",
  owners: { skillIds: ["android-device-automation"] },
  target: "scripts/build_and_test.mjs",
  runtime: "node",
  params: [
    {
      flag: "--task",
      type: "字符串",
      description: "要执行的 Gradle task",
      required: false,
    },
    {
      flag: "--test",
      type: "",
      description: "覆盖为 connectedAndroidTest，传此标志即启用",
      required: false,
    },
    {
      flag: "--clean",
      type: "",
      description: "执行前先 clean，传此标志即启用",
      required: false,
    },
    {
      flag: "--verbose",
      type: "",
      description: "显示完整 Gradle 输出，传此标志即启用",
      required: false,
    },
  ],

  exampleArgs: { args: ["--task", "assembleDebug"] },
});

export function findGradlew(startDir: any = process.cwd()): any {
  let cwd = startDir;
  let previous: any = null;
  while (cwd !== previous) {
    const candidate = join(
      cwd,
      process.platform === "win32" ? "gradlew.bat" : "gradlew",
    );
    if (existsSync(candidate)) return candidate;
    if (
      existsSync(join(cwd, ".git")) &&
      statSync(join(cwd, ".git")).isDirectory()
    )
      break;
    previous = cwd;
    cwd = dirname(cwd);
  }
  return null;
}
export function buildGradleCommand(
  gradlew: any,
  task: any,
  clean: any = false,
  verbose: any = false,
): any {
  const command: any[] = [gradlew, task];
  if (clean) command.splice(1, 0, "clean");
  if (!verbose) command.push("-q");
  return command;
}
export async function runGradleTask(
  task: any,
  { clean = false, verbose = false, startDir = process.cwd() }: any = {},
): Promise<any> {
  const gradlew = findGradlew(startDir);
  if (!gradlew) {
    console.log("Error: gradlew not found in current directory tree.");
    return false;
  }
  const command = buildGradleCommand(gradlew, task, clean, verbose);
  console.log(`Running: ${command.join(" ")}`);
  return new Promise((resolve: any) => {
    const outputLines: any[] = [];
    const child = spawn(command[0], command.slice(1), {
      cwd: startDir,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const collect = (chunk: any) => {
      const text = chunk.toString("utf8");
      outputLines.push(...text.split(/(?<=\n)/));
      if (verbose) process.stdout.write(text);
    };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    child.on("error", (error: any) => {
      console.log(`Error running gradle: ${error.message}`);
      resolve(false);
    });
    child.on("close", (code: any) => {
      if (code === 0) {
        console.log(`Build Successful: ${task}`);
        resolve(true);
        return;
      }
      console.log(`Build Failed: ${task}`);
      if (!verbose) {
        console.log("Error details (last 20 lines):");
        console.log(outputLines.slice(-20).join(""));
      }
      resolve(false);
    });
  });
}
function usage(): any {
  return `Build and test Android project.

Usage: node scripts/build_and_test.mjs [options]

Options:
  --task <task>          Gradle task to run (default: assembleDebug)
  --test                 Run connectedAndroidTest
  --clean                Run clean before task
  --verbose              Show full Gradle output
  --help                 Show this help
`;
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    task: "assembleDebug",
    test: false,
    clean: false,
    verbose: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (arg === "--test") {
      args.test = true;
      continue;
    }
    if (arg === "--clean") {
      args.clean = true;
      continue;
    }
    if (arg === "--verbose") {
      args.verbose = true;
      continue;
    }
    if (arg === "--task") {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--"))
        throw new Error("--task requires a value");
      args.task = value;
      index += 1;
      continue;
    }
    throw new Error(`unrecognized argument: ${arg}`);
  }
  return args;
}
export async function main(argv: readonly string[]): Promise<any> {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  const task = args.test ? "connectedAndroidTest" : args.task;
  return (await runGradleTask(task, args)) ? 0 : 1;
}
