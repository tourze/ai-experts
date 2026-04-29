#!/usr/bin/env node
/**
 * sync-mcp — 扫描插件目录下的 .mcp.json，同步插件声明的 MCP server。
 *
 * 行为：
 *   - install/reinstall：环境变量齐全时写入托管 MCP；缺少必需变量时移除对应条目。
 *   - uninstall：移除所有插件声明的托管 MCP。
 *   - 保留用户自己配置的其他 MCP、hooks、模型等非托管配置。
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const PLUGINS_DIR = process.env.AI_EXPERTS_PLUGINS_DIR || join(REPO_ROOT, "plugins");

const CLAUDE_MCP_CONFIG_PATH = process.env.CLAUDE_MCP_CONFIG_PATH || join(homedir(), ".claude.json");
const CODEX_HOME = process.env.CODEX_HOME || join(homedir(), ".codex");
const CODEX_CONFIG_TOML = process.env.CODEX_CONFIG_TOML_PATH || join(CODEX_HOME, "config.toml");
const MANIFEST_META_KEYS = new Set(["targets", "requiredEnv", "claude", "codex"]);
// 已发布过的托管 MCP 即使移出插件 manifest，也要继续识别一段时间，确保 install 能清理旧配置。
const RETIRED_MANAGED_MCP_IDS = new Set(["markitdown", "playwright", "sequential-thinking"]);

function atomicWriteFile(target, content) {
  const tmp = `${target}.tmp.${process.pid}.${Date.now()}`;
  writeFileSync(tmp, content, "utf-8");
  try {
    renameSync(tmp, target);
  } catch (err) {
    try { unlinkSync(tmp); } catch { /* best effort cleanup */ }
    throw err;
  }
}

function parseArgs(argv) {
  const args = { uninstall: false, dryRun: false, targets: ["cc", "codex"] };
  for (const arg of argv) {
    if (arg === "--uninstall" || arg === "-u") args.uninstall = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg.startsWith("--target=")) {
      const target = arg.slice("--target=".length);
      if (target === "cc" || target === "codex") args.targets = [target];
      else if (target === "all") args.targets = ["cc", "codex"];
      else throw new Error(`Unknown --target: ${target}`);
    } else if (arg === "-h" || arg === "--help") {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function printHelp() {
  console.log("Usage: node scripts/sync-mcp.mjs [--target=cc|codex|all] [--uninstall] [--dry-run]");
}

function envFilePaths() {
  if (process.env.AI_EXPERTS_ENV_FILE) return [resolve(process.env.AI_EXPERTS_ENV_FILE)];
  return [join(REPO_ROOT, ".env"), join(REPO_ROOT, ".env.local")];
}

function unescapeDoubleQuotedEnv(value) {
  return value.replace(/\\([nrt"\\])/g, (_, ch) => {
    if (ch === "n") return "\n";
    if (ch === "r") return "\r";
    if (ch === "t") return "\t";
    return ch;
  });
}

function stripInlineComment(value) {
  let quote = null;
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if ((ch === "\"" || ch === "'") && value[i - 1] !== "\\") {
      quote = quote === ch ? null : (quote ?? ch);
      continue;
    }
    if (!quote && ch === "#" && (i === 0 || /\s/.test(value[i - 1]))) {
      return value.slice(0, i).trimEnd();
    }
  }
  return value.trimEnd();
}

function parseDotEnvValue(rawValue) {
  const value = rawValue.trim();
  if ((value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    const inner = value.slice(1, -1);
    return value[0] === "\"" ? unescapeDoubleQuotedEnv(inner) : inner;
  }
  return stripInlineComment(value);
}

function readDotEnv(path) {
  if (!existsSync(path)) return {};
  const env = {};
  const content = readFileSync(path, "utf-8").replace(/^\uFEFF/, "");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    env[match[1]] = parseDotEnvValue(match[2]);
  }
  return env;
}

function loadEnv() {
  const env = {};
  for (const path of envFilePaths()) Object.assign(env, readDotEnv(path));
  return { ...env, ...process.env };
}

function readJsonFile(path) {
  const raw = readFileSync(path, "utf-8");
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`无法解析 ${path}: ${err.message}`);
  }
}

function listMcpManifestPaths() {
  if (!existsSync(PLUGINS_DIR)) return [];
  return readdirSync(PLUGINS_DIR)
    .filter((name) => {
      const root = join(PLUGINS_DIR, name);
      return statSync(root).isDirectory() && existsSync(join(root, ".mcp.json"));
    })
    .sort()
    .map((name) => join(PLUGINS_DIR, name, ".mcp.json"));
}

function parseMcpManifests() {
  const declarations = [];
  const seen = new Map();

  for (const path of listMcpManifestPaths()) {
    const manifest = readJsonFile(path);
    const servers = manifest?.mcpServers;
    if (!servers || typeof servers !== "object" || Array.isArray(servers)) {
      throw new Error(`${path} 缺少对象形式的 mcpServers`);
    }

    for (const [id, server] of Object.entries(servers)) {
      if (!server || typeof server !== "object" || Array.isArray(server)) {
        throw new Error(`${path} 的 mcpServers.${id} 必须是对象`);
      }
      if (seen.has(id)) {
        throw new Error(`MCP server id 重复：${id} 同时出现在 ${seen.get(id)} 与 ${path}`);
      }
      seen.set(id, path);
      declarations.push({ id, source: path, server });
    }
  }

  return declarations;
}

function expandString(value, env, missing) {
  return value.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)(:-([^}]*))?\}/g, (_match, name, _fallbackPart, fallback) => {
    const raw = env[name];
    if (raw !== undefined && String(raw).trim() !== "") return String(raw);
    if (fallback !== undefined) return fallback;
    missing.add(name);
    return "";
  });
}

function expandValue(value, env, missing) {
  if (typeof value === "string") return expandString(value, env, missing);
  if (Array.isArray(value)) return value.map((item) => expandValue(item, env, missing));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, expandValue(item, env, missing)]),
    );
  }
  return value;
}

function normalizeManifestTarget(target) {
  if (target === "cc" || target === "claude") return "cc";
  if (target === "codex") return "codex";
  throw new Error(`未知 MCP target：${target}`);
}

function manifestTargets(server) {
  if (server.targets === undefined) return new Set(["cc", "codex"]);
  if (!Array.isArray(server.targets) || server.targets.length === 0) {
    throw new Error("MCP server.targets 必须是非空数组");
  }
  return new Set(server.targets.map((target) => normalizeManifestTarget(target)));
}

function manifestRequiredEnv(server) {
  if (server.requiredEnv === undefined) return [];
  if (!Array.isArray(server.requiredEnv)) {
    throw new Error("MCP server.requiredEnv 必须是字符串数组");
  }
  return server.requiredEnv.map((name) => {
    if (typeof name !== "string" || !name.trim()) {
      throw new Error("MCP server.requiredEnv 必须是非空字符串数组");
    }
    return name;
  });
}

function serverWithoutManifestMeta(server) {
  return Object.fromEntries(Object.entries(server).filter(([key]) => !MANIFEST_META_KEYS.has(key)));
}

function targetOverride(server, target) {
  const key = target === "cc" ? "claude" : "codex";
  const override = server[key];
  if (override === undefined) return {};
  if (!override || typeof override !== "object" || Array.isArray(override)) {
    throw new Error(`MCP server.${key} 必须是对象`);
  }
  return override;
}

function isMissingEnv(env, name) {
  return env[name] === undefined || String(env[name]).trim() === "";
}

function renderDeclarations(declarations, env, target) {
  return declarations.map(({ id, source, server }) => {
    if (!manifestTargets(server).has(target)) {
      return { id, source, server: null, configured: false, missing: [], skippedByTarget: true };
    }

    const missing = new Set();
    for (const name of manifestRequiredEnv(server)) {
      if (isMissingEnv(env, name)) missing.add(name);
    }

    const rawServer = { ...serverWithoutManifestMeta(server), ...targetOverride(server, target) };
    const rendered = expandValue(rawServer, env, missing);
    return { id, source, server: rendered, configured: missing.size === 0, missing: [...missing].sort(), skippedByTarget: false };
  });
}

function skippedSummary(rendered, uninstall) {
  if (uninstall) return "";
  const skipped = rendered.filter((entry) => !entry.configured);
  if (skipped.length === 0) return "";
  return `; skipped ${skipped.length}: ${skipped
    .map((entry) => `${entry.id}(${entry.missing.join(",")})`)
    .join(", ")}`;
}

function readJsonConfig(path) {
  if (!existsSync(path)) return { raw: null, data: {} };
  const raw = readFileSync(path, "utf-8");
  try {
    const data = JSON.parse(raw);
    return { raw, data: data && typeof data === "object" && !Array.isArray(data) ? data : {} };
  } catch (err) {
    throw new Error(`无法解析 ${path}: ${err.message}`);
  }
}

function syncClaude({ rendered, uninstall, dryRun }) {
  const { raw, data } = readJsonConfig(CLAUDE_MCP_CONFIG_PATH);
  const managedIds = new Set([...rendered.map(({ id }) => id), ...RETIRED_MANAGED_MCP_IDS]);
  const targetRendered = rendered.filter((entry) => !entry.skippedByTarget);
  const configuredServers = targetRendered.filter((entry) => entry.configured && !uninstall);
  const existingServers = data.mcpServers && typeof data.mcpServers === "object" && !Array.isArray(data.mcpServers)
    ? data.mcpServers
    : {};
  const hasManaged = Object.keys(existingServers).some((id) => managedIds.has(id));

  if (configuredServers.length === 0 && raw === null) {
    console.log(`sync-mcp claude: 无可配置插件 MCP，无需处理 (${CLAUDE_MCP_CONFIG_PATH})`);
    return;
  }
  if (configuredServers.length === 0 && !hasManaged) {
    console.log(`sync-mcp claude: 无托管插件 MCP 条目 (${CLAUDE_MCP_CONFIG_PATH})`);
    return;
  }

  const nextServers = {};
  for (const [id, server] of Object.entries(existingServers)) {
    if (!managedIds.has(id)) nextServers[id] = server;
  }
  for (const { id, server } of configuredServers) {
    nextServers[id] = server;
  }

  const nextData = { ...data };
  if (Object.keys(nextServers).length > 0) nextData.mcpServers = nextServers;
  else delete nextData.mcpServers;

  const target = JSON.stringify(nextData, null, 2) + "\n";
  if (raw === target) {
    console.log(`sync-mcp claude: 无变化 (${CLAUDE_MCP_CONFIG_PATH})`);
    return;
  }
  if (dryRun) {
    console.log(`sync-mcp claude: would sync ${configuredServers.length}/${targetRendered.length} plugin MCP servers in ${CLAUDE_MCP_CONFIG_PATH}${skippedSummary(targetRendered, uninstall)}`);
    return;
  }

  mkdirSync(dirname(CLAUDE_MCP_CONFIG_PATH), { recursive: true });
  atomicWriteFile(CLAUDE_MCP_CONFIG_PATH, target);
  console.log(`sync-mcp claude: synced ${configuredServers.length}/${targetRendered.length} plugin MCP servers (${CLAUDE_MCP_CONFIG_PATH})${skippedSummary(targetRendered, uninstall)}`);
}

function tomlString(value) {
  return JSON.stringify(String(value));
}

function tomlKey(key) {
  return /^[A-Za-z0-9_-]+$/.test(key) ? key : tomlString(key);
}

function tomlValue(value) {
  if (typeof value === "string") return tomlString(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `[${value.map((item) => tomlValue(item)).join(", ")}]`;
  if (value && typeof value === "object") {
    return `{ ${Object.entries(value).map(([key, item]) => `${tomlKey(key)} = ${tomlValue(item)}`).join(", ")} }`;
  }
  throw new Error(`不支持的 TOML 值类型：${value}`);
}

function splitTomlPath(path) {
  const parts = [];
  let current = "";
  let quote = null;
  let escape = false;
  for (const ch of path) {
    if (quote) {
      current += ch;
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "\"" || ch === "'") {
      quote = ch;
      current += ch;
    } else if (ch === ".") {
      parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current.trim());
  return parts.map((part) => {
    if (part.startsWith("\"") && part.endsWith("\"")) {
      try { return JSON.parse(part); } catch { return part.slice(1, -1); }
    }
    if (part.startsWith("'") && part.endsWith("'")) return part.slice(1, -1);
    return part;
  });
}

function tomlTablePath(line) {
  const match = line.match(/^\s*\[([^\]]+)\]\s*(?:#.*)?$/);
  return match ? splitTomlPath(match[1]) : null;
}

function isManagedTomlTable(pathParts, managedIds) {
  return pathParts?.[0] === "mcp_servers" && managedIds.has(pathParts[1]);
}

function stripManagedCodexServers(content, managedIds) {
  const lines = content.split("\n");
  const out = [];
  let skipping = false;

  for (const line of lines) {
    const tablePath = tomlTablePath(line);
    if (tablePath) skipping = isManagedTomlTable(tablePath, managedIds);
    if (!skipping) out.push(line);
  }

  const stripped = out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
  return stripped ? `${stripped}\n` : "";
}

function hasManagedCodexServers(content, managedIds) {
  return content.split("\n").some((line) => isManagedTomlTable(tomlTablePath(line), managedIds));
}

function codexServerToToml(id, server) {
  const lines = [`[mcp_servers.${id}]`];
  if (server.command) lines.push(`command = ${tomlString(server.command)}`);
  if (server.args) lines.push(`args = ${tomlValue(server.args)}`);
  if (server.url) lines.push(`url = ${tomlString(server.url)}`);
  if (server.headers) lines.push(`http_headers = ${tomlValue(server.headers)}`);
  if (server.bearer_token_env_var) lines.push(`bearer_token_env_var = ${tomlString(server.bearer_token_env_var)}`);
  if (server.startup_timeout_sec !== undefined) lines.push(`startup_timeout_sec = ${tomlValue(server.startup_timeout_sec)}`);
  if (server.enabled !== undefined) lines.push(`enabled = ${tomlValue(server.enabled)}`);

  const blocks = [lines.join("\n")];
  if (server.env && typeof server.env === "object" && !Array.isArray(server.env)) {
    blocks.push(`[mcp_servers.${id}.env]\n${Object.entries(server.env)
      .map(([key, value]) => `${tomlKey(key)} = ${tomlValue(value)}`)
      .join("\n")}`);
  }
  return blocks.join("\n\n");
}

function buildCodexMcpToml(entries) {
  if (entries.length === 0) return "";
  return `${entries.map(({ id, server }) => codexServerToToml(id, server)).join("\n\n")}\n`;
}

function syncCodex({ rendered, uninstall, dryRun }) {
  const raw = existsSync(CODEX_CONFIG_TOML) ? readFileSync(CODEX_CONFIG_TOML, "utf-8") : "";
  const managedIds = new Set([...rendered.map(({ id }) => id), ...RETIRED_MANAGED_MCP_IDS]);
  const targetRendered = rendered.filter((entry) => !entry.skippedByTarget);
  const configuredServers = targetRendered.filter((entry) => entry.configured && !uninstall);
  const hasManaged = hasManagedCodexServers(raw, managedIds);

  if (configuredServers.length === 0 && !raw) {
    console.log(`sync-mcp codex: 无可配置插件 MCP，无需处理 (${CODEX_CONFIG_TOML})`);
    return;
  }
  if (configuredServers.length === 0 && !hasManaged) {
    console.log(`sync-mcp codex: 无托管插件 MCP 条目 (${CODEX_CONFIG_TOML})`);
    return;
  }

  const stripped = stripManagedCodexServers(raw, managedIds);
  const renderedToml = uninstall ? "" : buildCodexMcpToml(configuredServers);
  const target = renderedToml ? `${stripped}${stripped ? "\n" : ""}${renderedToml}` : stripped;

  if (raw === target) {
    console.log(`sync-mcp codex: 无变化 (${CODEX_CONFIG_TOML})`);
    return;
  }
  if (dryRun) {
    console.log(`sync-mcp codex: would sync ${configuredServers.length}/${targetRendered.length} plugin MCP servers in ${CODEX_CONFIG_TOML}${skippedSummary(targetRendered, uninstall)}`);
    return;
  }

  mkdirSync(dirname(CODEX_CONFIG_TOML), { recursive: true });
  atomicWriteFile(CODEX_CONFIG_TOML, target);
  console.log(`sync-mcp codex: synced ${configuredServers.length}/${targetRendered.length} plugin MCP servers (${CODEX_CONFIG_TOML})${skippedSummary(targetRendered, uninstall)}`);
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`sync-mcp: ${err.message}`);
    process.exit(1);
  }

  if (args.help) {
    printHelp();
    return;
  }

  const declarations = parseMcpManifests();
  const env = loadEnv();
  for (const target of args.targets) {
    const rendered = renderDeclarations(declarations, env, target);
    if (target === "cc") syncClaude({ rendered, uninstall: args.uninstall, dryRun: args.dryRun });
    else if (target === "codex") syncCodex({ rendered, uninstall: args.uninstall, dryRun: args.dryRun });
  }
}

main();
