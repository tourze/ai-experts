import { rmSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";
import * as esbuild from "esbuild";
import type { HookDefinition } from "../components/sdk";
import {
  ensureDir,
  Platform,
  renderHookMatcher,
  stripBundledSourcePathComments,
  toAbsolutePath,
  writeText,
} from "./core";

type CompiledHook = {
  id: string;
  event: HookDefinition["event"];
  matcher: string;
  order: number;
  description: string;
  timeoutSeconds?: number;
  statusMessage?: string;
  runnerName: string;
  entryPath: string;
};

type HookManifestEntry = Omit<CompiledHook, "runnerName" | "entryPath">;

type CommandHook = {
  type: "command";
  command: string;
  timeout: number;
  statusMessage?: string;
};

type HookConfigGroup = {
  hooks: [CommandHook];
  matcher?: string;
};

export const DEFAULT_COMMAND_HOOK_TIMEOUT_SECONDS = 600;

export function resolveHookTimeoutSeconds(hook: Pick<HookDefinition, "timeoutSeconds">): number {
  return hook.timeoutSeconds ?? DEFAULT_COMMAND_HOOK_TIMEOUT_SECONDS;
}

function relativeImportSpecifier(fromDir: string, targetPath: string): string {
  if (isAbsolute(targetPath)) return targetPath.split("\\").join("/");
  const specifier = relative(fromDir, targetPath).split("\\").join("/");
  return specifier.startsWith(".") ? specifier : `./${specifier}`;
}

export async function compileHookModules(
  hooks: readonly HookDefinition[],
  hooksRoot: string,
  platform: Platform,
): Promise<HookManifestEntry[]> {
  ensureDir(hooksRoot);
  const compiled: CompiledHook[] = hooks
    .map((hook, index) => ({
      id: hook.id,
      event: hook.event,
      matcher: renderHookMatcher(hook),
      order: hook.order ?? 100,
      description: hook.description,
      timeoutSeconds: hook.timeoutSeconds,
      statusMessage: hook.statusMessage,
      runnerName: `runHook${index}`,
      entryPath: toAbsolutePath(hook.entry),
    }))
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

  const manifestHooks: HookManifestEntry[] = compiled.map(({ runnerName, entryPath, ...hook }) => hook);
  writeText(join(hooksRoot, "manifest.json"), JSON.stringify({ hooks: manifestHooks }, null, 2) + "\n");

  const dispatcherEntry = join(hooksRoot, ".dispatch-entry.mjs");
  const dispatcherOutfile = join(hooksRoot, "dispatch.mjs");
  writeText(dispatcherEntry, renderDispatcher(compiled, platform, hooksRoot));
  try {
    await esbuild.build({
      entryPoints: [dispatcherEntry],
      outfile: dispatcherOutfile,
      bundle: true,
      platform: "node",
      format: "esm",
      target: "node20",
      logLevel: "silent",
    });
    stripBundledSourcePathComments(dispatcherOutfile);
  } finally {
    rmSync(dispatcherEntry, { force: true });
  }
  return manifestHooks;
}

function renderDispatcher(
  compiledHooks: readonly CompiledHook[],
  platform: Platform,
  hooksRoot: string,
): string {
  const imports = compiledHooks.map((hook) =>
    `import { run as ${hook.runnerName} } from ${JSON.stringify(relativeImportSpecifier(hooksRoot, hook.entryPath))};`
  );
  const runners = compiledHooks.map((hook) => `  [${JSON.stringify(hook.id)}, ${hook.runnerName}],`);
  const runtimeHooks = compiledHooks.map(({ runnerName, entryPath, ...hook }) => hook);
  return `#!/usr/bin/env node
${imports.join("\n")}

const platform = ${JSON.stringify(platform)};
const hooks = ${JSON.stringify(runtimeHooks, null, 2)};
const hookRunners = new Map([
${runners.join("\n")}
]);

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--event") {
      const value = argv[++index];
      if (!value) throw new Error("--event requires a value");
      args.event = value;
    } else {
      throw new Error("Unknown argument: " + argv[index]);
    }
  }
  return args;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8").trim();
  return text ? JSON.parse(text) : {};
}

function fileTargetsFromPatch(command) {
  const targets = [];
  const patterns = [
    /^\\*\\*\\* (?:Update|Delete) File: (.+)$/gm,
    /^\\*\\*\\* Add File: (.+)$/gm,
    /^\\*\\*\\* Move to: (.+)$/gm,
    /^--- a\\/(.+)$/gm,
    /^\\+\\+\\+ b\\/(.+)$/gm,
  ];
  for (const pattern of patterns) {
    for (const match of command.matchAll(pattern)) targets.push(match[1].trim());
  }
  return [...new Set(targets.filter(Boolean))];
}

function normalizeToolInput(toolInput) {
  if (!toolInput || typeof toolInput !== "object") return undefined;
  const input = { ...toolInput };
  if (typeof input.file_path !== "string") {
    if (typeof input.filePath === "string") input.file_path = input.filePath;
    else if (typeof input.path === "string") input.file_path = input.path;
  }
  return input;
}

function normalize(raw, event) {
  const toolInput = normalizeToolInput(raw.tool_input ?? raw.toolInput ?? raw.tool?.input);
  const toolName = raw.tool_name ?? raw.toolName ?? raw.tool?.name;
  const command = typeof toolInput?.command === "string" ? toolInput.command : "";
  const filePath = toolInput?.file_path;
  const fileTargets = [];
  if (typeof filePath === "string") fileTargets.push(filePath);
  if (command) fileTargets.push(...fileTargetsFromPatch(command));
  return {
    platform,
    event,
    cwd: raw.cwd ?? process.cwd(),
    sessionId: raw.session_id ?? raw.sessionId,
    transcriptPath: raw.transcript_path ?? raw.transcriptPath ?? null,
    permissionMode: raw.permission_mode ?? raw.permissionMode,
    turnId: raw.turn_id ?? raw.turnId,
    stopHookActive: Boolean(raw.stop_hook_active ?? raw.stopHookActive),
    prompt: raw.prompt ?? raw.user_prompt ?? raw.message,
    agent: { id: raw.agent_id ?? raw.agent?.id, type: raw.agent_type ?? raw.agent?.type },
    tool: {
      name: toolName,
      input: toolInput,
      response: raw.tool_response ?? raw.toolResponse ?? raw.toolResult ?? raw.tool?.response,
      fileTargets: [...new Set(fileTargets)],
    },
    raw,
  };
}

function normalizeHookResult(result) {
  if (!result) return null;
  if (result.kind) return result;
  const output = result.hookSpecificOutput;
  const permissionDecision = output?.decision ?? output?.permissionDecision;
  if (permissionDecision?.behavior === "deny" || permissionDecision === "deny") {
    return {
      kind: "deny",
      message: permissionDecision.message || output?.permissionDecisionReason || result.reason || result.message || "Denied by hook",
    };
  }
  if (permissionDecision?.behavior === "allow" || permissionDecision === "allow") {
    return { kind: "allow" };
  }
  if (result.decision === "block") {
    return { kind: "deny", message: result.reason || result.message || "Blocked by hook" };
  }
  const additionalContext = output?.additionalContext || result.additionalContext;
  if (additionalContext) return { kind: "add-context", message: additionalContext };
  if (result.decision === "context") {
    return { kind: "add-context", message: result.reason || result.message || "" };
  }
  if (result.reason || result.message) return { kind: "report", message: result.reason || result.message };
  return null;
}

function matcherMatchesTool(matcher, toolName) {
  if (!matcher) return true;
  if (typeof toolName !== "string" || toolName.length === 0) return false;
  try {
    return new RegExp("^(?:" + matcher + ")$").test(toolName);
  } catch {
    return matcher.split("|").includes(toolName);
  }
}

function hookMatchesPayload(hook, payload) {
  return matcherMatchesTool(hook.matcher, payload.tool?.name);
}

function payloadsForHook(payload) {
  const targets = payload.tool?.fileTargets ?? [];
  const filePath = payload.tool?.input?.file_path;
  if (filePath || targets.length === 0) return [payload];
  return targets.map((target) => ({
    ...payload,
    tool: {
      ...payload.tool,
      input: { ...(payload.tool?.input ?? {}), file_path: target },
      fileTargets: [target],
    },
  }));
}

function isCodexPreToolUse(event) {
  return platform === "codex-cli" && event === "PreToolUse";
}

function mergeResults(results, event) {
  const deny = results.find((result) => result.kind === "deny");
  if (event === "PermissionRequest") {
    if (deny) {
      return {
        hookSpecificOutput: {
          hookEventName: event,
          decision: { behavior: "deny", message: deny.message },
        },
      };
    }
    if (results.some((result) => result.kind === "allow")) {
      return {
        hookSpecificOutput: {
          hookEventName: event,
          decision: { behavior: "allow" },
        },
      };
    }
  }
  if (deny) {
    if (isCodexPreToolUse(event)) {
      return {
        hookSpecificOutput: {
          hookEventName: event,
          permissionDecision: "deny",
          permissionDecisionReason: deny.message,
        },
      };
    }
    return { decision: "block", reason: deny.message };
  }
  const contexts = results
    .filter((result) => result.kind === "add-context")
    .map((result) => result.message);
  const reports = results
    .filter((result) => result.kind === "report")
    .map((result) => result.message);
  contexts.push(...reports);
  if (contexts.length > 0) {
    if (isCodexPreToolUse(event)) {
      return { systemMessage: contexts.join("\\n\\n") };
    }
    return {
      hookSpecificOutput: { hookEventName: event, additionalContext: contexts.join("\\n\\n") },
    };
  }
  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const event = args.event;
  if (!event) throw new Error("Missing --event");
  const raw = await readStdin();
  const payload = normalize(raw, event);
  const results = [];

  for (const hook of hooks.filter((item) => item.event === event && hookMatchesPayload(item, payload))) {
    const run = hookRunners.get(hook.id);
    if (typeof run !== "function") continue;
    for (const hookPayload of payloadsForHook(payload)) {
      const result = normalizeHookResult(await run(hookPayload));
      if (result && result.kind !== "audit") results.push(result);
    }
  }

  const output = mergeResults(results, event);
  if (output) process.stdout.write(JSON.stringify(output, null, 2) + "\\n");
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
`;
}

type HookDispatchGroup = {
  event: HookDefinition["event"];
  matcher: string;
  command: string;
  timeout: number;
  hookCount: number;
  statusMessages: Set<string>;
};

export function renderHookConfig(
  hooks: readonly HookDefinition[],
  platform: Platform,
): { hooks: Record<string, HookConfigGroup[]> } {
  const hooksByEvent: Record<string, HookConfigGroup[]> = {};
  const commandHome = platform === Platform.Claude
    ? "$HOME/.claude"
    : "$HOME/.codex";

  const groups: HookDispatchGroup[] = [];
  const groupsByKey = new Map<string, HookDispatchGroup>();
  for (const hook of hooks) {
    const matcher = renderHookMatcher(hook);
    const command = `node "${commandHome}/hooks/dispatch.mjs" --event ${hook.event}`;
    const key = `${hook.event}\0${matcher}`;
    let group = groupsByKey.get(key);
    if (!group) {
      group = {
        event: hook.event,
        matcher,
        command,
        timeout: 0,
        hookCount: 0,
        statusMessages: new Set<string>(),
      };
      groupsByKey.set(key, group);
      groups.push(group);
    }
    group.timeout += resolveHookTimeoutSeconds(hook);
    group.hookCount += 1;
    if (hook.statusMessage) group.statusMessages.add(hook.statusMessage);
  }

  for (const group of groups) {
    const commandHook: CommandHook = {
      type: "command",
      command: group.command,
      timeout: group.timeout,
    };
    if (platform === Platform.Codex && group.hookCount === 1 && group.statusMessages.size === 1) {
      commandHook.statusMessage = [...group.statusMessages][0];
    }
    const hookGroup: HookConfigGroup = { hooks: [commandHook] };
    if (group.matcher) hookGroup.matcher = group.matcher;
    hooksByEvent[group.event] ??= [];
    hooksByEvent[group.event].push(hookGroup);
  }
  return { hooks: hooksByEvent };
}

export function renderCodexConfig(): string {
  return [
    "[features]",
    "codex_hooks = true",
    "",
    "[agents]",
    "max_depth = 1",
    "",
  ].join("\n");
}
