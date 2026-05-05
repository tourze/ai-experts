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
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
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

function stripBundledSourcePathComments(file) {
  const source = readFileSync(file, "utf-8");
  const stripped = source.replace(
    /^\/\/ .*?(?:[\\/]components[\\/].*|[\\/]hooks[\\/]\.dispatch-entry)\.(?:ts|mjs)\r?\n/gm,
    "",
  );
  if (stripped !== source) {
    writeFileSync(file, stripped, "utf-8");
  }
}

function renderDiscoveredHooksIndex(componentsRoot) {
  const hooksRoot = join(componentsRoot, "hooks");
  const hookFiles = collectFiles(hooksRoot, (file) =>
    file.endsWith(".ts") &&
    basename(file) !== "index.ts" &&
    !relative(hooksRoot, file).split("\\").join("/").startsWith("_shared/")
  );
  const imports = [];
  const values = [];
  for (const [index, file] of hookFiles.entries()) {
    const source = readFileSync(file, "utf-8");
    const exportName = source.match(/export\s+const\s+([A-Za-z0-9_$]+)\s*=\s*defineHook\s*\(/u)?.[1];
    if (!exportName) continue;
    const alias = `hook${index}`;
    let specifier = relative(hooksRoot, file).split("\\").join("/").replace(/\.ts$/u, "");
    if (!specifier.startsWith(".")) specifier = `./${specifier}`;
    imports.push(`import { ${exportName} as ${alias} } from ${JSON.stringify(specifier)};`);
    values.push(alias);
  }
  return [
    ...imports,
    "",
    `export const componentHooks = [${values.join(", ")}];`,
    "",
  ].join("\n");
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

function isSameOrInsidePath(candidate, parent) {
  const rel = relative(parent, candidate);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
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

function tomlBoolean(value) {
  return value ? "true" : "false";
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
  const tempDir = join(tmpdir(), `ai-components-${process.pid}-${Date.now()}`);
  const tempComponentsRoot = join(tempDir, "components");
  cpSync(sourceRoot, tempComponentsRoot, { recursive: true, force: true });
  writeText(join(tempComponentsRoot, "hooks", "index.ts"), renderDiscoveredHooksIndex(tempComponentsRoot));

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

function renderMarkdownBulletList(items) {
  return items.map((item) => {
    const lines = String(item).trim().split(/\r?\n/);
    return lines.map((line, index) => index === 0 ? `- ${line}` : `  ${line}`).join("\n");
  }).join("\n");
}

function renderMarkdownTableCell(value) {
  return String(value).trim().replace(/\r?\n/g, "<br>").replaceAll("|", "\\|");
}

function validateTextList(skill, property, itemLabel) {
  const items = skill[property];
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(`Skill ${skill.id} must define at least one ${itemLabel}`);
  }
  for (const item of items) {
    if (typeof item !== "string" || item.trim() === "") {
      throw new Error(`Skill ${skill.id} has an empty ${itemLabel}`);
    }
  }
  return items;
}

function renderTextListSection(skill, property, title, itemLabel) {
  const items = validateTextList(skill, property, itemLabel);
  return `## ${title}\n\n${renderMarkdownBulletList(items)}\n`;
}

function renderUseCases(skill) {
  return renderTextListSection(skill, "useCases", "适用场景", "useCase");
}

function renderConstraints(skill) {
  return renderTextListSection(skill, "constraints", "核心约束", "constraint");
}

function renderChecklist(skill) {
  const checklist = skill.checklist ?? [];
  if (checklist.length === 0) return "";
  validateTextList(skill, "checklist", "checklist item");
  return `## 检查清单\n\n${checklist.map((item) => {
    const lines = String(item).trim().split(/\r?\n/);
    return lines.map((line, index) => index === 0 ? `- [ ] ${line}` : `  ${line}`).join("\n");
  }).join("\n")}\n`;
}

function validateAntiPatterns(skill) {
  const antiPatterns = skill.antiPatterns;
  if (antiPatterns === undefined) return [];
  if (!Array.isArray(antiPatterns) || antiPatterns.length === 0) {
    throw new Error(`Skill ${skill.id} antiPatterns must be a non-empty array when defined`);
  }
  for (const [index, antiPattern] of antiPatterns.entries()) {
    if (!antiPattern || typeof antiPattern !== "object" || Array.isArray(antiPattern)) {
      throw new Error(`Skill ${skill.id} antiPatterns[${index}] must be an object`);
    }
    const keys = Object.keys(antiPattern).sort();
    if (keys.join(",") !== "fail,pass") {
      throw new Error(`Skill ${skill.id} antiPatterns[${index}] must only define fail and pass`);
    }
    if (typeof antiPattern.fail !== "string" || antiPattern.fail.trim() === "") {
      throw new Error(`Skill ${skill.id} antiPatterns[${index}].fail must be a non-empty string`);
    }
    if (typeof antiPattern.pass !== "string" || antiPattern.pass.trim() === "") {
      throw new Error(`Skill ${skill.id} antiPatterns[${index}].pass must be a non-empty string`);
    }
  }
  return antiPatterns;
}

function renderAntiPatterns(skill) {
  const antiPatterns = validateAntiPatterns(skill);
  if (antiPatterns.length === 0) return "";
  const rows = [
    "| 反模式 | 正确做法 |",
    "|--------|----------|",
    ...antiPatterns.map((antiPattern) =>
      `| ${renderMarkdownTableCell(antiPattern.fail)} | ${renderMarkdownTableCell(antiPattern.pass)} |`
    ),
  ];
  return `## 反模式\n\n${rows.join("\n")}\n`;
}

function renderRelatedSkills(skill) {
  const relatedSkills = skill.relatedSkills ?? [];
  if (relatedSkills.length === 0) return "";
  const rows = relatedSkills.map((related) => {
    const label = related.label ?? related.id;
    return `- [${label}](../${related.id}/SKILL.md) — ${related.reason}`;
  });
  return `## 相关 Skill\n\n${rows.join("\n")}\n`;
}

function hasH2SectionMatching(source, predicate) {
  let inFence = false;
  for (const line of source.split(/\r?\n/)) {
    const fence = /^\s*(?:```|~~~)/.test(line);
    const heading = !inFence ? line.match(/^##\s+(.+?)\s*$/) : null;
    if (heading && predicate(heading[1].trim())) return true;
    if (fence) inFence = !inFence;
  }
  return false;
}

function startsWithH2Section(source) {
  const firstLine = source.trimStart().split(/\r?\n/, 1)[0] ?? "";
  return /^##\s+\S/.test(firstLine);
}

function insertSectionBeforeH2Matching(source, section, predicate) {
  if (!section) return source;
  const lines = source.split(/\r?\n/);
  let inFence = false;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fence = /^\s*(?:```|~~~)/.test(line);
    const heading = !inFence ? line.match(/^##\s+(.+?)\s*$/) : null;
    if (heading && predicate(heading[1].trim())) {
      const before = lines.slice(0, index).join("\n").trimEnd();
      const after = lines.slice(index).join("\n").trimStart();
      return `${before}\n\n${section.trimEnd()}\n\n${after}`;
    }
    if (fence) inFence = !inFence;
  }
  return `${source.trimEnd()}\n\n${section.trimEnd()}`;
}

function renderBodyWithGeneratedSections(skill, body) {
  const bodyWithChecklist = insertSectionBeforeH2Matching(
    body,
    renderChecklist(skill),
    (title) => title === "反模式" || title === "反模式速查",
  );
  const antiPatterns = renderAntiPatterns(skill);
  if (!antiPatterns) return bodyWithChecklist;
  return `${bodyWithChecklist.trimEnd()}\n\n${antiPatterns.trimEnd()}`;
}

function hasStringTool(component, toolName) {
  return (component.tools ?? []).some((tool) => tool === toolName);
}

function validateAgentBashBoundary(agent) {
  const boundary = agent.bashBoundary;
  if (boundary === undefined) return [];
  if (!Array.isArray(boundary) || boundary.length === 0) {
    throw new Error(`Agent ${agent.id} bashBoundary must be a non-empty string array when defined`);
  }
  for (const [index, item] of boundary.entries()) {
    if (typeof item !== "string" || item.trim() === "") {
      throw new Error(`Agent ${agent.id} bashBoundary[${index}] must be a non-empty string`);
    }
  }
  return boundary;
}

function validateAgentQualityStandards(agent) {
  const standards = agent.qualityStandards;
  if (standards === undefined) return [];
  if (!Array.isArray(standards) || standards.length === 0) {
    throw new Error(`Agent ${agent.id} qualityStandards must be a non-empty string array when defined`);
  }
  for (const [index, item] of standards.entries()) {
    if (typeof item !== "string" || item.trim() === "") {
      throw new Error(`Agent ${agent.id} qualityStandards[${index}] must be a non-empty string`);
    }
  }
  return standards;
}

function renderAgentBashBoundary(agent) {
  const boundary = validateAgentBashBoundary(agent);
  if (boundary.length === 0) return "";
  return `## Bash 使用边界\n\n${boundary.map((item) => item.trim()).join("\n\n")}\n`;
}

function renderAgentQualityStandards(agent) {
  const standards = validateAgentQualityStandards(agent);
  if (standards.length === 0) return "";
  return `## 质量标准\n\n${renderMarkdownBulletList(standards)}\n`;
}

function renderAgentBodyWithGeneratedSections(agent, body) {
  const bodyWithBashBoundary = insertSectionBeforeH2Matching(
    body,
    renderAgentBashBoundary(agent),
    (title) => title === "输出格式",
  );
  const qualityStandards = renderAgentQualityStandards(agent);
  if (!qualityStandards) return bodyWithBashBoundary;
  return `${bodyWithBashBoundary.trimEnd()}\n\n${qualityStandards.trimEnd()}`;
}

function renderSkillMd(skill, platform) {
  if (typeof skill.fullName !== "string" || skill.fullName.trim() === "") {
    throw new Error(`Skill ${skill.id} must define a non-empty fullName`);
  }
  const body = readComponentText(skill.body).trimEnd();
  const generatedBody = renderBodyWithGeneratedSections(skill, body);
  return [
    renderSkillFrontmatter(skill, platform),
    `# ${skill.fullName}`,
    "",
    renderUseCases(skill),
    renderConstraints(skill),
    renderRelatedSkills(skill),
    generatedBody,
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
  // Claude subagents do not inherit parent-session skills; every orchestrated
  // skill must be listed explicitly in frontmatter.
  const claudeSkills = (agent.skills ?? []).map((skill) => skill.id);
  if (claudeSkills.length > 0) {
    lines.push("skills:");
    for (const skill of claudeSkills) lines.push(`  - ${skill}`);
  }
  const model = agent.claudeModel ?? agent.model;
  if (model) lines.push(`model: ${model}`);
  if (agent.reasoningEffort) lines.push(`effort: ${agent.reasoningEffort}`);
  lines.push("---", "");

  const body = renderAgentBodyWithGeneratedSections(agent, readComponentText(agent.body).trimEnd());
  const skillRoutes = (agent.skills ?? [])
    .map((skill) => `- \`${skill.id}\` (${skill.mode}): ${skill.reason}`)
    .join("\n");
  return [
    lines.join("\n"),
    agent.role.trimEnd(),
    "",
    body,
    "",
    "## Skill Orchestration",
    skillRoutes,
    "",
  ].join("\n");
}

function renderCodexSkillConfig(agent) {
  const skills = agent.skills ?? [];
  if (skills.length === 0) return [];
  return skills.flatMap((skill) => [
    "",
    "[[skills.config]]",
    `path = ${tomlString(`~/.agents/skills/${skill.id}/SKILL.md`)}`,
    `enabled = ${tomlBoolean(true)}`,
  ]);
}

function renderCodexModel(agent) {
  if (agent.codexModel) return agent.codexModel;
  const model = agent.model;
  if (!model) return null;
  const claudeOnlyAliases = new Set(["haiku", "sonnet", "opus"]);
  return claudeOnlyAliases.has(model) ? null : model;
}

function renderCodexAgent(agent) {
  const body = renderAgentBodyWithGeneratedSections(agent, readComponentText(agent.body).trimEnd());
  const skillRoutes = (agent.skills ?? [])
    .map((skill) => `- ${skill.id} (${skill.mode}): ${skill.reason}`)
    .join("\n");
  const developerInstructions = [
    agent.role.trimEnd(),
    "",
    body,
    "",
    "## Skill Orchestration",
    skillRoutes,
    "",
    "When a listed skill is relevant, explicitly route the work through that skill's workflow.",
  ].join("\n");

  const lines = [
    `name = ${tomlString(agent.id)}`,
    `description = ${tomlString(agent.description)}`,
  ];
  const model = renderCodexModel(agent);
  if (model) lines.push(`model = ${tomlString(model)}`);
  if (agent.reasoningEffort) lines.push(`model_reasoning_effort = ${tomlString(agent.reasoningEffort)}`);
  if (agent.sandbox) lines.push(`sandbox_mode = ${tomlString(agent.sandbox)}`);
  lines.push(`developer_instructions = ${tomlMultiline(developerInstructions)}`);
  lines.push(...renderCodexSkillConfig(agent));
  return `${lines.join("\n")}\n`;
}

async function emitAgent(agent, platformRoot, platform) {
  if (platform === Platform.Claude) {
    writeText(join(platformRoot, "agents", `${agent.id}.md`), renderClaudeAgent(agent));
  } else {
    writeText(join(platformRoot, "agents", `${agent.id}.toml`), renderCodexAgent(agent));
  }
}

function relativeImportSpecifier(fromDir, targetPath) {
  if (isAbsolute(targetPath)) return targetPath.split("\\").join("/");
  const specifier = relative(fromDir, targetPath).split("\\").join("/");
  return specifier.startsWith(".") ? specifier : `./${specifier}`;
}

async function compileHookModules(hooks, hooksRoot, platform) {
  ensureDir(hooksRoot);
  const compiled = hooks
    .map((hook, index) => ({
      id: hook.id,
      event: hook.event,
      matcher: renderHookMatcher(hook),
      order: hook.order ?? 100,
      payloadMode: hook.payloadMode ?? "normalized",
      description: hook.description,
      runnerName: `runHook${index}`,
      entryPath: toAbsolutePath(hook.entry),
    }))
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  const manifestHooks = compiled.map(({ runnerName, entryPath, ...hook }) => hook);
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

function renderDispatcher(compiledHooks, platform, hooksRoot) {
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
  const toolInput = raw.tool_input ?? raw.toolInput ?? raw.tool?.input;
  const toolName = raw.tool_name ?? raw.toolName ?? raw.tool?.name;
  const command = typeof toolInput?.command === "string" ? toolInput.command : "";
  const filePath = toolInput?.file_path ?? toolInput?.filePath ?? toolInput?.path;
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
      name: toolName,
      input: toolInput,
      response: raw.tool_response ?? raw.toolResponse ?? raw.toolResult ?? raw.tool?.response,
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

  for (const hook of hooks.filter((item) => item.event === event && hookMatchesPayload(item, payload))) {
    const run = hookRunners.get(hook.id);
    if (typeof run !== "function") continue;
    const hookPayload = hook.payloadMode === "claude-raw" ? toLegacyClaudePayload(payload) : payload;
    const result = normalizeHookResult(await run(hookPayload));
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
  const groups = [];
  const groupsByKey = new Map();
  for (const hook of hooks) {
    const matcher = renderHookMatcher(hook);
    const command = `node "${commandHome}/hooks/dispatch.mjs" --platform ${platform} --event ${hook.event}`;
    const key = `${hook.event}\0${matcher}`;
    let group = groupsByKey.get(key);
    if (!group) {
      group = {
        event: hook.event,
        matcher,
        command,
        timeout: 10,
        hookCount: 0,
        statusMessages: new Set(),
      };
      groupsByKey.set(key, group);
      groups.push(group);
    }
    group.timeout = Math.max(group.timeout, hook.timeoutSeconds ?? 10);
    group.hookCount += 1;
    if (hook.statusMessage) group.statusMessages.add(hook.statusMessage);
  }

  for (const group of groups) {
    const commandHook = {
      type: "command",
      command: group.command,
      timeout: group.timeout,
    };
    if (platform === Platform.Codex && group.hookCount === 1 && group.statusMessages.size === 1) {
      commandHook.statusMessage = [...group.statusMessages][0];
    }
    const hookGroup = { hooks: [commandHook] };
    if (group.matcher) hookGroup.matcher = group.matcher;
    hooksByEvent[group.event] ??= [];
    hooksByEvent[group.event].push(hookGroup);
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
    validateTextList(skill, "useCases", "useCase");
    validateTextList(skill, "constraints", "constraint");
    if (!existsSync(toAbsolutePath(skill.body))) {
      throw new Error(`Skill ${skill.id} body is missing: ${displayPath(skill.body)}`);
    }
    const bodySource = readComponentText(skill.body);
    if (!startsWithH2Section(bodySource)) {
      throw new Error(`Skill ${skill.id} body must start with an H2 section; move intro text to index.ts fields`);
    }
    if (hasH2SectionMatching(bodySource, (title) => title === "适用场景")) {
      throw new Error(`Skill ${skill.id} must move ## 适用场景 from SKILL.body.md to useCases`);
    }
    if (hasH2SectionMatching(bodySource, (title) => title.startsWith("核心约束"))) {
      throw new Error(`Skill ${skill.id} must move ## 核心约束 from SKILL.body.md to constraints`);
    }
    if (hasH2SectionMatching(bodySource, (title) => title === "检查清单")) {
      throw new Error(`Skill ${skill.id} must move ## 检查清单 from SKILL.body.md to checklist`);
    }
    if (skill.checklist !== undefined) {
      validateTextList(skill, "checklist", "checklist item");
    }
    if (hasH2SectionMatching(bodySource, (title) => title === "反模式")) {
      throw new Error(`Skill ${skill.id} must move ## 反模式 from SKILL.body.md to antiPatterns`);
    }
    validateAntiPatterns(skill);
    if (/\]\(\.\.\/[^)]+\/SKILL\.md\)|\]\([a-z0-9-]+-expert:[a-z0-9-]+\)/u.test(bodySource)) {
      throw new Error(`Skill ${skill.id} must move explicit cross-skill links from SKILL.body.md to relatedSkills`);
    }
    const seenRelatedSkills = new Set();
    for (const related of skill.relatedSkills ?? []) {
      validateId(related.id, `related skill in ${skill.id}`);
      if (!skillIds.has(related.id)) {
        throw new Error(`Skill ${skill.id} references missing related skill: ${related.id}`);
      }
      if (related.id === skill.id) {
        throw new Error(`Skill ${skill.id} must not reference itself as a related skill`);
      }
      if (related.label !== undefined && (typeof related.label !== "string" || related.label.trim() === "")) {
        throw new Error(`Skill ${skill.id} related skill ${related.id} has an empty label`);
      }
      if (typeof related.reason !== "string" || related.reason.trim() === "") {
        throw new Error(`Skill ${skill.id} related skill ${related.id} has an empty reason`);
      }
      const key = `${related.id}\0${related.label ?? ""}`;
      if (seenRelatedSkills.has(key)) {
        throw new Error(`Skill ${skill.id} has a duplicate related skill entry: ${related.id}`);
      }
      seenRelatedSkills.add(key);
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
      const referenceSource = toAbsolutePath(reference.source);
      const referenceTarget = defaultReferenceTarget(reference);
      if (
        reference.id === "evals" ||
        referenceTarget === "references/evals" ||
        referenceTarget.startsWith("references/evals/") ||
        isSameOrInsidePath(referenceSource, join(skillSourceRoot, "evals"))
      ) {
        throw new Error(`Skill ${skill.id} must not register evals/ as a reference`);
      }
      if (!existsSync(referenceSource)) {
        throw new Error(`Skill ${skill.id} reference is missing: ${displayPath(reference.source)}`);
      }
    }
  }

  for (const agent of registry.agents) {
    validateId(agent.id, "agent");
    if (!agent.role || agent.role.trim() === "") {
      throw new Error(`Agent ${agent.id} must define a non-empty role`);
    }
    if (!existsSync(toAbsolutePath(agent.body))) {
      throw new Error(`Agent ${agent.id} body is missing: ${displayPath(agent.body)}`);
    }
    const agentBodySource = readComponentText(agent.body);
    if (/^你是/.test(agentBodySource.trimStart())) {
      throw new Error(`Agent ${agent.id} must move role definition from AGENT.body.md to index.ts role field`);
    }
    if (!startsWithH2Section(agentBodySource)) {
      throw new Error(`Agent ${agent.id} body must start with an H2 section (##); move non-section content to index.ts role field`);
    }
    if (hasH2SectionMatching(agentBodySource, (title) => title === "Bash 使用边界")) {
      throw new Error(`Agent ${agent.id} must move ## Bash 使用边界 from AGENT.body.md to bashBoundary`);
    }
    if (hasH2SectionMatching(agentBodySource, (title) => title === "质量标准")) {
      throw new Error(`Agent ${agent.id} must move ## 质量标准 from AGENT.body.md to qualityStandards`);
    }
    validateAgentQualityStandards(agent);
    const hasBashTool = hasStringTool(agent, "Bash");
    const bashBoundary = validateAgentBashBoundary(agent);
    if (hasBashTool && bashBoundary.length === 0) {
      throw new Error(`Agent ${agent.id} uses KnownTool.Bash and must define bashBoundary`);
    }
    if (!hasBashTool && bashBoundary.length > 0) {
      throw new Error(`Agent ${agent.id} defines bashBoundary but does not include KnownTool.Bash`);
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
  await compileHookModules(platformHooks, join(root, "hooks"), platform);

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
      claudeHooks: JSON.parse(readFileSync(join(outDir, "claude", "hooks", "manifest.json"), "utf-8")).hooks.length,
      codexHooks: JSON.parse(readFileSync(join(outDir, "codex", "hooks", "manifest.json"), "utf-8")).hooks.length,
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
