import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";
import { iosSimulatorConfigPath } from "../runtime_config";
function clone(value: any): any {
  return JSON.parse(JSON.stringify(value));
}
function defaultConfig(): any {
  return clone(Config.DEFAULT_CONFIG);
}
export class Config {
  configPath: any;
  data: any;
  static DEFAULT_CONFIG = {
    device: {
      preferred_simulator: null,
      preferred_os_version: null,
      fallback_to_any_iphone: true,
      last_used_simulator: null,
      last_used_at: null,
    },
  };
  constructor(data: any, configPath: any) {
    this.data = data;
    this.configPath = configPath;
  }
  static load(projectDir: any = process.cwd()): any {
    const configPath = iosSimulatorConfigPath(projectDir);
    if (!existsSync(configPath)) {
      return new Config(defaultConfig(), configPath);
    }
    try {
      const data = JSON.parse(readFileSync(configPath, "utf8"));
      return new Config(Config.mergeWithDefaults(data), configPath);
    } catch (error: any) {
      console.error(`Warning: Could not load config: ${error.message}`);
      console.error("Using default config");
      return new Config(defaultConfig(), configPath);
    }
  }
  static mergeWithDefaults(data: any): any {
    const merged = defaultConfig();
    if (
      data &&
      typeof data === "object" &&
      data.device &&
      typeof data.device === "object"
    ) {
      Object.assign(merged.device, data.device);
    }
    return merged;
  }
  save(): any {
    try {
      mkdirSync(dirname(this.configPath), { recursive: true });
      const tempPath = `${this.configPath}.tmp`;
      writeFileSync(
        tempPath,
        `${JSON.stringify(this.data, null, 2)}\n`,
        "utf8",
      );
      renameSync(tempPath, this.configPath);
    } catch (error: any) {
      console.error(`Warning: Could not save config: ${error.message}`);
    }
  }
  updateLastUsedSimulator(name: any): any {
    this.data.device.last_used_simulator = name;
    this.data.device.last_used_at = new Date().toISOString();
  }
  getPreferredSimulator(): any {
    const device = this.data.device || {};
    return device.preferred_simulator || device.last_used_simulator || null;
  }
  shouldFallbackToAnyIphone(): any {
    return this.data.device?.fallback_to_any_iphone ?? true;
  }
}
