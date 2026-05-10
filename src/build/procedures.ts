import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import webpack, { type Configuration, type Stats } from "webpack";
import type {
  Platform as PlatformType,
  ProcedureDefinition,
  ProcedureUseReference,
} from "../components/sdk";
import { sourceRoot, toAbsolutePath } from "./core";
import { listProcedureUses, procedureUseAppliesToPlatform } from "./procedure-uses";
import type { ComponentSurface } from "./types";

type RuntimeProcedureEntry = {
  id: string;
  target: string;
  runtime: "node";
  description: string;
  owners: {
    skillIds: readonly string[];
    agentIds: readonly string[];
  };
  argsSchema: string | null;
  outputSchema: string | null;
  params?: readonly {
    flag: string;
    type: string;
    description: string;
    required: boolean;
  }[];
  exampleArgs?: { args?: readonly string[] };
};

type RuntimeProcedureModule = RuntimeProcedureEntry & {
  sourcePath: string;
};

export type ProcedureCommandRewriteTriggerKind = "skill" | "agent";

export type ProcedureCommandRewrite = {
  id: string;
  triggerKind: ProcedureCommandRewriteTriggerKind;
  triggerId: string;
};

export type ProcedureCommandRewriteCandidate = Pick<RuntimeProcedureEntry, "id" | "target" | "owners">;

type ProcedureManifestEntry = Omit<RuntimeProcedureEntry, "target"> & {
  target: string;
  bundled: true;
};

export type ProcedureRuntimeBuildResult = {
  proceduresFile: string;
  bundleChecksum: string;
  procedures: ProcedureManifestEntry[];
};

const runtimeEntryId = "virtual:ai-experts-procedures";

function procedureRuntimePath(platform: PlatformType): string {
  return platform === "claude-code" ? "~/.claude/procedures.js" : "~/.codex/procedures.js";
}

function procedureRuntimeRoot(platform: PlatformType): string {
  return platform === "claude-code" ? "~/.claude" : "~/.codex";
}

function skillRuntimeRoot(platform: PlatformType): string {
  return platform === "claude-code" ? "~/.claude/skills" : "~/.agents/skills";
}

function normalizeSeparators(path: string): string {
  return path.replaceAll("\\", "/");
}

export function validateProcedureTargetValue(owner: string, target: unknown): void {
  if (typeof target !== "string" || target.trim() === "") {
    throw new Error(`${owner} target must be a non-empty string when defined`);
  }
  if (target.includes("\\")) {
    throw new Error(`${owner} target must use POSIX / separators: ${target}`);
  }
  const normalized = target.replace(/\.ts$/u, ".mjs");
  if (
    normalized.startsWith("/") ||
    normalized === "." ||
    normalized === ".." ||
    normalized.startsWith("./") ||
    normalized.startsWith("../") ||
    normalized.includes("/./") ||
    normalized.includes("/../") ||
    normalized.includes("..") ||
    normalized.endsWith("/")
  ) {
    throw new Error(`${owner} target must be a relative file path without traversal: ${target}`);
  }
}

export function validateProcedureTarget(procedure: ProcedureDefinition): void {
  if (procedure.target === undefined) return;
  validateProcedureTargetValue(`Procedure ${procedure.id}`, procedure.target);
}

function normalizeProcedureTarget(target: string): string {
  validateProcedureTargetValue("Procedure", target);
  return target.replace(/\.ts$/u, ".mjs");
}

export function procedureRuntimeTarget(procedure: ProcedureDefinition): string {
  return normalizeProcedureTarget(
    procedure.target ?? `scripts/${basename(toAbsolutePath(procedure.entry)).replace(/\.ts$/u, ".mjs")}`,
  );
}

function toStableProcedureSourcePath(procedure: ProcedureDefinition): string {
  const absolute = toAbsolutePath(procedure.entry);
  const normalized = normalizeSeparators(absolute);
  const marker = "/components/";
  const markerIndex = normalized.lastIndexOf(marker);
  if (markerIndex >= 0) {
    const relativePath = normalized.slice(markerIndex + marker.length);
    const stablePath = join(sourceRoot, relativePath);
    if (existsSync(stablePath)) return stablePath;
  }
  return absolute;
}

function checksum(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function canonicalizeProcedureBundleSource(source: string, platform: PlatformType): string {
  return source
    .replaceAll("<runtime-root>", procedureRuntimeRoot(platform))
    .replaceAll("<skills-dir>", skillRuntimeRoot(platform))
    .replace(
      /(?:\.\.\/)*[^"'\n]*ai-experts-procedure-webpack-[^/"'\n]+\/procedure-runtime-entry\.ts/gu,
      runtimeEntryId,
    )
    .replaceAll("./src/components/", "ai-experts-component-module:")
    .replace(
      /(node ~\/\.(?:claude|codex)\/procedures\.js --procedure-id [A-Za-z0-9-]+ --trigger-(?:skill|agent) [A-Za-z0-9-]+) --(?=\r?\n)/gu,
      "$1",
    );
}

function toManifestEntry(procedure: RuntimeProcedureModule, bundleTarget: string): ProcedureManifestEntry {
  const { sourcePath: _sourcePath, target: _runtimeTarget, ...entry } = procedure;
  return { ...entry, target: bundleTarget, bundled: true };
}

function metadataForRuntime(procedure: RuntimeProcedureModule): RuntimeProcedureEntry {
  const { sourcePath: _sourcePath, ...entry } = procedure;
  return entry;
}

function renderProcedureLoaders(procedures: readonly RuntimeProcedureModule[]): string {
  return [
    "const procedureLoaders = {",
    ...procedures.map((procedure) =>
      `  ${JSON.stringify(procedure.id)}: () => import(/* webpackMode: "eager" */ ${JSON.stringify(normalizeSeparators(procedure.sourcePath))}),`
    ),
    "};",
  ].join("\n");
}

function isExternalRuntimeImport(id: string | undefined): boolean {
  if (!id) return false;
  if (id === "yaml" || id.startsWith("yaml/")) return false;
  return id.startsWith("node:") ||
    (!id.startsWith(".") && !id.startsWith("/") && !id.startsWith("\0") && id !== runtimeEntryId);
}

function renderProceduresEntrypoint(procedures: readonly RuntimeProcedureModule[], platform: PlatformType): string {
  const procedureMap = Object.fromEntries(procedures.map((procedure) => [procedure.id, metadataForRuntime(procedure)]));
  return `
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";

const procedures = ${JSON.stringify(procedureMap)};
${renderProcedureLoaders(procedures)}
const version = "procedure-runtime-v3";
const platform = ${JSON.stringify(platform)};
const procedureRuntimePath = ${JSON.stringify(procedureRuntimePath(platform))};
const runtimeFile = realpathSync(resolve(process.argv[1] || "."));
const runtimeRoot = dirname(runtimeFile);

function parseCliArgs(argv) {
  const parsed = {
    sessionId: null, triggerSkill: null, triggerAgent: null,
    procedureId: null, passthroughArgs: [],
  };
  let hasProcedureId = false;
  let hasTrigger = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") {
      parsed.passthroughArgs = argv.slice(index + 1);
      break;
    }
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }
    if (arg === "--session-id" || arg === "--trigger-skill" || arg === "--trigger-agent" || arg === "--procedure-id") {
      const value = argv[index + 1];
      if (value == null || value.startsWith("-")) {
        throw new Error(String(arg) + " requires a value");
      }
      index += 1;
      if (arg === "--session-id") parsed.sessionId = value;
      if (arg === "--trigger-skill") { parsed.triggerSkill = value; hasTrigger = true; }
      if (arg === "--trigger-agent") { parsed.triggerAgent = value; hasTrigger = true; }
      if (arg === "--procedure-id") { parsed.procedureId = value; hasProcedureId = true; }
      continue;
    }
    // After both procedure-id and trigger are known, treat unknowns as procedure args
    if (hasProcedureId && hasTrigger) {
      parsed.passthroughArgs.push(arg);
      continue;
    }
    throw new Error("unknown argument: " + String(arg) + "; use -- to pass through procedure args");
  }
  return parsed;
}

function parseChildArgs(argv) {
  if (argv[0] !== "--__procedure-child") return null;
  const rawPayload = argv[1];
  if (!rawPayload) throw new Error("--__procedure-child requires a JSON payload");
  return JSON.parse(rawPayload);
}

function normalizeTrigger(parsed) {
  return {
    skillId: parsed.triggerSkill ?? undefined,
    agentId: parsed.triggerAgent ?? undefined,
  };
}

function ensureAuthorized(procedure, parsed) {
  if (!parsed.triggerSkill && !parsed.triggerAgent) {
    throw new Error("one of --trigger-skill or --trigger-agent is required");
  }
  if (parsed.triggerSkill) {
    const allowed = Array.isArray(procedure.owners?.skillIds) ? procedure.owners.skillIds : [];
    if (!allowed.includes(parsed.triggerSkill)) {
      throw new Error("procedure " + procedure.id + " is not callable by trigger skill: " + parsed.triggerSkill);
    }
  }
  if (parsed.triggerAgent) {
    const allowed = Array.isArray(procedure.owners?.agentIds) ? procedure.owners.agentIds : [];
    if (!allowed.includes(parsed.triggerAgent)) {
      throw new Error("procedure " + procedure.id + " is not callable by trigger agent: " + parsed.triggerAgent);
    }
  }
}

function hashText(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function nodePath() {
  const candidates = [
    join(runtimeRoot, "node_modules"),
    join(runtimeRoot, "..", "node_modules"),
    join(runtimeRoot, "..", "..", "node_modules"),
    join(process.cwd(), "node_modules"),
  ].filter((candidate) => existsSync(candidate));
  const current = process.env.NODE_PATH ? process.env.NODE_PATH.split(delimiter).filter(Boolean) : [];
  return [...candidates, ...current].join(delimiter);
}

function activeSkillRoot(skillId) {
  if (platform === "codex-cli") return join(homedir(), ".agents", "skills", skillId);
  return join(runtimeRoot, "skills", skillId);
}

function activeOwnerRoot(procedure, trigger) {
  if (trigger.skillId) return activeSkillRoot(trigger.skillId);
  if (trigger.agentId) return join(runtimeRoot, "agents", trigger.agentId);
  const fallbackSkill = procedure.owners?.skillIds?.[0];
  if (fallbackSkill) return activeSkillRoot(fallbackSkill);
  const fallbackAgent = procedure.owners?.agentIds?.[0];
  if (fallbackAgent) return join(runtimeRoot, "agents", fallbackAgent);
  return runtimeRoot;
}

function installProcedureGlobals(procedure, trigger) {
  const ownerRoot = activeOwnerRoot(procedure, trigger);
  globalThis.__aiExpertsModuleFile = (target) => join(ownerRoot, String(target));
  globalThis.__aiExpertsProcedureDir = (target) => join(ownerRoot, dirname(String(target)));
  globalThis.__aiExpertsRuntimeRoot = runtimeRoot;
  globalThis.__aiExpertsOwnerRoot = ownerRoot;
}

function printResult(payload) {
  process.stdout.write(JSON.stringify(payload) + "\\n");
}

function printHelp() {
  printResult({
    ok: true,
    procedureId: null,
    sessionId: null,
    trigger: {},
    result: {
      usage: "node " + procedureRuntimePath + " --procedure-id <id> [--session-id <id>] [--trigger-skill <skill-id>] [--trigger-agent <agent-id>] [-- <procedure-args...>]",
      procedures: Object.keys(procedures).sort(),
    },
    error: null,
    timingMs: 0,
    version,
  });
}

function triggerHelpArg(procedure, parsed) {
  if (parsed.triggerSkill) return "--trigger-skill " + parsed.triggerSkill;
  if (parsed.triggerAgent) return "--trigger-agent " + parsed.triggerAgent;
  const fallbackSkill = procedure.owners?.skillIds?.[0];
  if (fallbackSkill) return "--trigger-skill " + fallbackSkill;
  const fallbackAgent = procedure.owners?.agentIds?.[0];
  if (fallbackAgent) return "--trigger-agent " + fallbackAgent;
  return "--trigger-skill <skill-id>";
}

function renderParamHelp(param) {
  const type = param.type && param.type !== "布尔" ? " <" + param.type + ">" : "";
  const required = param.required ? " (required)" : "";
  return "  " + param.flag + type + required + "\\n      " + param.description;
}

function renderProcedureHelp(procedure, parsed) {
  const triggerArg = triggerHelpArg(procedure, parsed);
  const lines = [
    procedure.id,
    "",
    procedure.description,
    "",
    "Usage: node " + procedureRuntimePath + " --procedure-id " + procedure.id + " " + triggerArg + " -- [options]",
  ];
  if (Array.isArray(procedure.params) && procedure.params.length > 0) {
    lines.push("", "Parameters:");
    for (const param of procedure.params) lines.push(renderParamHelp(param));
  }
  const exampleArgs = procedure.exampleArgs?.args;
  if (Array.isArray(exampleArgs) && exampleArgs.length > 0) {
    lines.push("", "Example:");
    lines.push(
      "  node " + procedureRuntimePath + " --procedure-id " + procedure.id + " " + triggerArg + " -- " +
        exampleArgs.map((arg) => JSON.stringify(String(arg))).join(" "),
    );
  }
  return lines.join("\\n") + "\\n";
}

function printProcedureHelp(procedure, parsed, timingMs) {
  printResult({
    ok: true,
    procedureId: procedure.id,
    sessionId: parsed.sessionId,
    trigger: normalizeTrigger(parsed),
    result: {
      exitCode: 0,
      signal: null,
      stdout: renderProcedureHelp(procedure, parsed),
      stderr: "",
    },
    error: null,
    timingMs,
    version,
  });
}

async function runProcedureChild(payload) {
  const procedure = procedures[payload.procedureId];
  const loader = procedureLoaders[payload.procedureId];
  if (!procedure || !loader) {
    throw new Error("procedure not found: " + payload.procedureId);
  }
  ensureAuthorized(procedure, {
    triggerSkill: payload.triggerSkill || null,
    triggerAgent: payload.triggerAgent || null,
  });
  const trigger = {
    skillId: payload.triggerSkill ?? undefined,
    agentId: payload.triggerAgent ?? undefined,
  };
  installProcedureGlobals(procedure, trigger);
  process.argv = [process.execPath, runtimeFile, ...payload.args.map(String)];
  process.env.AI_EXPERTS_PROCEDURE_ID = procedure.id;
  process.env.AI_EXPERTS_PROCEDURE_SESSION_ID = payload.sessionId ?? "";
  process.env.AI_EXPERTS_PROCEDURE_TRIGGER_SKILL = payload.triggerSkill ?? "";
  process.env.AI_EXPERTS_PROCEDURE_TRIGGER_AGENT = payload.triggerAgent ?? "";
  process.env.AI_EXPERTS_PROCEDURE_PLATFORM = platform;
  const module = await loader();
  if (typeof module.main !== "function") {
    throw new Error("procedure " + procedure.id + " did not export main()");
  }
  const result = await module.main(payload.args.map(String));
  if (typeof result === "number") {
    process.exitCode = result;
  }
}

export function main(rawArgv = process.argv.slice(2)) {
  const startAt = Date.now();
  let parsed = null;
  try {
    parsed = parseCliArgs(rawArgv);
    if (parsed.help) {
      printHelp();
      return;
    }
    if (!parsed.procedureId) {
      throw new Error("--procedure-id is required");
    }

    const procedure = procedures[parsed.procedureId];
    if (!procedure) {
      throw new Error("procedure not found: " + parsed.procedureId);
    }
    ensureAuthorized(procedure, parsed);
    if (parsed.passthroughArgs.length === 1 && ["--help", "-h"].includes(String(parsed.passthroughArgs[0]))) {
      printProcedureHelp(procedure, parsed, Date.now() - startAt);
      return;
    }

    const childPayload = {
      procedureId: procedure.id,
      args: parsed.passthroughArgs.map(String),
      sessionId: parsed.sessionId ?? "",
      triggerSkill: parsed.triggerSkill ?? "",
      triggerAgent: parsed.triggerAgent ?? "",
    };
    const child = spawnSync(process.execPath, [
      runtimeFile,
      "--__procedure-child",
      JSON.stringify(childPayload),
    ], {
      encoding: "utf-8",
      env: {
        ...process.env,
        NODE_PATH: nodePath(),
        AI_EXPERTS_PROCEDURES_FILE: runtimeFile,
        AI_EXPERTS_PROCEDURE_CACHE_KEY: hashText(JSON.stringify(procedures)),
      },
    });

    const success = (child.status ?? 1) === 0;
    if (!success) process.exitCode = child.status ?? 1;
    const payload = {
      ok: success,
      procedureId: procedure.id,
      sessionId: parsed.sessionId ?? null,
      trigger: normalizeTrigger(parsed),
      result: {
        exitCode: child.status ?? 1,
        signal: child.signal ?? null,
        stdout: child.stdout ?? "",
        stderr: child.stderr ?? "",
      },
      error: success
        ? null
        : {
            code: "PROCEDURE_EXECUTION_FAILED",
            message: "procedure exited with code " + String(child.status ?? 1),
          },
      timingMs: Date.now() - startAt,
      version,
    };
    printResult(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.exitCode = 1;
    printResult({
      ok: false,
      procedureId: parsed?.procedureId ?? null,
      sessionId: parsed?.sessionId ?? null,
      trigger: parsed ? normalizeTrigger(parsed) : {},
      result: null,
      error: {
        code: "RUNNER_ERROR",
        message,
      },
      timingMs: Date.now() - startAt,
      version,
    });
  }
}

const childPayload = parseChildArgs(process.argv.slice(2));
if (childPayload) {
  await runProcedureChild(childPayload);
} else {
  main();
}
`;
}

type ProcedureTransformContext = {
  id: string;
  target: string;
  ownerSkillIds: readonly string[];
  ownerAgentIds: readonly string[];
  primaryTrigger: Omit<ProcedureCommandRewrite, "id"> | null;
};

function renderProcedurePathLoader(): string {
  return `
module.exports = function aiExpertsProcedurePathLoader(source) {
  const options = this.getOptions() || {};
  const contexts = options.contexts || {};
  const commandRewrites = options.commandRewrites || {};
  const commandRewritesByProcedureId = options.commandRewritesByProcedureId || {};
  const procedureRuntimePath = options.procedureRuntimePath || "procedures.js";
  const file = String(this.resourcePath || "").replaceAll("\\\\", "/");
  const context = contexts[file];
  if (!context) return source;
  const sanitizedEntry = "new URL(" + JSON.stringify("ai-experts-procedure:" + context.id) + ")";
  const replacement = "globalThis.__aiExpertsProcedureDir(" + JSON.stringify(context.target) + ")";
  const moduleFile = "globalThis.__aiExpertsModuleFile(" + JSON.stringify(context.target) + ")";
  const runtimeCommand = (rewrite) =>
    "node " + procedureRuntimePath + " --procedure-id " + rewrite.id + " --trigger-" + rewrite.triggerKind + " " + rewrite.triggerId + " --";
  const runtimeProcedureCommand = (rewrite) =>
    "node " + procedureRuntimePath + " --procedure-id " + rewrite.id + " --trigger-" + rewrite.triggerKind + " " + rewrite.triggerId;
  const needsArgsSeparator = (currentSource, offset, match) => {
    const rest = currentSource.slice(offset + match.length).replace(/^[ \\t]+/, "");
    if (rest.startsWith("\\\\n") || rest.startsWith("\\\\r\\\\n")) return false;
    return /^(?:\\\\\\r?\\n|\\S)/.test(rest);
  };
  const renderScriptRewrite = (rewrite, offset, match, currentSource) =>
    needsArgsSeparator(currentSource, offset, match) ? runtimeCommand(rewrite) : runtimeProcedureCommand(rewrite);
  const rewriteScriptCommand = (match, offset, currentSource) => {
    const target = match.replace(/^node\\s+(?:\\.\\/)?/, "");
    if (target === context.target) {
      return context.primaryTrigger
        ? renderScriptRewrite({ id: context.id, triggerKind: context.primaryTrigger.triggerKind, triggerId: context.primaryTrigger.triggerId }, offset, match, currentSource)
        : match;
    }
    for (const skillId of context.ownerSkillIds || []) {
      const ownerRewrite = commandRewrites[JSON.stringify(["skill", skillId, target])];
      if (ownerRewrite) return renderScriptRewrite(ownerRewrite, offset, match, currentSource);
    }
    for (const agentId of context.ownerAgentIds || []) {
      const ownerRewrite = commandRewrites[JSON.stringify(["agent", agentId, target])];
      if (ownerRewrite) return renderScriptRewrite(ownerRewrite, offset, match, currentSource);
    }
    const globalRewrite = commandRewrites[JSON.stringify(["", "", target])];
    return globalRewrite ? renderScriptRewrite(globalRewrite, offset, match, currentSource) : match;
  };
  const rewriteProcedureIdReference = (match, procedureId) => {
    const rewrite = commandRewritesByProcedureId[procedureId];
    return rewrite ? runtimeProcedureCommand(rewrite) : match;
  };
  return source
    .replace(/\\bentry\\s*:\\s*procedureEntry\\s*\\(\\s*import\\.meta\\.url\\s*\\)/g, "entry: " + sanitizedEntry)
    .replace(/\\bpath\\.dirname\\s*\\(\\s*fileURLToPath\\s*\\(\\s*import\\.meta\\.url\\s*\\)\\s*\\)/g, replacement)
    .replace(/(?<!\\.)\\bdirname\\s*\\(\\s*fileURLToPath\\s*\\(\\s*import\\.meta\\.url\\s*\\)\\s*\\)/g, replacement)
    .replace(/\\bpath\\.dirname\\s*\\(\\s*__filename\\s*\\)/g, replacement)
    .replace(/(?<!\\.)\\bdirname\\s*\\(\\s*__filename\\s*\\)/g, replacement)
    .replace(/\\bfileURLToPath\\s*\\(\\s*import\\.meta\\.url\\s*\\)/g, moduleFile)
    .replace(/\\b([a-z0-9]+(?:-[a-z0-9]+)+) procedure\\b/g, rewriteProcedureIdReference)
    .replace(/\\bnode\\s+(?:\\.\\/)?scripts\\/[A-Za-z0-9._/-]+\\.mjs\\b/g, rewriteScriptCommand);
};
`;
}

function pushCommandRewriteValue(
  map: Map<string, ProcedureCommandRewrite[]>,
  key: string,
  value: ProcedureCommandRewrite,
): void {
  const values = map.get(key) ?? [];
  if (!values.some((existing) =>
    existing.id === value.id &&
    existing.triggerKind === value.triggerKind &&
    existing.triggerId === value.triggerId
  )) {
    values.push(value);
  }
  map.set(key, values);
}

function primaryProcedureTrigger(
  procedure: ProcedureCommandRewriteCandidate,
): Omit<ProcedureCommandRewrite, "id"> | null {
  const skillId = procedure.owners.skillIds[0];
  if (skillId) return { triggerKind: "skill", triggerId: skillId };
  const agentId = procedure.owners.agentIds[0];
  if (agentId) return { triggerKind: "agent", triggerId: agentId };
  return null;
}

export function buildProcedureCommandRewrites(
  procedures: readonly ProcedureCommandRewriteCandidate[],
): Record<string, ProcedureCommandRewrite> {
  const byOwnerAndTarget = new Map<string, ProcedureCommandRewrite[]>();
  const byTarget = new Map<string, ProcedureCommandRewrite[]>();

  for (const procedure of procedures) {
    const primaryTrigger = primaryProcedureTrigger(procedure);
    if (primaryTrigger) {
      pushCommandRewriteValue(byTarget, JSON.stringify(["", "", procedure.target]), {
        id: procedure.id,
        ...primaryTrigger,
      });
    }
    for (const skillId of procedure.owners.skillIds) {
      pushCommandRewriteValue(byOwnerAndTarget, JSON.stringify(["skill", skillId, procedure.target]), {
        id: procedure.id,
        triggerKind: "skill",
        triggerId: skillId,
      });
    }
    for (const agentId of procedure.owners.agentIds) {
      pushCommandRewriteValue(byOwnerAndTarget, JSON.stringify(["agent", agentId, procedure.target]), {
        id: procedure.id,
        triggerKind: "agent",
        triggerId: agentId,
      });
    }
  }

  const rewrites: Record<string, ProcedureCommandRewrite> = {};
  for (const [key, commands] of [...byTarget, ...byOwnerAndTarget]) {
    if (commands.length === 1) rewrites[key] = commands[0]!;
  }
  return rewrites;
}

function webpackExternal(
  data: { request?: string },
  callback: (error?: Error | null, result?: string) => void,
): void {
  const request = data.request;
  if (request?.startsWith("node:")) {
    callback(null, `module ${request}`);
    return;
  }
  if (isExternalRuntimeImport(request)) {
    callback(null, `node-commonjs ${request}`);
    return;
  }
  callback();
}

function runWebpack(config: Configuration): Promise<void> {
  return new Promise((resolve, reject) => {
    webpack(config, (error?: Error | null, stats?: Stats) => {
      if (error) {
        reject(error);
        return;
      }
      if (stats?.hasErrors()) {
        reject(new Error(stats.toString({ all: false, errors: true, warnings: true })));
        return;
      }
      resolve();
    });
  });
}

async function emitBundledProceduresFile(
  root: string,
  runtimeProcedures: readonly RuntimeProcedureModule[],
  platform: PlatformType,
): Promise<string> {
  const tempDir = mkdtempSync(join(tmpdir(), "ai-experts-procedure-webpack-"));
  const entryFile = join(tempDir, "procedure-runtime-entry.ts");
  const loaderFile = join(tempDir, "procedure-path-loader.cjs");
  const transformContexts = new Map(
    runtimeProcedures.map((procedure) => [
      normalizeSeparators(procedure.sourcePath),
      {
        id: procedure.id,
        target: procedure.target,
        ownerSkillIds: procedure.owners.skillIds,
        ownerAgentIds: procedure.owners.agentIds,
        primaryTrigger: primaryProcedureTrigger(procedure),
      },
    ]),
  );
  const commandRewrites = buildProcedureCommandRewrites(runtimeProcedures);
  const commandRewritesByProcedureId = Object.fromEntries(
    runtimeProcedures.flatMap((procedure) => {
      const primaryTrigger = primaryProcedureTrigger(procedure);
      return primaryTrigger ? [[procedure.id, { id: procedure.id, ...primaryTrigger }]] : [];
    }),
  );
  writeFileSync(entryFile, renderProceduresEntrypoint(runtimeProcedures, platform), "utf-8");
  writeFileSync(loaderFile, renderProcedurePathLoader(), "utf-8");

  try {
    await runWebpack({
      mode: "production",
      target: "node20",
      entry: entryFile,
      output: {
        path: root,
        filename: "procedures.js",
        module: true,
        chunkFormat: "module",
        pathinfo: false,
        environment: {
          module: true,
          dynamicImport: true,
          const: true,
          arrowFunction: true,
        },
      },
      experiments: {
        outputModule: true,
        topLevelAwait: true,
      },
      externalsType: "module",
      externalsPresets: {
        node: true,
      },
      externals: [webpackExternal],
      resolve: {
        extensions: [".ts", ".js", ".mjs", ".json"],
      },
      module: {
        rules: [
          {
            test: /\.[cm]?tsx?$/u,
            use: [
              {
                loader: "esbuild-loader",
                options: {
                  loader: "ts",
                  target: "node20",
                },
              },
              {
                loader: loaderFile,
                options: {
                  contexts: Object.fromEntries(transformContexts),
                  commandRewrites,
                  commandRewritesByProcedureId,
                  procedureRuntimePath: procedureRuntimePath(platform),
                },
              },
            ],
          },
        ],
      },
      optimization: {
        moduleIds: "named",
        chunkIds: "named",
        minimize: false,
        concatenateModules: false,
        splitChunks: false,
        runtimeChunk: false,
      },
      plugins: [
        new webpack.BannerPlugin({
          banner: "#!/usr/bin/env node",
          raw: true,
          entryOnly: true,
        }),
      ],
      devtool: false,
      stats: "errors-warnings",
    });
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
  const proceduresFile = join(root, "procedures.js");
  const bundledSource = readFileSync(proceduresFile, "utf-8");
  const canonicalSource = canonicalizeProcedureBundleSource(bundledSource, platform);
  if (canonicalSource !== bundledSource) writeFileSync(proceduresFile, canonicalSource, "utf-8");
  return canonicalSource;
}

export function collectPlatformProcedures(componentSurface: ComponentSurface, platform: PlatformType): ProcedureDefinition[] {
  const enabledSkillIds = new Set(
    componentSurface.skills
      .filter((skill) => skill.platforms.includes(platform))
      .map((skill) => skill.id),
  );
  const enabledAgentIds = new Set(
    componentSurface.agents
      .filter((agent) => agent.platforms.includes(platform))
      .map((agent) => agent.id),
  );
  const enabledProcedureIds = new Set<string>();
  for (const skill of componentSurface.skills) {
    if (!skill.platforms.includes(platform)) continue;
    for (const procedureUse of listProcedureUses(skill)) {
      if (procedureUseAppliesToPlatform(procedureUse, platform)) enabledProcedureIds.add(procedureUse.id);
    }
  }
  for (const agent of componentSurface.agents) {
    if (!agent.platforms.includes(platform)) continue;
    for (const procedureUse of listProcedureUses(agent)) {
      if (procedureUseAppliesToPlatform(procedureUse, platform)) enabledProcedureIds.add(procedureUse.id);
    }
  }

  return componentSurface.procedures
    .filter((procedure) => enabledProcedureIds.has(procedure.id))
    .filter((procedure) => !procedure.platforms || procedure.platforms.includes(platform))
    .filter((procedure) => {
      const ownerSkills = procedure.owners.skillIds ?? [];
      const ownerAgents = procedure.owners.agentIds ?? [];
      return ownerSkills.some((id) => enabledSkillIds.has(id)) ||
        ownerAgents.some((id) => enabledAgentIds.has(id));
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

function componentUsesProcedureOnPlatform(
  component: { procedures?: readonly ProcedureUseReference[] },
  procedureId: string,
  platform: PlatformType,
): boolean {
  return listProcedureUses(component)
    .some((procedureUse) => procedureUse.id === procedureId && procedureUseAppliesToPlatform(procedureUse, platform));
}

export function collectPlatformProcedureOwners(
  componentSurface: ComponentSurface,
  procedure: ProcedureDefinition,
  platform: PlatformType,
): RuntimeProcedureEntry["owners"] {
  const skillsById = new Map(componentSurface.skills.map((skill) => [skill.id, skill]));
  const agentsById = new Map(componentSurface.agents.map((agent) => [agent.id, agent]));
  return {
    skillIds: (procedure.owners.skillIds ?? []).filter((skillId) => {
      const skill = skillsById.get(skillId);
      return Boolean(
        skill &&
        skill.platforms.includes(platform) &&
        componentUsesProcedureOnPlatform(skill, procedure.id, platform),
      );
    }),
    agentIds: (procedure.owners.agentIds ?? []).filter((agentId) => {
      const agent = agentsById.get(agentId);
      return Boolean(
        agent &&
        agent.platforms.includes(platform) &&
        componentUsesProcedureOnPlatform(agent, procedure.id, platform),
      );
    }),
  };
}

function toRuntimeProcedureEntry(
  componentSurface: ComponentSurface,
  procedure: ProcedureDefinition,
  platform: PlatformType,
): RuntimeProcedureModule {
  const sourcePath = toStableProcedureSourcePath(procedure);
  const owners = collectPlatformProcedureOwners(componentSurface, procedure, platform);
  return {
    id: procedure.id,
    target: procedureRuntimeTarget(procedure),
    runtime: "node",
    description: procedure.description,
    owners,
    argsSchema: schemaName(procedure.args),
    outputSchema: schemaName(procedure.output),
    params: procedure.params?.map((param) => ({
      flag: param.flag,
      type: param.type,
      description: param.description,
      required: Boolean(param.required),
    })),
    exampleArgs: procedure.exampleArgs,
    sourcePath,
  };
}

function schemaName(schema: { typeName: string } | undefined): string | null {
  return schema?.typeName ?? null;
}

export async function emitProcedureRuntime(
  componentSurface: ComponentSurface,
  root: string,
  platform: PlatformType,
): Promise<ProcedureRuntimeBuildResult> {
  const platformProcedures = collectPlatformProcedures(componentSurface, platform);
  const runtimeProcedures = platformProcedures.map((procedure) =>
    toRuntimeProcedureEntry(componentSurface, procedure, platform),
  );
  const proceduresSource = await emitBundledProceduresFile(root, runtimeProcedures, platform);
  const proceduresFile = "procedures.js";

  return {
    proceduresFile,
    bundleChecksum: checksum(proceduresSource),
    procedures: runtimeProcedures.map((procedure) => toManifestEntry(procedure, proceduresFile)),
  };
}
