#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { iosSimulatorConfigPath } from "./runtime_config";
import { runXcrunSimctl } from "./simctl_common";

export const procedure = defineCliProcedure({
  id: "ios-simulator-skill-simulator-selector",
  entry: procedureEntry(import.meta.url),
  description:
    "智能推荐 iOS 模拟器：根据常用型号、iOS 版本、启动状态和上次使用记录评分排序。",
  owners: { skillIds: ["ios-simulator-skill"] },
  target: "scripts/simulator_selector.mjs",
  runtime: "node",
  params: [
    {
      flag: "--suggest",
      type: "",
      description: "获取推荐模拟器列表，传此标志即启用",
      required: false,
    },
    {
      flag: "--list",
      type: "",
      description: "列出所有可用模拟器",
      required: false,
    },
    {
      flag: "--boot",
      type: "字符串",
      description: "按 UDID 启动模拟器",
      required: false,
    },
    {
      flag: "--json",
      type: "",
      description: "输出为 JSON，传此标志即启用",
      required: false,
    },
    {
      flag: "--count",
      type: "数字",
      description: "推荐数量（默认 4）",
      required: false,
    },
  ],

  exampleArgs: { args: ["--suggest"] },
});

export class SimulatorInfo {
  iosVersion: any;
  name: any;
  reasons: any;
  status: any;
  udid: any;
  constructor(name: any, udid: any, iosVersion: any, status: any) {
    this.name = name;
    this.udid = udid;
    this.iosVersion = iosVersion;
    this.status = status;
    this.reasons = [];
  }
  toDict(): any {
    return {
      device: this.name,
      udid: this.udid,
      ios: this.iosVersion,
      status: this.status,
      reasons: this.reasons,
    };
  }
}
export class SimulatorSelector {
  lastUsedSimulator: any;
  simulators: any;
  static COMMON_MODELS = [
    "iPhone 16 Pro",
    "iPhone 16",
    "iPhone 15 Pro",
    "iPhone 15",
    "iPhone SE (3rd generation)",
  ];
  constructor({ lastUsedSimulator = loadPreferredSimulator() }: any = {}) {
    this.simulators = [];
    this.lastUsedSimulator = lastUsedSimulator;
  }
  listSimulators(): any {
    try {
      const result = runXcrunSimctl(["list", "devices", "--json"], {
        check: true,
      });
      this.simulators = this.parseSimulators(JSON.parse(result.stdout));
      return this.simulators;
    } catch (error: any) {
      if (error?.result?.stderr)
        console.error(`Error listing simulators: ${error.result.stderr}`);
      else console.error(`Error listing simulators: ${error.message}`);
      return [];
    }
  }
  parseSimulators(data: any): any {
    const simulators: any[] = [];
    for (const [runtime, devices] of Object.entries(
      (data.devices ?? {}) as Record<string, any[]>,
    )) {
      const iosVersion = extractIosVersion(runtime);
      if (!iosVersion) continue;
      for (const device of devices) {
        const name = device.name ?? "";
        if (!device.isAvailable || !name.includes("iPhone")) continue;
        simulators.push(
          new SimulatorInfo(
            name,
            device.udid ?? "",
            iosVersion,
            capitalize(device.state ?? ""),
          ),
        );
      }
    }
    this.simulators = simulators;
    return simulators;
  }
  getSuggestions(count: any = 4): any {
    if (!this.simulators.length) return [];
    const scored = this.simulators.map((simulator: any) => [
      this.scoreSimulator(simulator),
      simulator,
    ]);
    scored.sort((a: any, b: any) => b[0] - a[0]);
    const suggestions = scored
      .slice(0, count)
      .map(([, simulator]: any) => simulator);
    const latestIos = [
      ...this.simulators.map((simulator: any) => simulator.iosVersion),
    ]
      .sort()
      .at(-1);
    for (const [index, simulator] of suggestions.entries()) {
      simulator.reasons = [];
      if (index === 0) simulator.reasons.push("Recommended");
      if (this.lastUsedSimulator && this.lastUsedSimulator === simulator.name)
        simulator.reasons.push("Recently used");
      if (simulator.iosVersion === latestIos)
        simulator.reasons.push("Latest iOS");
      for (const [
        modelIndex,
        model,
      ] of SimulatorSelector.COMMON_MODELS.entries()) {
        if (simulator.name.includes(model)) {
          simulator.reasons.push(`#${modelIndex + 1} common model`);
          break;
        }
      }
      if (simulator.status === "Booted")
        simulator.reasons.push("Currently running");
    }
    return suggestions;
  }
  scoreSimulator(simulator: any): any {
    let score = 0;
    if (this.lastUsedSimulator && this.lastUsedSimulator === simulator.name)
      score += 100;
    const latestIos = [...this.simulators.map((sim: any) => sim.iosVersion)]
      .sort()
      .at(-1);
    if (simulator.iosVersion === latestIos) score += 50;
    for (const [index, model] of SimulatorSelector.COMMON_MODELS.entries()) {
      if (simulator.name.includes(model)) {
        score += 30 - index * 2;
        break;
      }
    }
    if (simulator.status === "Booted") score += 10;
    score += Number.parseFloat(simulator.iosVersion.replaceAll(".", "")) * 0.1;
    return score;
  }
  bootSimulator(udid: any): any {
    const result = runXcrunSimctl(["boot", udid]);
    if (result.status !== 0) {
      console.error(`Error booting simulator: ${result.stderr}`);
      return false;
    }
    return true;
  }
}
export function formatSuggestions(
  suggestions: any,
  jsonFormat: any = false,
): any {
  if (jsonFormat)
    return JSON.stringify(
      { suggestions: suggestions.map((simulator: any) => simulator.toDict()) },
      null,
      2,
    );
  if (!suggestions.length) return "No simulators available";
  const lines: any[] = ["Available Simulators:\n"];
  for (const [index, simulator] of suggestions.entries()) {
    lines.push(`${index + 1}. ${simulator.name} (iOS ${simulator.iosVersion})`);
    if (simulator.reasons.length)
      lines.push(`   ${simulator.reasons.join(", ")}`);
    lines.push(`   UDID: ${simulator.udid}`);
    lines.push("");
  }
  return lines.join("\n");
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    suggest: false,
    list: false,
    boot: null,
    json: false,
    count: 4,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--suggest") args.suggest = true;
    else if (arg === "--list") args.list = true;
    else if (arg === "--json") args.json = true;
    else if (["--boot", "--count"].includes(arg)) {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--"))
        throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--boot") args.boot = value;
      if (arg === "--count") args.count = Number.parseInt(value, 10);
    } else {
      throw new Error(`unrecognized argument: ${arg}`);
    }
  }
  if (!Number.isInteger(args.count))
    throw new Error("--count must be an integer");
  return args;
}
export function usage(): any {
  return `Intelligent iOS simulator selector.

Usage: node scripts/simulator_selector.mjs [options]

Options:
  --suggest       Get top simulator suggestions
  --list          List all available simulators
  --boot <udid>   Boot specific simulator by UDID
  --json          Output as JSON
  --count <n>     Number of suggestions (default: 4)
  --help          Show this help
`;
}
export function main(argv: readonly string[]): any {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  const selector = new SimulatorSelector();
  if (args.boot) {
    if (selector.bootSimulator(args.boot)) {
      console.log(`Booted simulator: ${args.boot}`);
      return 0;
    }
    return 1;
  }
  if (args.list) {
    console.log(formatSuggestions(selector.listSimulators(), args.json));
    return 0;
  }
  selector.listSimulators();
  console.log(
    formatSuggestions(selector.getSuggestions(args.count), args.json),
  );
  return 0;
}
export function extractIosVersion(runtime: any): any {
  const canonical = runtime.match(/iOS-(\d+-\d+)/);
  if (canonical) return canonical[1].replace("-", ".");
  const display = runtime.match(/iOS[ -](\d+(?:[.-]\d+)?)/);
  return display ? display[1].replace("-", ".") : null;
}
export function loadPreferredSimulator(
  projectDir: any = process.cwd(),
  skillRoot: any = dirname(dirname(fileURLToPath(import.meta.url))),
): any {
  const skillName = basename(skillRoot);
  const configPath = iosSimulatorConfigPath(projectDir, skillName);
  if (!existsSync(configPath)) return null;
  try {
    const device = JSON.parse(readFileSync(configPath, "utf8")).device ?? {};
    return device.preferred_simulator ?? device.last_used_simulator ?? null;
  } catch {
    return null;
  }
}
function capitalize(value: any): any {
  if (!value) return "";
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
