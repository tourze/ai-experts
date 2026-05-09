#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { readdirSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BuildRunner,
  OutputFormatter,
  XCResultCache,
  XCResultParser,
} from "./xcode/index";

export const procedure = defineCliProcedure({
  id: "ios-simulator-skill-build-and-test",
  entry: procedureEntry(import.meta.url),
  description:
    "构建和测试 Xcode 项目：自动查找 xcodeproj/workspace、执行构建/测试 task、通过 xcresult 渐进式披露错误详情。",
  owners: { skillIds: ["ios-simulator-skill"] },
  target: "scripts/build_and_test.mjs",
  runtime: "node",
  params: [
    {
      flag: "--project",
      type: "路径",
      description: ".xcodeproj 文件路径",
      required: false,
    },
    {
      flag: "--workspace",
      type: "路径",
      description: ".xcworkspace 文件路径",
      required: false,
    },
    {
      flag: "--scheme",
      type: "字符串",
      description: "构建 scheme（自动检测）",
      required: false,
    },
    {
      flag: "--configuration",
      type: "字符串",
      description: "构建配置（默认 Debug）",
      required: false,
    },
    {
      flag: "--simulator",
      type: "字符串",
      description: "模拟器名称",
      required: false,
    },
    {
      flag: "--clean",
      type: "",
      description: "构建前先 clean，传此标志即启用",
      required: false,
    },
    { flag: "--test", type: "", description: "运行测试", required: false },
    {
      flag: "--suite",
      type: "字符串",
      description: "指定测试套件",
      required: false,
    },
    {
      flag: "--get-errors",
      type: "字符串",
      description: "从 xcresult 获取错误详情",
      required: false,
    },
    {
      flag: "--get-warnings",
      type: "字符串",
      description: "从 xcresult 获取警告详情",
      required: false,
    },
    {
      flag: "--get-log",
      type: "字符串",
      description: "从 xcresult 获取构建日志",
      required: false,
    },
    {
      flag: "--get-all",
      type: "字符串",
      description: "从 xcresult 获取全部详情",
      required: false,
    },
    {
      flag: "--list-xcresults",
      type: "",
      description: "列出最近的 xcresult 包",
      required: false,
    },
    {
      flag: "--verbose",
      type: "",
      description: "显示详细输出，传此标志即启用",
      required: false,
    },
    {
      flag: "--json",
      type: "",
      description: "输出为 JSON，传此标志即启用",
      required: false,
    },
  ],

  exampleArgs: { args: ["--project", "MyApp.xcodeproj", "--test"] },
});

export function usage(): any {
  return `Build and test Xcode projects with progressive disclosure.

Usage: node scripts/build_and_test.mjs [options]

Build/Test Options:
  --project <path>        Path to .xcodeproj file
  --workspace <path>      Path to .xcworkspace file
  --scheme <name>         Build scheme (auto-detected if omitted)
  --configuration <name>  Build configuration (default: Debug)
  --simulator <name>      Simulator name
  --clean                 Clean before building
  --test                  Run tests
  --suite <name>          Specific test suite to run

Progressive Disclosure Options:
  --get-errors <id>       Get error details from xcresult
  --get-warnings <id>     Get warning details from xcresult
  --get-log <id>          Get build log from xcresult
  --get-all <id>          Get all details from xcresult
  --list-xcresults        List recent xcresult bundles

Output Options:
  --verbose               Show detailed output
  --json                  Output as JSON
  --help, -h              Show this help

Examples:
  node scripts/build_and_test.mjs --project MyApp.xcodeproj
  node scripts/build_and_test.mjs --project MyApp.xcodeproj --test
  node scripts/build_and_test.mjs --get-errors xcresult-20251018-143052
  node scripts/build_and_test.mjs --get-all xcresult-20251018-143052 --json
  node scripts/build_and_test.mjs --list-xcresults
`;
}
function requireValue(argv: readonly string[], index: any, option: any): any {
  const value = argv[index + 1];
  if (value == null || value.startsWith("--")) {
    throw new Error(`${option} requires a value`);
  }
  return value;
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    project: null,
    workspace: null,
    scheme: null,
    configuration: "Debug",
    simulator: null,
    clean: false,
    test: false,
    suite: null,
    getErrors: null,
    getWarnings: null,
    getLog: null,
    getAll: null,
    listXcresults: false,
    verbose: false,
    json: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--project") {
      args.project = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--workspace") {
      args.workspace = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--scheme") {
      args.scheme = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--configuration") {
      args.configuration = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--simulator") {
      args.simulator = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--clean") {
      args.clean = true;
    } else if (arg === "--test") {
      args.test = true;
    } else if (arg === "--suite") {
      args.suite = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--get-errors") {
      args.getErrors = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--get-warnings") {
      args.getWarnings = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--get-log") {
      args.getLog = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--get-all") {
      args.getAll = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--list-xcresults") {
      args.listXcresults = true;
    } else if (arg === "--verbose") {
      args.verbose = true;
    } else if (arg === "--json") {
      args.json = true;
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  if (args.project && args.workspace) {
    throw new Error("--project and --workspace are mutually exclusive");
  }
  return args;
}
function findProjectOrWorkspace(cwd: any = process.cwd()): any {
  const entries = readdirSync(cwd, { withFileTypes: true });
  const workspace = entries.find(
    (entry: any) => entry.isDirectory() && entry.name.endsWith(".xcworkspace"),
  );
  if (workspace) return { workspace: join(cwd, workspace.name) };
  const project = entries.find(
    (entry: any) => entry.isDirectory() && entry.name.endsWith(".xcodeproj"),
  );
  if (project) return { project: join(cwd, project.name) };
  return {};
}
function outputJson(data: any): any {
  console.log(JSON.stringify(data, null, 2));
}
function handleList(cache: any, json: any): any {
  const xcresults = cache.list();
  if (json) {
    outputJson(xcresults);
  } else if (!xcresults.length) {
    console.log("No xcresult bundles found");
  } else {
    console.log(`Recent XCResult bundles (${xcresults.length}):`);
    console.log("");
    for (const xcresult of xcresults) {
      console.log(`  ${xcresult.id}`);
      console.log(`    Created: ${xcresult.created}`);
      console.log(`    Size: ${xcresult.size_mb} MB`);
      console.log("");
    }
  }
  return 0;
}
function handleDisclosure(args: any, cache: any, xcresultId: any): any {
  const xcresultPath = cache.getPath(xcresultId);
  if (!cache.exists(xcresultId)) {
    console.error(`Error: XCResult bundle not found: ${xcresultId}`);
    console.error("Use --list-xcresults to see available bundles");
    return 1;
  }
  const xcresultParser = new XCResultParser(
    xcresultPath,
    cache.getStderr(xcresultId),
  );
  if (args.getErrors) {
    const errors = xcresultParser.getErrors();
    if (args.json) outputJson(errors);
    else console.log(OutputFormatter.formatErrors(errors));
    return 0;
  }
  if (args.getWarnings) {
    const warnings = xcresultParser.getWarnings();
    if (args.json) outputJson(warnings);
    else console.log(OutputFormatter.formatWarnings(warnings));
    return 0;
  }
  if (args.getLog) {
    const log = xcresultParser.getBuildLog();
    if (!log) {
      console.error("No build log available");
      return 1;
    }
    console.log(OutputFormatter.formatLog(log));
    return 0;
  }
  const [errorCount, warningCount] = xcresultParser.countIssues();
  const errors = xcresultParser.getErrors();
  const warnings = xcresultParser.getWarnings();
  const buildLog = xcresultParser.getBuildLog();
  if (args.json) {
    outputJson({
      xcresult_id: xcresultId,
      error_count: errorCount,
      warning_count: warningCount,
      errors,
      warnings,
      log_preview: buildLog ? buildLog.slice(0, 1000) : null,
    });
    return 0;
  }
  console.log(`XCResult: ${xcresultId}`);
  console.log(`Errors: ${errorCount}, Warnings: ${warningCount}`);
  console.log("");
  if (errors.length) {
    console.log(OutputFormatter.formatErrors(errors, 10));
    console.log("");
  }
  if (warnings.length) {
    console.log(OutputFormatter.formatWarnings(warnings, 10));
    console.log("");
  }
  if (buildLog) {
    console.log("Build Log (last 30 lines):");
    console.log(OutputFormatter.formatLog(buildLog, 30));
  }
  return 0;
}
export async function main(argv: readonly string[]): Promise<any> {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  const cache = new XCResultCache();
  if (args.listXcresults) {
    return handleList(cache, args.json);
  }
  const disclosureId =
    args.getErrors || args.getWarnings || args.getLog || args.getAll;
  if (disclosureId) {
    return handleDisclosure(args, cache, disclosureId);
  }
  if (!args.project && !args.workspace) {
    Object.assign(args, findProjectOrWorkspace());
    if (!args.project && !args.workspace) {
      console.error(
        "Error: No project or workspace specified and none found in current directory",
      );
      return 2;
    }
  }
  const builder = new BuildRunner({
    projectPath: args.project,
    workspacePath: args.workspace,
    scheme: args.scheme,
    configuration: args.configuration,
    simulator: args.simulator,
    cache,
  });
  const [success, xcresultId, stderr] = args.test
    ? builder.test(args.suite)
    : builder.build(args.clean);
  if (!xcresultId && !stderr) {
    console.error(
      "Error: Build/test failed without creating xcresult or error output",
    );
    return 1;
  }
  if (xcresultId && stderr) {
    cache.saveStderr(xcresultId, stderr);
  }
  const xcresultPath = xcresultId ? cache.getPath(xcresultId) : null;
  const xcresultParser = new XCResultParser(xcresultPath, stderr);
  const [errorCount, warningCount] = xcresultParser.countIssues();
  const status = success ? "SUCCESS" : "FAILED";
  const errors = success ? null : xcresultParser.getErrors();
  const hints = errors?.length ? OutputFormatter.generateHints(errors) : null;
  let testInfo: any = null;
  let failedTests: any = null;
  if (args.test && xcresultPath) {
    const testResults = xcresultParser.getTestResults();
    if (testResults) {
      testInfo = {
        total: testResults.total || 0,
        passed: testResults.passed || 0,
        failed: testResults.failed || 0,
        duration: testResults.duration || 0.0,
      };
    }
    if (!success) {
      failedTests = xcresultParser.getFailedTests();
    }
  }
  if (args.verbose) {
    console.log(
      OutputFormatter.formatVerbose({
        status,
        errorCount,
        warningCount,
        xcresultId: xcresultId || "N/A",
        errors: errorCount > 0 ? errors : null,
        warnings: warningCount > 0 ? xcresultParser.getWarnings() : null,
        testInfo,
      }),
    );
  } else if (args.json) {
    const data: Record<string, any> = {
      success,
      xcresult_id: xcresultId || null,
      error_count: errorCount,
      warning_count: warningCount,
    };
    if (testInfo) data.test_info = testInfo;
    if (!success) {
      if (errors?.length) data.errors = errors.slice(0, 10);
      if (failedTests?.length) data.failed_tests = failedTests.slice(0, 10);
    }
    if (hints?.length) data.hints = hints;
    outputJson(data);
  } else {
    console.log(
      OutputFormatter.formatMinimal({
        status,
        errorCount,
        warningCount,
        xcresultId: xcresultId || "N/A",
        testInfo,
        hints,
        errors,
        failedTests,
      }),
    );
  }
  return success ? 0 : 1;
}
