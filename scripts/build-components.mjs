#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const sourceRoot = join(repoRoot, "src/components");

const Platform = {
  Claude: "claude-code",
  Codex: "codex-cli",
};

const InvocationPolicy = {
  ExplicitOnly: "explicit-only",
  ModelOnly: "model-only",
};

const HookEvent = {
  PostToolUse: "PostToolUse",
  PreToolUse: "PreToolUse",
  UserPromptSubmit: "UserPromptSubmit",
};

function parseArgs(argv) {
  const args = { outDir: join(repoRoot, "dist"), check: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check") args.check = true;
    else if (arg === "--out-dir" && argv[index + 1]) {
      args.outDir = resolve(argv[index + 1]);
      index += 1;
    } else if (arg.startsWith("--out-dir=")) {
      args.outDir = resolve(arg.slice("--out-dir=".length));
    } else if (arg === "-h" || arg === "--help") {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function writeText(path, content) {
  ensureDir(dirname(path));
  writeFileSync(path, content, "utf-8");
}

function collectFiles(root, predicate = () => true) {
  const files = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && predicate(full)) files.push(full);
    }
  }
  if (existsSync(root)) walk(root);
  return files.sort();
}

function needsRuntimeJsExtension(specifier) {
  if (!specifier.startsWith(".")) return false;
  const [pathPart] = specifier.split(/[?#]/, 1);
  return !/\.(?:js|mjs|cjs|json|node)$/u.test(pathPart);
}

function appendRuntimeJsExtension(specifier) {
  if (!needsRuntimeJsExtension(specifier)) return specifier;
  const match = specifier.match(/^([^?#]*)(.*)$/);
  return `${match[1]}.js${match[2]}`;
}

function rewriteRelativeImportSpecifiers(source) {
  return source
    .replace(/(\bfrom\s*["'])(\.[^"']+)(["'])/g, (_match, prefix, specifier, suffix) =>
      `${prefix}${appendRuntimeJsExtension(specifier)}${suffix}`)
    .replace(/(\bimport\s*["'])(\.[^"']+)(["'])/g, (_match, prefix, specifier, suffix) =>
      `${prefix}${appendRuntimeJsExtension(specifier)}${suffix}`)
    .replace(/(\bimport\s*\(\s*["'])(\.[^"']+)(["']\s*\))/g, (_match, prefix, specifier, suffix) =>
      `${prefix}${appendRuntimeJsExtension(specifier)}${suffix}`);
}

function rewriteCompiledJsImports(root) {
  for (const file of collectFiles(root, (candidate) => candidate.endsWith(".js"))) {
    const source = readFileSync(file, "utf-8");
    const rewritten = rewriteRelativeImportSpecifiers(source);
    if (rewritten !== source) {
      writeFileSync(file, rewritten, "utf-8");
    }
  }
}

function toAbsolutePath(source) {
  if (source instanceof URL) return fileURLToPath(source);
  if (typeof source === "string") return resolve(repoRoot, source);
  throw new Error(`Unsupported component file reference: ${String(source)}`);
}

function displayPath(source) {
  const absolute = toAbsolutePath(source);
  const rel = relative(repoRoot, absolute);
  return rel.startsWith("..") ? absolute : rel;
}

function readComponentText(source) {
  return readFileSync(toAbsolutePath(source), "utf-8");
}

function copyComponentPath(source, target) {
  const absoluteSource = toAbsolutePath(source);
  if (!existsSync(absoluteSource)) {
    throw new Error(`Missing source path: ${displayPath(source)}`);
  }
  ensureDir(dirname(target));
  cpSync(absoluteSource, target, {
    recursive: true,
    force: true,
    dereference: false,
  });
}

function yamlScalar(value) {
  return JSON.stringify(String(value));
}

function tomlString(value) {
  return JSON.stringify(String(value));
}

function tomlMultiline(value) {
  return `"""\n${String(value).replace(/"""/g, '\\"\\"\\"')}\n"""`;
}

function renderToolMatcher(matcher) {
  if (typeof matcher === "string") return matcher;
  if (matcher.kind === "mcp") {
    return matcher.tool
      ? `mcp__${matcher.server}__${matcher.tool}`
      : `mcp__${matcher.server}__.*`;
  }
  if (matcher.kind === "regex") return matcher.source;
  throw new Error(`Unsupported matcher: ${JSON.stringify(matcher)}`);
}

function renderHookMatcher(hook) {
  if (!hook.matcher || hook.matcher.length === 0) return "";
  return hook.matcher.map(renderToolMatcher).join("|");
}

function defaultReferenceTarget(reference) {
  const sourcePath = toAbsolutePath(reference.source);
  const name = basename(sourcePath);
  return reference.target ?? `references/${name}`;
}

function selectProfile(registry) {
  const profiles = registry.profiles ?? [];
  const profile = profiles.find((item) => item.id === registry.defaultProfile) ?? profiles[0];
  if (!profile) {
    throw new Error("registry.profiles must include a default profile");
  }
  return profile;
}

function byId(items, kind) {
  const map = new Map();
  for (const item of items ?? []) {
    if (map.has(item.id)) throw new Error(`Duplicate ${kind} id: ${item.id}`);
    map.set(item.id, item);
  }
  return map;
}

function materializeProfile(registry) {
  const profile = selectProfile(registry);
  const instructions = byId(registry.instructions, "instruction");
  const skills = byId(registry.skills, "skill");
  const agents = byId(registry.agents, "agent");
  const hooks = byId(registry.hooks, "hook");

  const pick = (map, ids, kind) => ids.map((id) => {
    const value = map.get(id);
    if (!value) throw new Error(`Profile ${profile.id} references missing ${kind}: ${id}`);
    return value;
  });

  return {
    profile,
    instructions: pick(instructions, profile.instructions, "instruction"),
    skills: pick(skills, profile.skills, "skill"),
    agents: pick(agents, profile.agents, "agent"),
    hooks: pick(hooks, profile.hooks, "hook"),
  };
}

async function compileRegistry() {
  const tempDir = join(tmpdir(), `ai-experts-components-${process.pid}-${Date.now()}`);
  const tempComponentsRoot = join(tempDir, "components");
  cpSync(sourceRoot, tempComponentsRoot, { recursive: true, force: true });

  const entryPoints = collectFiles(tempComponentsRoot, (file) => file.endsWith(".ts"));
  await esbuild.build({
    entryPoints,
    outdir: tempComponentsRoot,
    outbase: tempComponentsRoot,
    bundle: false,
    platform: "node",
    format: "esm",
    target: "node20",
    logLevel: "silent",
  });
  rewriteCompiledJsImports(tempComponentsRoot);

  const registryUrl = pathToFileURL(join(tempComponentsRoot, "registry.js"));
  const mod = await import(`${registryUrl.href}?t=${Date.now()}`);
  return { registry: mod.registry, tempDir };
}

function renderSkillFrontmatter(skill, platform) {
  const lines = ["---", `name: ${skill.id}`, `description: ${yamlScalar(skill.description)}`];
  if (platform === Platform.Claude) {
    if (skill.invocation === InvocationPolicy.ExplicitOnly) {
      lines.push("disable-model-invocation: true");
    }
    if (skill.invocation === InvocationPolicy.ModelOnly) {
      lines.push("user-invocable: false");
    }
    const tools = (skill.tools ?? []).filter((tool) => typeof tool === "string").map(String);
    if (tools.length > 0) {
      lines.push("allowed-tools:");
      for (const tool of tools) lines.push(`  - ${tool}`);
    }
  }
  lines.push("---", "");
  return lines.join("\n");
}

function renderScriptRegistry(skill, platform) {
  if (!skill.scripts || skill.scripts.length === 0) return "";
  const skillDir = platform === Platform.Claude
    ? "${CLAUDE_SKILL_DIR}"
    : "<this skill directory>";
  const rows = [
    "| Script | 作用 | 调用 |",
    "|--------|------|------|",
    ...skill.scripts.map((script) =>
      `| \`${script.id}\` | ${script.description} | \`node ${skillDir}/scripts/run.mjs ${script.id}\` |`
    ),
  ];
  return `\n## Script Registry\n\n${rows.join("\n")}\n`;
}

function renderReferenceMap(skill) {
  if (!skill.references || skill.references.length === 0) return "";
  const rows = [
    "| Reference | 内容 | 何时读取 |",
    "|-----------|------|----------|",
    ...skill.references.map((reference) =>
      `| [${reference.id}](${defaultReferenceTarget(reference)}) | ${reference.summary} | ${reference.loadWhen} |`
    ),
  ];
  return `\n## Reference Map\n\n${rows.join("\n")}\n`;
}

function renderSkillMd(skill, platform) {
  if (typeof skill.fullName !== "string" || skill.fullName.trim() === "") {
    throw new Error(`Skill ${skill.id} must define a non-empty fullName`);
  }
  const body = readComponentText(skill.body).trimEnd();
  return [
    renderSkillFrontmatter(skill, platform),
    `# ${skill.fullName}`,
    "",
    body,
    renderScriptRegistry(skill, platform),
    renderReferenceMap(skill),
    "",
  ].join("\n");
}

function renderReferencesIndex(skill) {
  const rows = [
    "| Reference | Title | Summary | Load When |",
    "|-----------|-------|---------|-----------|",
    ...(skill.references ?? []).map((reference) => {
      const target = defaultReferenceTarget(reference);
      const link = target.startsWith("references/") ? target.slice("references/".length) : target;
      return `| [${reference.id}](${link}) | ${reference.title} | ${reference.summary} | ${reference.loadWhen} |`;
    }),
  ];
  return `# Reference Index\n\n${rows.join("\n")}\n`;
}

async function compileSkillScripts(skill, skillRoot) {
  if (skill.scriptRoots && skill.scriptRoots.length > 0) {
    for (const root of skill.scriptRoots) {
      copyComponentPath(root.source, join(skillRoot, root.target ?? "scripts"));
    }
  }
  if (!skill.scripts || skill.scripts.length === 0) return [];
  const scriptsRoot = join(skillRoot, "scripts");
  ensureDir(scriptsRoot);
  const compiled = [];
  for (const script of skill.scripts) {
    const sourcePath = toAbsolutePath(script.entry);
    const runtime = script.runtime ?? (sourcePath.endsWith(".py") ? "python3" : "node");
    const defaultTarget = runtime === "python3" ? `scripts/${script.id}.py` : `scripts/${script.id}.mjs`;
    const target = script.target ?? defaultTarget;
    const outfile = join(skillRoot, target);
    if (script.bundle === false) {
      if (!existsSync(outfile)) copyComponentPath(script.entry, outfile);
    } else {
      await esbuild.build({
        entryPoints: [sourcePath],
        outfile,
        bundle: true,
        platform: "node",
        format: "esm",
        target: "node20",
        banner: { js: "#!/usr/bin/env node" },
        logLevel: "silent",
      });
    }
    compiled.push({
      id: script.id,
      file: target,
      runtime,
      description: script.description,
      argsSchema: script.argsSchema ?? null,
      outputSchema: script.outputSchema ?? null,
    });
  }

  const runner = `#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scripts = ${JSON.stringify(Object.fromEntries(compiled.map((script) => [script.id, script.file])), null, 2)};
const runtimes = ${JSON.stringify(Object.fromEntries(compiled.map((script) => [script.id, script.runtime])), null, 2)};
const [, , scriptId, ...args] = process.argv;

if (!scriptId || !scripts[scriptId]) {
  console.error(\`Usage: node scripts/run.mjs <script-id> [...args]\\n\\nAvailable scripts: \${Object.keys(scripts).join(", ")}\`);
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const command = runtimes[scriptId] === "python3" ? "python3" : process.execPath;
const child = spawnSync(command, [join(here, scripts[scriptId].replace(/^scripts\\//, "")), ...args], {
  stdio: "inherit",
});
process.exit(child.status ?? 1);
`;
  writeText(join(scriptsRoot, "run.mjs"), runner);
  writeText(join(scriptsRoot, "manifest.json"), JSON.stringify({ scripts: compiled }, null, 2) + "\n");
  return compiled;
}

function renderCodexOpenAiYaml(skill) {
  const allowImplicit = skill.invocation !== InvocationPolicy.ExplicitOnly;
  return [
    "interface:",
    `  display_name: ${yamlScalar(skill.id)}`,
    `  short_description: ${yamlScalar(skill.description)}`,
    "policy:",
    `  allow_implicit_invocation: ${allowImplicit ? "true" : "false"}`,
    "",
  ].join("\n");
}

async function emitSkill(skill, platformRoot, platform) {
  const skillRoot = join(platformRoot, "skills", skill.id);
  ensureDir(skillRoot);
  writeText(join(skillRoot, "SKILL.md"), renderSkillMd(skill, platform));
  copyLooseSkillFiles(skill, skillRoot);

  if (skill.references && skill.references.length > 0) {
    for (const reference of skill.references) {
      copyComponentPath(reference.source, join(skillRoot, defaultReferenceTarget(reference)));
    }
    writeText(join(skillRoot, "references", "index.md"), renderReferencesIndex(skill));
  }

  if (skill.assets && skill.assets.length > 0) {
    for (const asset of skill.assets) {
      copyComponentPath(asset.source, join(skillRoot, asset.target ?? `assets/${basename(toAbsolutePath(asset.source))}`));
    }
  }

  await compileSkillScripts(skill, skillRoot);

  if (platform === Platform.Codex) {
    writeText(join(skillRoot, "agents", "openai.yaml"), renderCodexOpenAiYaml(skill));
  }
}

function copyLooseSkillFiles(skill, skillRoot) {
  const sourceDir = dirname(toAbsolutePath(skill.body));
  const reserved = new Set([
    "index.ts",
    "SKILL.body.md",
    "scripts",
    "references",
    "assets",
    "evals",
  ]);
  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    if (reserved.has(entry.name)) continue;
    copyComponentPath(new URL(`./${entry.name}${entry.isDirectory() ? "/" : ""}`, pathToFileURL(`${sourceDir}/`)), join(skillRoot, entry.name));
  }
}

function renderClaudeAgent(agent) {
  const lines = ["---", `name: ${agent.id}`, `description: ${yamlScalar(agent.description)}`];
  const tools = (agent.tools ?? []).filter((tool) => typeof tool === "string").map(String);
  if (tools.length > 0) lines.push(`tools: ${tools.join(", ")}`);
  const preloadSkills = (agent.skills ?? [])
    .filter((skill) => skill.mode === "preload")
    .map((skill) => skill.id);
  if (preloadSkills.length > 0) {
    lines.push("skills:");
    for (const skill of preloadSkills) lines.push(`  - ${skill}`);
  }
  if (agent.model) lines.push(`model: ${agent.model}`);
  if (agent.reasoningEffort) lines.push(`effort: ${agent.reasoningEffort}`);
  lines.push("---", "");

  const skillRoutes = (agent.skills ?? [])
    .map((skill) => `- \`${skill.id}\` (${skill.mode}): ${skill.reason}`)
    .join("\n");
  return [
    lines.join("\n"),
    readComponentText(agent.body).trimEnd(),
    "",
    "## Skill Orchestration",
    skillRoutes,
    "",
  ].join("\n");
}

function renderCodexAgent(agent) {
  const body = readComponentText(agent.body).trimEnd();
  const skillRoutes = (agent.skills ?? [])
    .map((skill) => `- ${skill.id} (${skill.mode}): ${skill.reason}`)
    .join("\n");
  const developerInstructions = [
    body,
    "",
    "Skill orchestration:",
    skillRoutes,
    "",
    "When a listed skill is relevant, explicitly route the work through that skill's workflow.",
  ].join("\n");

  const lines = [
    `name = ${tomlString(agent.id)}`,
    `description = ${tomlString(agent.description)}`,
  ];
  if (agent.model) lines.push(`model = ${tomlString(agent.model)}`);
  if (agent.reasoningEffort) lines.push(`model_reasoning_effort = ${tomlString(agent.reasoningEffort)}`);
  if (agent.sandbox) lines.push(`sandbox_mode = ${tomlString(agent.sandbox)}`);
  lines.push(`developer_instructions = ${tomlMultiline(developerInstructions)}`);
  return `${lines.join("\n")}\n`;
}

async function emitAgent(agent, platformRoot, platform) {
  if (platform === Platform.Claude) {
    writeText(join(platformRoot, "agents", `${agent.id}.md`), renderClaudeAgent(agent));
  } else {
    writeText(join(platformRoot, "agents", `${agent.id}.toml`), renderCodexAgent(agent));
  }
}

async function compileHookModules(hooks, hooksRoot) {
  const modulesRoot = join(hooksRoot, "modules");
  ensureDir(modulesRoot);
  const compiled = [];
  for (const hook of hooks) {
    const outfile = join(modulesRoot, `${hook.id}.mjs`);
    await esbuild.build({
      entryPoints: [toAbsolutePath(hook.entry)],
      outfile,
      bundle: true,
      platform: "node",
      format: "esm",
      target: "node20",
      logLevel: "silent",
    });
    compiled.push({
      id: hook.id,
      event: hook.event,
      matcher: renderHookMatcher(hook),
      order: hook.order ?? 100,
      payloadMode: hook.payloadMode ?? "normalized",
      module: `./modules/${hook.id}.mjs`,
      description: hook.description,
    });
  }
  writeText(join(hooksRoot, "manifest.json"), JSON.stringify({ hooks: compiled }, null, 2) + "\n");
  return compiled.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

function renderDispatcher(compiledHooks, platform) {
  return `#!/usr/bin/env node
const platform = ${JSON.stringify(platform)};
const hooks = ${JSON.stringify(compiledHooks, null, 2)};

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--event") args.event = argv[++index];
    else if (argv[index] === "--platform") args.platform = argv[++index];
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
    /^--- a\\/(.+)$/gm,
    /^\\+\\+\\+ b\\/(.+)$/gm,
  ];
  for (const pattern of patterns) {
    for (const match of command.matchAll(pattern)) targets.push(match[1].trim());
  }
  return [...new Set(targets.filter(Boolean))];
}

function normalize(raw, event) {
  const toolInput = raw.tool_input ?? raw.toolInput;
  const command = typeof toolInput?.command === "string" ? toolInput.command : "";
  const filePath = toolInput?.file_path ?? toolInput?.path;
  const fileTargets = [];
  if (typeof filePath === "string") fileTargets.push(filePath);
  if (command) fileTargets.push(...fileTargetsFromPatch(command));
  return {
    platform,
    event,
    cwd: raw.cwd ?? process.cwd(),
    sessionId: raw.session_id,
    transcriptPath: raw.transcript_path ?? null,
    permissionMode: raw.permission_mode,
    turnId: raw.turn_id,
    prompt: raw.prompt ?? raw.user_prompt ?? raw.message,
    agent: { id: raw.agent_id, type: raw.agent_type },
    tool: {
      name: raw.tool_name,
      input: toolInput,
      response: raw.tool_response ?? raw.toolResult,
      fileTargets: [...new Set(fileTargets)],
    },
    raw,
  };
}

function toLegacyClaudePayload(payload) {
  return {
    ...payload.raw,
    hook_event_name: payload.event,
    cwd: payload.cwd,
    session_id: payload.sessionId,
    transcript_path: payload.transcriptPath,
    permission_mode: payload.permissionMode,
    prompt: payload.prompt,
    tool_name: payload.tool?.name,
    tool_input: payload.tool?.input,
    tool_response: payload.tool?.response,
  };
}

function normalizeHookResult(result) {
  if (!result) return null;
  if (result.kind) return result;
  if (result.decision === "block") {
    return { kind: "deny", message: result.reason || result.message || "Blocked by hook" };
  }
  const additionalContext = result.hookSpecificOutput?.additionalContext || result.additionalContext;
  if (additionalContext) return { kind: "add-context", message: additionalContext };
  if (result.reason || result.message) return { kind: "report", message: result.reason || result.message };
  return null;
}

function mergeResults(results, event) {
  const deny = results.find((result) => result.kind === "deny");
  if (deny) return { decision: "block", reason: deny.message };
  const report = results.find((result) => result.kind === "report");
  const contexts = results
    .filter((result) => result.kind === "add-context")
    .map((result) => result.message);
  if (report && (event === "PostToolUse" || event === "Stop")) {
    return {
      decision: "block",
      reason: report.message,
      hookSpecificOutput: { hookEventName: event, additionalContext: report.message },
    };
  }
  if (report) contexts.push(report.message);
  if (contexts.length > 0) {
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

  for (const hook of hooks.filter((item) => item.event === event)) {
    const mod = await import(new URL(hook.module, import.meta.url));
    if (typeof mod.run !== "function") continue;
    const hookPayload = hook.payloadMode === "claude-raw" ? toLegacyClaudePayload(payload) : payload;
    const result = normalizeHookResult(await mod.run(hookPayload));
    if (result && result.kind !== "allow" && result.kind !== "audit") results.push(result);
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

function renderHookConfig(hooks, platform) {
  const hooksByEvent = {};
  const commandHome = platform === Platform.Claude
    ? '${AI_EXPERTS_CLAUDE_HOME:-$HOME/.claude}'
    : '${AI_EXPERTS_CODEX_HOME:-$HOME/.codex}';
  for (const hook of hooks) {
    const matcher = renderHookMatcher(hook);
    const command = `node "${commandHome}/hooks/dispatch.mjs" --platform ${platform} --event ${hook.event}`;
    const group = {
      hooks: [
        {
          type: "command",
          command,
          timeout: hook.timeoutSeconds ?? 10,
          ...(platform === Platform.Codex && hook.statusMessage
            ? { statusMessage: hook.statusMessage }
            : {}),
        },
      ],
    };
    if (matcher) group.matcher = matcher;
    hooksByEvent[hook.event] ??= [];
    const existing = hooksByEvent[hook.event].find((item) => (item.matcher ?? "") === (group.matcher ?? ""));
    if (existing) existing.hooks.push(...group.hooks);
    else hooksByEvent[hook.event].push(group);
  }
  return { hooks: hooksByEvent };
}

function renderCodexConfig() {
  return [
    "[features]",
    "codex_hooks = true",
    "",
    "[agents]",
    "max_depth = 1",
    "",
  ].join("\n");
}

function renderInstruction(profileSurface, platform) {
  const title = platform === Platform.Claude ? "CLAUDE.md" : "AGENTS.md";
  const instructions = profileSurface.instructions
    .filter((instruction) => instruction.platforms.includes(platform))
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100) || a.id.localeCompare(b.id));
  const body = instructions
    .map((instruction) => readComponentText(instruction.body).trimEnd())
    .join("\n\n");

  const list = (label, items) => [
    `### ${label}`,
    ...(items.length > 0 ? items.map((item) => `- ${item.id}: ${item.description ?? item.title}`) : ["- none"]),
  ].join("\n");

  return [
    body,
    "",
    "## Generated Profile",
    "",
    `- Profile: ${profileSurface.profile.id}`,
    `- Generated file: ${title}`,
    `- Source of truth: src/components/`,
    "",
    list("Skills", profileSurface.skills.filter((item) => item.platforms.includes(platform))),
    "",
    list("Agents", profileSurface.agents.filter((item) => item.platforms.includes(platform))),
    "",
    list("Hooks", profileSurface.hooks.filter((item) => item.platforms.includes(platform))),
    "",
  ].join("\n");
}

function checksumFiles(root) {
  return Object.fromEntries(
    collectFiles(root).map((file) => {
      const hash = createHash("sha256").update(readFileSync(file)).digest("hex");
      return [relative(root, file), hash];
    }),
  );
}

function validateId(id, kind) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(id)) {
    throw new Error(`Invalid ${kind} id: ${id}`);
  }
}

function validateRegistry(registry) {
  if (!registry || !Array.isArray(registry.skills)) throw new Error("registry.skills must be an array");
  if (!Array.isArray(registry.instructions)) throw new Error("registry.instructions must be an array");
  if (!Array.isArray(registry.agents)) throw new Error("registry.agents must be an array");
  if (!Array.isArray(registry.hooks)) throw new Error("registry.hooks must be an array");
  if (!Array.isArray(registry.profiles)) throw new Error("registry.profiles must be an array");

  const surface = materializeProfile(registry);
  const skillIds = new Set(registry.skills.map((skill) => skill.id));

  for (const instruction of registry.instructions) {
    validateId(instruction.id, "instruction");
    if (!existsSync(toAbsolutePath(instruction.body))) {
      throw new Error(`Instruction ${instruction.id} body is missing: ${displayPath(instruction.body)}`);
    }
  }

  for (const skill of registry.skills) {
    validateId(skill.id, "skill");
    if (!skill.description || skill.description.length < 20) {
      throw new Error(`Skill ${skill.id} has a weak description`);
    }
    if (!existsSync(toAbsolutePath(skill.body))) {
      throw new Error(`Skill ${skill.id} body is missing: ${displayPath(skill.body)}`);
    }
    const skillSourceRoot = dirname(toAbsolutePath(skill.body));
    const seenScripts = new Set();
    for (const script of skill.scripts ?? []) {
      validateId(script.id, `script in ${skill.id}`);
      if (seenScripts.has(script.id)) throw new Error(`Duplicate script id in ${skill.id}: ${script.id}`);
      seenScripts.add(script.id);
      if (!existsSync(toAbsolutePath(script.entry))) {
        throw new Error(`Skill ${skill.id} script is missing: ${displayPath(script.entry)}`);
      }
    }
    const scriptsDir = join(skillSourceRoot, "scripts");
    if (existsSync(scriptsDir)) {
      const registeredEntries = new Set((skill.scripts ?? []).map((script) => toAbsolutePath(script.entry)));
      for (const entry of readdirSync(scriptsDir, { withFileTypes: true })) {
        const absoluteEntry = join(scriptsDir, entry.name);
        if (entry.isFile() && entry.name.endsWith(".ts") && !registeredEntries.has(absoluteEntry)) {
          throw new Error(`Skill ${skill.id} has an unregistered script: ${relative(skillSourceRoot, absoluteEntry)}`);
        }
      }
    }
    const seenReferences = new Set();
    for (const reference of skill.references ?? []) {
      validateId(reference.id, `reference in ${skill.id}`);
      if (seenReferences.has(reference.id)) throw new Error(`Duplicate reference id in ${skill.id}: ${reference.id}`);
      seenReferences.add(reference.id);
      if (!existsSync(toAbsolutePath(reference.source))) {
        throw new Error(`Skill ${skill.id} reference is missing: ${displayPath(reference.source)}`);
      }
    }
  }

  for (const agent of registry.agents) {
    validateId(agent.id, "agent");
    if (!existsSync(toAbsolutePath(agent.body))) {
      throw new Error(`Agent ${agent.id} body is missing: ${displayPath(agent.body)}`);
    }
    for (const skill of agent.skills ?? []) {
      if (!skillIds.has(skill.id)) throw new Error(`Agent ${agent.id} references missing skill: ${skill.id}`);
      if (typeof skill.reason !== "string" || skill.reason.trim().length === 0) {
        throw new Error(`Agent ${agent.id} skill ${skill.id} must include a non-empty reason`);
      }
    }
  }

  for (const hook of registry.hooks) {
    validateId(hook.id, "hook");
    if (!existsSync(toAbsolutePath(hook.entry))) {
      throw new Error(`Hook ${hook.id} entry is missing: ${displayPath(hook.entry)}`);
    }
  }

  return surface;
}

async function emitPlatform(profileSurface, outDir, platform) {
  const root = join(outDir, platform === Platform.Claude ? "claude" : "codex");
  rmSync(root, { recursive: true, force: true });
  ensureDir(root);
  ensureDir(join(root, "skills"));
  ensureDir(join(root, "agents"));
  ensureDir(join(root, "hooks"));
  ensureDir(join(root, "rules"));

  const instructionName = platform === Platform.Claude ? "CLAUDE.md" : "AGENTS.md";
  writeText(join(root, instructionName), renderInstruction(profileSurface, platform));

  const platformHooks = profileSurface.hooks.filter((hook) => hook.platforms.includes(platform));
  const compiledHooks = await compileHookModules(platformHooks, join(root, "hooks"));
  writeText(join(root, "hooks", "dispatch.mjs"), renderDispatcher(compiledHooks, platform));

  if (platform === Platform.Claude) {
    writeText(join(root, "settings.json"), JSON.stringify(renderHookConfig(platformHooks, platform), null, 2) + "\n");
  } else {
    writeText(join(root, "hooks.json"), JSON.stringify(renderHookConfig(platformHooks, platform), null, 2) + "\n");
    writeText(join(root, "config.toml"), renderCodexConfig());
  }

  for (const skill of profileSurface.skills) {
    if (skill.platforms.includes(platform)) await emitSkill(skill, root, platform);
  }
  for (const agent of profileSurface.agents) {
    if (agent.platforms.includes(platform)) await emitAgent(agent, root, platform);
  }

  writeText(join(root, "manifest.json"), JSON.stringify({
    schema: 2,
    profile: profileSurface.profile.id,
    platform,
    instructions: profileSurface.instructions
      .filter((item) => item.platforms.includes(platform))
      .map((item) => item.id)
      .sort(),
    skills: profileSurface.skills
      .filter((item) => item.platforms.includes(platform))
      .map((item) => item.id)
      .sort(),
    agents: profileSurface.agents
      .filter((item) => item.platforms.includes(platform))
      .map((item) => item.id)
      .sort(),
    hooks: profileSurface.hooks
      .filter((item) => item.platforms.includes(platform))
      .map((item) => item.id)
      .sort(),
    files: checksumFiles(root),
  }, null, 2) + "\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("Usage: node scripts/build-components.mjs [--out-dir <dir>] [--check]");
    return;
  }

  const { registry, tempDir } = await compileRegistry();
  try {
    const profileSurface = validateRegistry(registry);
    const outDir = args.check
      ? join(tmpdir(), `ai-experts-dist-check-${process.pid}-${Date.now()}`)
      : args.outDir;

    await emitPlatform(profileSurface, outDir, Platform.Claude);
    await emitPlatform(profileSurface, outDir, Platform.Codex);

    const stats = {
      claudeSkills: collectFiles(join(outDir, "claude", "skills")).filter((file) => basename(file) === "SKILL.md").length,
      codexSkills: collectFiles(join(outDir, "codex", "skills")).filter((file) => basename(file) === "SKILL.md").length,
      claudeAgents: collectFiles(join(outDir, "claude", "agents")).length,
      codexAgents: collectFiles(join(outDir, "codex", "agents")).length,
      claudeHooks: collectFiles(join(outDir, "claude", "hooks/modules")).length,
      codexHooks: collectFiles(join(outDir, "codex", "hooks/modules")).length,
    };
    console.log(
      `component build: claude skills=${stats.claudeSkills} agents=${stats.claudeAgents} hooks=${stats.claudeHooks} ` +
      `codex skills=${stats.codexSkills} agents=${stats.codexAgents} hooks=${stats.codexHooks} out=${outDir}`,
    );

    if (args.check) rmSync(outDir, { recursive: true, force: true });
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`component build failed: ${error.stack || error.message || error}`);
  process.exit(1);
});
