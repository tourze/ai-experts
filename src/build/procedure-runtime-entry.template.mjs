import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";

const procedures = __AI_EXPERTS_PROCEDURES_JSON__;
__AI_EXPERTS_PROCEDURE_LOADERS__
const version = "procedure-runtime-v3";
const platform = __AI_EXPERTS_PLATFORM_JSON__;
const procedureRuntimePath = __AI_EXPERTS_RUNTIME_PATH_JSON__;
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
  process.stdout.write(JSON.stringify(payload) + "\n");
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
  return "  " + param.flag + type + required + "\n      " + param.description;
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
  return lines.join("\n") + "\n";
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
