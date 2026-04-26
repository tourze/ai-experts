import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function defaultConfig() {
  return clone(Config.DEFAULT_CONFIG);
}

function skillNameFromModule() {
  const currentFile = fileURLToPath(import.meta.url);
  const skillRoot = dirname(dirname(dirname(currentFile)));
  return basename(skillRoot);
}

export class Config {
  static DEFAULT_CONFIG = {
    device: {
      preferred_simulator: null,
      preferred_os_version: null,
      fallback_to_any_iphone: true,
      last_used_simulator: null,
      last_used_at: null,
    },
  };

  constructor(data, configPath) {
    this.data = data;
    this.configPath = configPath;
  }

  static load(projectDir = process.cwd()) {
    const configPath = join(projectDir, ".claude", "skills", skillNameFromModule(), "config.json");

    if (!existsSync(configPath)) {
      return new Config(defaultConfig(), configPath);
    }

    try {
      const data = JSON.parse(readFileSync(configPath, "utf8"));
      return new Config(Config.mergeWithDefaults(data), configPath);
    } catch (error) {
      console.error(`Warning: Could not load config: ${error.message}`);
      console.error("Using default config");
      return new Config(defaultConfig(), configPath);
    }
  }

  static mergeWithDefaults(data) {
    const merged = defaultConfig();
    if (data && typeof data === "object" && data.device && typeof data.device === "object") {
      Object.assign(merged.device, data.device);
    }
    return merged;
  }

  save() {
    try {
      mkdirSync(dirname(this.configPath), { recursive: true });
      const tempPath = `${this.configPath}.tmp`;
      writeFileSync(tempPath, `${JSON.stringify(this.data, null, 2)}\n`, "utf8");
      renameSync(tempPath, this.configPath);
    } catch (error) {
      console.error(`Warning: Could not save config: ${error.message}`);
    }
  }

  updateLastUsedSimulator(name) {
    this.data.device.last_used_simulator = name;
    this.data.device.last_used_at = new Date().toISOString();
  }

  getPreferredSimulator() {
    const device = this.data.device || {};
    return device.preferred_simulator || device.last_used_simulator || null;
  }

  shouldFallbackToAnyIphone() {
    return this.data.device?.fallback_to_any_iphone ?? true;
  }
}
