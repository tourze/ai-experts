import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import webpack, { type Configuration, type Stats } from "webpack";
import type {
  Platform as PlatformType,
  ProcedureDefinition,
} from "../components/sdk";
import { sourceRoot, toAbsolutePath } from "./core.ts";
import { listProcedureUses } from "./script-uses.ts";
import type { ComponentSurface } from "./types.ts";

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
};

type RuntimeProcedureModule = RuntimeProcedureEntry & {
  sourcePath: string;
};

type ProcedureManifestEntry = RuntimeProcedureEntry & {
  bundled: true;
};

export type ScriptRuntimeBuildResult = {
  proceduresFile: string;
  bundleChecksum: string;
  procedures: ProcedureManifestEntry[];
};

const runtimeEntryId = "virtual:ai-experts-procedure-runtime-entry";

function normalizeSeparators(path: string): string {
  return path.replaceAll("\\", "/");
}

function normalizeProcedureTarget(target: string): string {
  const normalized = normalizeSeparators(target).replace(/\.ts$/u, ".mjs");
  if (
    normalized.startsWith("/") ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    normalized.includes("/../")
  ) {
    throw new Error(`Invalid procedure target: ${target}`);
  }
  return normalized;
}

function toProcedureTarget(procedure: ProcedureDefinition): string {
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

function toManifestEntry(procedure: RuntimeProcedureModule): ProcedureManifestEntry {
  const { sourcePath: _sourcePath, ...entry } = procedure;
  return { ...entry, bundled: true };
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
  return id.startsWith("node:") ||
    (!id.startsWith(".") && !id.startsWith("/") && !id.startsWith("\0") && id !== runtimeEntryId);
}

function renderProceduresEntrypoint(procedures: readonly RuntimeProcedureModule[]): string {
  const procedureMap = Object.fromEntries(procedures.map((procedure) => [procedure.id, metadataForRuntime(procedure)]));
  return `
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, realpathSync } from "node:fs";
import { delimiter, dirname, join, resolve } from "node:path";

const procedures = ${JSON.stringify(procedureMap)};
${renderProcedureLoaders(procedures)}
const version = "procedure-runtime-v3";
const runtimeFile = realpathSync(resolve(process.argv[1] || "."));
const runtimeRoot = dirname(runtimeFile);

function parseCliArgs(argv) {
  const parsed = {
    requestJson: null,
    sessionId: null,
    triggerSkill: null,
    triggerAgent: null,
    procedureId: null,
    passthroughArgs: [],
  };

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
    if (arg === "--request-json" || arg === "--session-id" || arg === "--trigger-skill" || arg === "--trigger-agent" || arg === "--procedure-id") {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) {
        throw new Error(String(arg) + " requires a value");
      }
      index += 1;
      if (arg === "--request-json") parsed.requestJson = value;
      if (arg === "--session-id") parsed.sessionId = value;
      if (arg === "--trigger-skill") parsed.triggerSkill = value;
      if (arg === "--trigger-agent") parsed.triggerAgent = value;
      if (arg === "--procedure-id") parsed.procedureId = value;
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

function parseRequestJson(rawValue) {
  if (rawValue == null || rawValue.trim() === "") return {};
  const parsed = JSON.parse(rawValue);
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("--request-json must be a JSON object");
  }
  return parsed;
}

function resolveProcedureArgs(requestPayload) {
  const args = requestPayload.args;
  if (args == null) return [];
  if (!Array.isArray(args)) {
    throw new Error("request-json field args must be an array when provided");
  }
  return args.map((item) => String(item));
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

function activeOwnerRoot(procedure, trigger) {
  if (trigger.skillId) return join(runtimeRoot, "skills", trigger.skillId);
  if (trigger.agentId) return join(runtimeRoot, "agents", trigger.agentId);
  const fallbackSkill = procedure.owners?.skillIds?.[0];
  if (fallbackSkill) return join(runtimeRoot, "skills", fallbackSkill);
  const fallbackAgent = procedure.owners?.agentIds?.[0];
  if (fallbackAgent) return join(runtimeRoot, "agents", fallbackAgent);
  return runtimeRoot;
}

function installProcedureGlobals(procedure, trigger) {
  const ownerRoot = activeOwnerRoot(procedure, trigger);
  globalThis.__aiExpertsModuleFile = () => runtimeFile;
  globalThis.__aiExpertsScriptDir = (target) => join(ownerRoot, dirname(String(target)));
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
      usage: "node procedures.js --procedure-id <id> [--request-json <json>] [--session-id <id>] [--trigger-skill <skill-id>] [--trigger-agent <agent-id>] [-- <procedure-args...>]",
      procedures: Object.keys(procedures).sort(),
    },
    error: null,
    timingMs: 0,
    version,
  });
}

async function runProcedureChild(payload) {
  const procedure = procedures[payload.procedureId];
  const loader = procedureLoaders[payload.procedureId];
  if (!procedure || !loader) {
    throw new Error("procedure not found: " + payload.procedureId);
  }
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
  process.env.AI_EXPERTS_PROCEDURE_REQUEST_JSON = JSON.stringify(payload.requestPayload ?? {});
  await loader();
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

    const requestPayload = parseRequestJson(parsed.requestJson);
    if (parsed.passthroughArgs.length > 0) {
      if (Array.isArray(requestPayload.args) && requestPayload.args.length > 0) {
        throw new Error("pass-through args (after --) conflict with request-json args");
      }
      requestPayload.args = parsed.passthroughArgs;
    }

    const procedureArgs = resolveProcedureArgs(requestPayload);
    const childPayload = {
      procedureId: procedure.id,
      args: procedureArgs,
      sessionId: parsed.sessionId ?? "",
      triggerSkill: parsed.triggerSkill ?? "",
      triggerAgent: parsed.triggerAgent ?? "",
      requestPayload,
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
  target: string;
};

function renderProcedurePathLoader(): string {
  return `
module.exports = function aiExpertsProcedurePathLoader(source) {
  const options = this.getOptions() || {};
  const contexts = options.contexts || {};
  const file = String(this.resourcePath || "").replaceAll("\\\\", "/");
  const context = contexts[file];
  if (!context) return source;
  const replacement = "globalThis.__aiExpertsScriptDir(" + JSON.stringify(context.target) + ")";
  const moduleFile = "globalThis.__aiExpertsModuleFile(" + JSON.stringify(context.target) + ")";
  return source
    .replace(/\\bpath\\.dirname\\s*\\(\\s*fileURLToPath\\s*\\(\\s*import\\.meta\\.url\\s*\\)\\s*\\)/g, replacement)
    .replace(/(?<!\\.)\\bdirname\\s*\\(\\s*fileURLToPath\\s*\\(\\s*import\\.meta\\.url\\s*\\)\\s*\\)/g, replacement)
    .replace(/\\bpath\\.dirname\\s*\\(\\s*__filename\\s*\\)/g, replacement)
    .replace(/(?<!\\.)\\bdirname\\s*\\(\\s*__filename\\s*\\)/g, replacement)
    .replace(/\\bfileURLToPath\\s*\\(\\s*import\\.meta\\.url\\s*\\)/g, moduleFile);
};
`;
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

async function emitBundledProceduresFile(root: string, runtimeProcedures: readonly RuntimeProcedureModule[]): Promise<string> {
  const tempDir = mkdtempSync(join(tmpdir(), "ai-experts-procedure-webpack-"));
  const entryFile = join(tempDir, "procedure-runtime-entry.ts");
  const loaderFile = join(tempDir, "procedure-path-loader.cjs");
  const transformContexts = new Map(
    runtimeProcedures.map((procedure) => [
      normalizeSeparators(procedure.sourcePath),
      { target: procedure.target },
    ]),
  );
  writeFileSync(entryFile, renderProceduresEntrypoint(runtimeProcedures), "utf-8");
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
                },
              },
            ],
          },
        ],
      },
      optimization: {
        moduleIds: "deterministic",
        chunkIds: "deterministic",
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
  return readFileSync(join(root, "procedures.js"), "utf-8");
}

function collectPlatformProcedures(componentSurface: ComponentSurface, platform: PlatformType): ProcedureDefinition[] {
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
    for (const procedureUse of listProcedureUses(skill)) enabledProcedureIds.add(procedureUse.id);
  }
  for (const agent of componentSurface.agents) {
    if (!agent.platforms.includes(platform)) continue;
    for (const procedureUse of listProcedureUses(agent)) enabledProcedureIds.add(procedureUse.id);
  }

  return componentSurface.procedures
    .filter((procedure) => enabledProcedureIds.has(procedure.id))
    .filter((procedure) => {
      const ownerSkills = procedure.owners.skillIds ?? [];
      const ownerAgents = procedure.owners.agentIds ?? [];
      return ownerSkills.some((id) => enabledSkillIds.has(id)) ||
        ownerAgents.some((id) => enabledAgentIds.has(id));
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

function toRuntimeProcedureEntry(procedure: ProcedureDefinition): RuntimeProcedureModule {
  const sourcePath = toStableProcedureSourcePath(procedure);
  return {
    id: procedure.id,
    target: toProcedureTarget(procedure),
    runtime: "node",
    description: procedure.description,
    owners: {
      skillIds: [...(procedure.owners.skillIds ?? [])],
      agentIds: [...(procedure.owners.agentIds ?? [])],
    },
    argsSchema: schemaName(procedure.args),
    outputSchema: schemaName(procedure.output),
    sourcePath,
  };
}

function schemaName(schema: { typeName: string } | undefined): string | null {
  return schema?.typeName ?? null;
}

export async function emitScriptRuntime(
  componentSurface: ComponentSurface,
  root: string,
  platform: PlatformType,
): Promise<ScriptRuntimeBuildResult> {
  const platformProcedures = collectPlatformProcedures(componentSurface, platform);
  const runtimeProcedures = platformProcedures.map(toRuntimeProcedureEntry);
  const proceduresSource = await emitBundledProceduresFile(root, runtimeProcedures);

  return {
    proceduresFile: "procedures.js",
    bundleChecksum: checksum(proceduresSource),
    procedures: runtimeProcedures.map(toManifestEntry),
  };
}
