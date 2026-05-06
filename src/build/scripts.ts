import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import * as esbuild from "esbuild";
import type { Platform as PlatformType, ScriptDefinition } from "../components/sdk";
import type { ProfileSurface } from "./types.ts";
import {
  Platform,
  ensureDir,
  nodeScriptBanner,
  rewriteRuntimeRelativeImports,
  toAbsolutePath,
  writeText,
} from "./core.ts";

type RuntimeScriptEntry = {
  id: string;
  file: string;
  runtime: "node";
  description: string;
  owners: {
    skillIds: readonly string[];
    agentIds: readonly string[];
  };
  argsSchema: string | null;
  outputSchema: string | null;
};

export type ScriptRuntimeBuildResult = {
  runFile: string;
  runBundleChecksum: string;
  scripts: RuntimeScriptEntry[];
};

function normalizeSeparators(path: string): string {
  return path.replaceAll("\\", "/");
}

function toScriptRelativeEntryPath(script: ScriptDefinition): string {
  const sourcePath = toAbsolutePath(script.entry);
  const normalizedSourcePath = normalizeSeparators(sourcePath);
  const marker = "/components/";
  const markerIndex = normalizedSourcePath.lastIndexOf(marker);
  if (markerIndex < 0) {
    throw new Error(`Script ${script.id} entry must be inside a /components/ tree: ${sourcePath}`);
  }
  const relativePath = normalizedSourcePath.slice(markerIndex + marker.length);
  let runtimeRelativePath = relativePath;
  if (runtimeRelativePath.startsWith("scripts/sources/")) {
    runtimeRelativePath = runtimeRelativePath.slice("scripts/sources/".length);
  }
  if (runtimeRelativePath.endsWith(".ts")) {
    return runtimeRelativePath.replace(/\.ts$/u, ".mjs");
  }
  return runtimeRelativePath;
}

async function buildScript(script: ScriptDefinition, outfile: string): Promise<void> {
  const sourcePath = toAbsolutePath(script.entry);
  const runtime = script.runtime ?? "node";
  const bundle = script.bundle ?? true;
  if (runtime !== "node") {
    throw new Error(`Script ${script.id} has unsupported runtime: ${runtime}`);
  }
  ensureDir(dirname(outfile));

  const banner = nodeScriptBanner(sourcePath);
  await esbuild.build({
    entryPoints: [sourcePath],
    outfile,
    bundle,
    platform: "node",
    format: "esm",
    target: "node20",
    banner,
    logLevel: "silent",
  });

  if (!bundle) {
    rewriteRuntimeRelativeImports(outfile);
  }
}

function renderRunEntrypoint(scripts: RuntimeScriptEntry[]): string {
  const scriptMap = JSON.stringify(Object.fromEntries(scripts.map((script) => [script.id, script])), null, 2);
  return `#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scripts = ${scriptMap};
const version = "script-runtime-v2";

function parseCliArgs(argv) {
  const parsed = {
    requestJson: null,
    sessionId: null,
    triggerSkill: null,
    triggerAgent: null,
    scriptId: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }
    if (arg === "--request-json" || arg === "--session-id" || arg === "--trigger-skill" || arg === "--trigger-agent" || arg === "--script-id") {
      const value = argv[index + 1];
      if (value == null || value.startsWith("--")) {
        throw new Error(\`\${arg} requires a value\`);
      }
      index += 1;
      if (arg === "--request-json") parsed.requestJson = value;
      if (arg === "--session-id") parsed.sessionId = value;
      if (arg === "--trigger-skill") parsed.triggerSkill = value;
      if (arg === "--trigger-agent") parsed.triggerAgent = value;
      if (arg === "--script-id") parsed.scriptId = value;
      continue;
    }
    throw new Error(\`unknown argument: \${arg}\`);
  }
  return parsed;
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

function resolveScriptArgs(requestPayload) {
  const args = requestPayload.args;
  if (args == null) return [];
  if (!Array.isArray(args)) {
    throw new Error("request-json field \\"args\\" must be an array when provided");
  }
  return args.map((item) => String(item));
}

function ensureAuthorized(script, parsed) {
  if (!parsed.triggerSkill && !parsed.triggerAgent) {
    throw new Error("one of --trigger-skill or --trigger-agent is required");
  }
  if (parsed.triggerSkill) {
    const allowed = Array.isArray(script.owners?.skillIds) ? script.owners.skillIds : [];
    if (!allowed.includes(parsed.triggerSkill)) {
      throw new Error(\`script \${script.id} is not callable by trigger skill: \${parsed.triggerSkill}\`);
    }
  }
  if (parsed.triggerAgent) {
    const allowed = Array.isArray(script.owners?.agentIds) ? script.owners.agentIds : [];
    if (!allowed.includes(parsed.triggerAgent)) {
      throw new Error(\`script \${script.id} is not callable by trigger agent: \${parsed.triggerAgent}\`);
    }
  }
}

function printResult(payload) {
  process.stdout.write(\`\${JSON.stringify(payload)}\\n\`);
}

function printHelp() {
  printResult({
    ok: true,
    scriptId: null,
    sessionId: null,
    trigger: {},
    result: {
      usage: "node run.js --script-id <id> [--request-json <json>] [--session-id <id>] [--trigger-skill <skill-id>] [--trigger-agent <agent-id>]",
      scripts: Object.keys(scripts).sort(),
    },
    error: null,
    timingMs: 0,
    version,
  });
}

function main() {
  const startAt = Date.now();
  let parsed = null;
  try {
    parsed = parseCliArgs(process.argv.slice(2));
    if (parsed.help) {
      printHelp();
      return;
    }
    if (!parsed.scriptId) {
      throw new Error("--script-id is required");
    }
    const script = scripts[parsed.scriptId];
    if (!script) {
      throw new Error(\`script not found: \${parsed.scriptId}\`);
    }
    ensureAuthorized(script, parsed);
    const requestPayload = parseRequestJson(parsed.requestJson);
    const scriptArgs = resolveScriptArgs(requestPayload);
    const root = dirname(fileURLToPath(import.meta.url));
    const scriptPath = join(root, script.file);
    const child = spawnSync(process.execPath, [scriptPath, ...scriptArgs], {
      encoding: "utf-8",
      env: {
        ...process.env,
        AI_EXPERTS_SCRIPT_ID: script.id,
        AI_EXPERTS_SCRIPT_SESSION_ID: parsed.sessionId ?? "",
        AI_EXPERTS_SCRIPT_TRIGGER_SKILL: parsed.triggerSkill ?? "",
        AI_EXPERTS_SCRIPT_TRIGGER_AGENT: parsed.triggerAgent ?? "",
        AI_EXPERTS_SCRIPT_REQUEST_JSON: JSON.stringify(requestPayload),
      },
    });

    const success = (child.status ?? 1) === 0;
    const payload = {
      ok: success,
      scriptId: script.id,
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
            code: "SCRIPT_EXECUTION_FAILED",
            message: \`script exited with code \${child.status ?? 1}\`,
          },
      timingMs: Date.now() - startAt,
      version,
    };
    printResult(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    printResult({
      ok: false,
      scriptId: parsed?.scriptId ?? null,
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

main();
`;
}

function checksum(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function toRuntimeScriptEntry(script: ScriptDefinition, file: string): RuntimeScriptEntry {
  return {
    id: script.id,
    file: normalizeSeparators(file),
    runtime: "node",
    description: script.description,
    owners: {
      skillIds: [...(script.owners.skillIds ?? [])],
      agentIds: [...(script.owners.agentIds ?? [])],
    },
    argsSchema: script.argsSchema ?? null,
    outputSchema: script.outputSchema ?? null,
  };
}

function collectPlatformScripts(profileSurface: ProfileSurface, platform: PlatformType): ScriptDefinition[] {
  const enabledSkillIds = new Set(
    profileSurface.skills
      .filter((skill) => skill.platforms.includes(platform))
      .map((skill) => skill.id),
  );
  const enabledAgentIds = new Set(
    profileSurface.agents
      .filter((agent) => agent.platforms.includes(platform))
      .map((agent) => agent.id),
  );
  const enabledScriptIds = new Set<string>();
  for (const skill of profileSurface.skills) {
    if (!skill.platforms.includes(platform)) continue;
    for (const scriptId of skill.scripts ?? []) enabledScriptIds.add(scriptId);
  }
  for (const agent of profileSurface.agents) {
    if (!agent.platforms.includes(platform)) continue;
    for (const scriptId of agent.scripts ?? []) enabledScriptIds.add(scriptId);
  }
  return profileSurface.scripts
    .filter((script) => enabledScriptIds.has(script.id))
    .filter((script) => {
      const ownerSkills = script.owners.skillIds ?? [];
      const ownerAgents = script.owners.agentIds ?? [];
      return ownerSkills.some((id) => enabledSkillIds.has(id)) ||
        ownerAgents.some((id) => enabledAgentIds.has(id));
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function emitScriptRuntime(
  profileSurface: ProfileSurface,
  root: string,
  platform: PlatformType,
): Promise<ScriptRuntimeBuildResult> {
  const scriptsRoot = join(root, "scripts");
  ensureDir(scriptsRoot);
  const platformScripts = collectPlatformScripts(profileSurface, platform);
  const runtimeScripts: RuntimeScriptEntry[] = [];

  for (const script of platformScripts) {
    const relativeEntryPath = toScriptRelativeEntryPath(script);
    const outputPath = join(scriptsRoot, relativeEntryPath);
    await buildScript(script, outputPath);
    runtimeScripts.push(toRuntimeScriptEntry(script, normalizeSeparators(join("scripts", relativeEntryPath))));
  }

  const runSource = renderRunEntrypoint(runtimeScripts);
  const runFile = join(root, "run.js");
  writeText(runFile, runSource);
  return {
    runFile: "run.js",
    runBundleChecksum: checksum(runSource),
    scripts: runtimeScripts,
  };
}
