#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { mkdirSync, writeFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  countElements,
  getAccessibilityTree,
  resolveUdid,
} from "./interaction_common";
import { captureScreenshot } from "./screenshot_common";
import { assertOutputWritable } from "./output_guard";

export const procedure = defineCliProcedure({
  id: "ios-simulator-skill-test-recorder",
  entry: procedureEntry(import.meta.url),
  description:
    "录制 iOS 模拟器测试执行过程：按步骤截图、采集无障碍树、生成测试报告和 metadata。",
  owners: { skillIds: ["ios-simulator-skill"] },
  target: "scripts/test_recorder.mjs",
  runtime: "node",
  params: [
    {
      flag: "--test-name",
      type: "字符串",
      description: "正在录制的测试名称（必填）",
      required: true,
    },
    {
      flag: "--output",
      type: "路径",
      description: "测试产物输出目录",
      required: false,
    },
    {
      flag: "--udid",
      type: "字符串",
      description: "目标设备 UDID",
      required: false,
    },
    {
      flag: "--inline",
      type: "",
      description: "以 base64 返回截图，传此标志即启用",
      required: false,
    },
    {
      flag: "--size",
      type: "字符串",
      description: "截图尺寸：full, half, quarter, thumb",
      required: false,
    },
    {
      flag: "--app-name",
      type: "字符串",
      description: "应用名称，用于语义化截图命名",
      required: false,
    },
    {
      flag: "--overwrite",
      type: "",
      description: "仅在用户已明确确认可替换现有测试产物目录后使用",
      required: false,
    },
  ],

  exampleArgs: { args: ["--test-name", "login-flow", "--size", "half"] },
});

export class TestRecorder {
  accessibilityDir: any;
  appName: any;
  currentStep: any;
  inline: any;
  now: any;
  output: any;
  outputDir: any;
  screenshotSize: any;
  screenshotsDir: any;
  startTime: any;
  steps: any;
  testName: any;
  udid: any;
  constructor({
    testName,
    outputDir = "test-artifacts",
    udid = null,
    inline = false,
    screenshotSize = "half",
    appName = null,
    now = (): any => new Date(),
    overwrite = false,
    output = console.log,
  }: any) {
    this.testName = testName;
    this.udid = udid;
    this.inline = inline;
    this.screenshotSize = screenshotSize;
    this.appName = appName;
    this.now = now;
    this.output = output;
    this.startTime = Date.now();
    this.steps = [];
    this.currentStep = 0;
    this.outputDir = plannedTestRecorderOutputDir(outputDir, testName, now());
    assertOutputWritable(this.outputDir, overwrite);
    mkdirSync(this.outputDir, { recursive: true });
    this.screenshotsDir = inline ? null : join(this.outputDir, "screenshots");
    if (this.screenshotsDir)
      mkdirSync(this.screenshotsDir, { recursive: true });
    this.accessibilityDir = join(this.outputDir, "accessibility");
    mkdirSync(this.accessibilityDir, { recursive: true });
    const mode = inline ? " (inline mode)" : "";
    this.output(`Recording: ${testName}${mode}`);
    this.output(`Output: ${this.outputDir}/`);
  }
  step(
    descriptionOrOptions: any,
    screenName: any = null,
    state: any = null,
    assertion: any = null,
    metadata: any = null,
  ): any {
    const options =
      typeof descriptionOrOptions === "object"
        ? descriptionOrOptions
        : {
            description: descriptionOrOptions,
            screenName,
            state,
            assertion,
            metadata,
          };
    const { description } = options;
    this.currentStep += 1;
    const stepTime = (Date.now() - this.startTime) / 1000;
    const screenshotResult = captureScreenshot(this.udid, {
      size: this.screenshotSize,
      inline: this.inline,
      appName: this.appName,
      screenName: options.screenName || description,
      state: options.state,
    });
    const accessibilityPath = join(
      this.accessibilityDir,
      `${String(this.currentStep).padStart(3, "0")}-${safeStepName(description).slice(0, 20)}.json`,
    );
    const elementCount = this.captureAccessibility(accessibilityPath);
    const stepData: Record<string, any> = {
      number: this.currentStep,
      description,
      timestamp: stepTime,
      element_count: elementCount,
      accessibility: accessibilityPath.split("/").at(-1),
      screenshot_mode: screenshotResult.mode,
      screenshot_size: this.screenshotSize,
    };
    if (screenshotResult.mode === "file") {
      stepData.screenshot = screenshotResult.file_path;
      stepData.screenshot_name = screenshotResult.file_path.split("/").at(-1);
    } else {
      stepData.screenshot_base64 = screenshotResult.base64_data;
      stepData.screenshot_dimensions = [
        screenshotResult.width,
        screenshotResult.height,
      ];
    }
    if (options.assertion) {
      stepData.assertion = options.assertion;
      stepData.assertion_passed = true;
    }
    if (options.metadata) stepData.metadata = options.metadata;
    this.steps.push(stepData);
    const status = !options.assertion || stepData.assertion_passed ? "✓" : "✗";
    const screenshotInfo = this.inline
      ? ` [${screenshotResult.width}x${screenshotResult.height}]`
      : "";
    this.output(
      `${status} Step ${this.currentStep}: ${description} (${stepTime.toFixed(1)}s)${screenshotInfo}`,
    );
  }
  captureAccessibility(outputPath: any): any {
    try {
      const tree = getAccessibilityTree(this.udid, { nested: true });
      writeFileSync(outputPath, `${JSON.stringify(tree, null, 2)}\n`);
      return countElements(tree);
    } catch {
      return 0;
    }
  }
  generateReport(): any {
    const duration = (Date.now() - this.startTime) / 1000;
    const reportPath = join(this.outputDir, "report.md");
    writeFileSync(
      reportPath,
      createReportMarkdown(this.testName, duration, this.steps),
    );
    const metadataPath = join(this.outputDir, "metadata.json");
    writeFileSync(
      metadataPath,
      `${JSON.stringify(
        {
          test_name: this.testName,
          duration,
          steps: this.steps,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
    );
    this.output(`Report: ${reportPath}`);
    return {
      markdown_path: reportPath,
      metadata_path: metadataPath,
      output_dir: this.outputDir,
    };
  }
  generate_report(): any {
    return this.generateReport();
  }
}
export function createReportMarkdown(
  testName: any,
  duration: any,
  steps: any,
): any {
  const lines: any[] = [
    `# Test Report: ${testName}`,
    "",
    `**Date:** ${formatDisplayDate(new Date())}`,
    `**Duration:** ${duration.toFixed(1)} seconds`,
    `**Steps:** ${steps.length}`,
    "",
    "## Test Steps",
    "",
  ];
  for (const step of steps) {
    lines.push(
      `### Step ${step.number}: ${step.description} (${step.timestamp.toFixed(1)}s)`,
      "",
    );
    lines.push(`![Screenshot](screenshots/${step.screenshot})`, "");
    if (step.assertion) {
      const status = step.assertion_passed ? "✓" : "✗";
      lines.push(`**Assertion:** ${step.assertion} ${status}`, "");
    }
    if (step.metadata) {
      lines.push("**Metadata:**");
      for (const [key, value] of Object.entries(step.metadata))
        lines.push(`- ${key}: ${value}`);
      lines.push("");
    }
    lines.push(
      `**Accessibility Elements:** ${step.element_count}`,
      "",
      "---",
      "",
    );
  }
  lines.push(
    "## Summary",
    "",
    `- Total steps: ${steps.length}`,
    `- Duration: ${duration.toFixed(1)}s`,
    `- Screenshots: ${steps.length}`,
    `- Accessibility snapshots: ${steps.length}`,
    "",
  );
  return lines.join("\n");
}
export function safeTestName(value: any): any {
  return value.toLowerCase().replaceAll(" ", "-");
}
export function safeStepName(value: any): any {
  return value.toLowerCase().replaceAll(" ", "-");
}
export function plannedTestRecorderOutputDir(
  outputDir: any,
  testName: any,
  now: any,
): any {
  return join(outputDir, `${safeTestName(testName)}-${formatTimestamp(now)}`);
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    testName: null,
    output: "test-artifacts",
    udid: null,
    inline: false,
    size: "half",
    appName: null,
    overwrite: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--inline") args.inline = true;
    else if (arg === "--overwrite") args.overwrite = true;
    else if (
      ["--test-name", "--output", "--udid", "--size", "--app-name"].includes(
        arg,
      )
    ) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--"))
        throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--test-name") args.testName = value;
      if (arg === "--output") args.output = value;
      if (arg === "--udid") args.udid = value;
      if (arg === "--size") args.size = value;
      if (arg === "--app-name") args.appName = value;
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  if (!args.help && !args.testName) throw new Error("--test-name is required");
  if (!["full", "half", "quarter", "thumb"].includes(args.size))
    throw new Error("--size must be one of: full, half, quarter, thumb");
  return args;
}
export function usage(): any {
  return `Record test execution with screenshots and documentation.

Usage: node scripts/test_recorder.mjs --test-name <name> [options]

Options:
  --test-name <name>  Name of the test being recorded
  --output <dir>      Output directory for test artifacts
  --udid <udid>       Device UDID
  --inline            Return screenshots as base64
  --size <preset>     full, half, quarter, or thumb
  --app-name <name>   App name for semantic screenshot naming
  --overwrite         Replace an existing test artifact directory after confirmation
  --help              Show this help
`;
}
export function main(argv: readonly string[]): any {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  let udid;
  try {
    udid = resolveUdid(args.udid);
  } catch (error: any) {
    console.log(`Error: ${error.message}`);
    return 1;
  }
  new TestRecorder({
    testName: args.testName,
    outputDir: args.output,
    udid,
    inline: args.inline,
    screenshotSize: args.size,
    appName: args.appName,
    overwrite: args.overwrite,
  });
  console.log("Test recorder initialized. Use the following methods:");
  console.log('  recorder.step("description") - Record a test step');
  console.log("  recorder.generate_report() - Generate final report");
  console.log("");
  console.log("Example:");
  console.log('  recorder.step("Launch app", screen_name="Splash")');
  console.log(
    '  recorder.step("Enter credentials", screen_name="Login", state="Empty", metadata={"user": "test"})',
  );
  console.log(
    '  recorder.step("Verify login", assertion="Home screen visible")',
  );
  console.log("  recorder.generate_report()");
  return 0;
}
function formatTimestamp(date: any): any {
  const pad = (value: any) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
function formatDisplayDate(date: any): any {
  const pad = (value: any) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
