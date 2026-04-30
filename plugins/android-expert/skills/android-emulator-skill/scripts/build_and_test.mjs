#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, statSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function findGradlew(startDir = process.cwd()) {
  let cwd = startDir;
  let previous = null;
  while (cwd !== previous) {
    const candidate = join(cwd, process.platform === "win32" ? "gradlew.bat" : "gradlew");
    if (existsSync(candidate)) return candidate;
    if (existsSync(join(cwd, ".git")) && statSync(join(cwd, ".git")).isDirectory()) break;
    previous = cwd;
    cwd = dirname(cwd);
  }
  return null;
}

export function buildGradleCommand(gradlew, task, clean = false, verbose = false) {
  const command = [gradlew, task];
  if (clean) command.splice(1, 0, "clean");
  if (!verbose) command.push("-q");
  return command;
}

export async function runGradleTask(task, { clean = false, verbose = false, startDir = process.cwd() } = {}) {
  const gradlew = findGradlew(startDir);
  if (!gradlew) {
    console.log("Error: gradlew not found in current directory tree.");
    return false;
  }

  const command = buildGradleCommand(gradlew, task, clean, verbose);
  console.log(`Running: ${command.join(" ")}`);

  return new Promise((resolve) => {
    const outputLines = [];
    const child = spawn(command[0], command.slice(1), {
      cwd: startDir,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const collect = (chunk) => {
      const text = chunk.toString("utf8");
      outputLines.push(...text.split(/(?<=\n)/));
      if (verbose) process.stdout.write(text);
    };

    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    child.on("error", (error) => {
      console.log(`Error running gradle: ${error.message}`);
      resolve(false);
    });
    child.on("close", (code) => {
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

function usage() {
  return `Build and test Android project.

Usage: node scripts/build_and_test.mjs [options]

Options:
  --task <task>          Gradle task to run (default: assembleDebug)
  --test                 Run connectedAndroidTest
  --clean                Run clean before task
  --verbose              Show full Gradle output
  --json                 Reserved for future structured output
  --help                 Show this help
`;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    task: "assembleDebug",
    test: false,
    clean: false,
    verbose: false,
    json: false,
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
    if (arg === "--json") {
      args.json = true;
      continue;
    }
    if (arg === "--task") {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) throw new Error("--task requires a value");
      args.task = value;
      index += 1;
      continue;
    }
    throw new Error(`unrecognized argument: ${arg}`);
  }
  return args;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  const task = args.test ? "connectedAndroidTest" : args.task;
  return (await runGradleTask(task, args)) ? 0 : 1;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = await main();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}
