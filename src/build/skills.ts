import { existsSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import * as esbuild from "esbuild";
import type {
  AntiPatternDefinition,
  Platform as PlatformType,
  SkillDefinition,
  SkillReferenceDefinition,
  SkillScriptDefinition,
} from "../components/sdk";
import {
  copyComponentPath,
  defaultReferenceTarget,
  ensureDir,
  InvocationPolicy,
  nodeScriptBanner,
  Platform,
  readComponentText,
  removeFiles,
  rewriteRuntimeRelativeImports,
  toAbsolutePath,
  writeText,
  yamlScalar,
} from "./core.ts";
import {
  insertSectionBeforeH2Matching,
  renderMarkdownBulletList,
  renderMarkdownTableCell,
} from "./markdown.ts";

type TextListProperty = "useCases" | "constraints" | "checklist";

type CompiledScriptManifestItem = {
  id: string;
  file: string;
  runtime: "node" | "python3";
  description: string;
  argsSchema: string | null;
  outputSchema: string | null;
};

function renderSkillFrontmatter(skill: SkillDefinition, platform: PlatformType): string {
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

function renderScriptRegistry(skill: SkillDefinition, platform: PlatformType): string {
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

function renderReferenceMap(skill: SkillDefinition): string {
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

export function validateTextList(
  skill: SkillDefinition,
  property: TextListProperty,
  itemLabel: string,
): readonly string[] {
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

function renderTextListSection(
  skill: SkillDefinition,
  property: TextListProperty,
  title: string,
  itemLabel: string,
): string {
  const items = validateTextList(skill, property, itemLabel);
  return `## ${title}\n\n${renderMarkdownBulletList([...items])}\n`;
}

function renderUseCases(skill: SkillDefinition): string {
  return renderTextListSection(skill, "useCases", "适用场景", "useCase");
}

function renderConstraints(skill: SkillDefinition): string {
  return renderTextListSection(skill, "constraints", "核心约束", "constraint");
}

function renderChecklist(skill: SkillDefinition): string {
  const checklist = skill.checklist ?? [];
  if (checklist.length === 0) return "";
  validateTextList(skill, "checklist", "checklist item");
  return `## 检查清单\n\n${checklist.map((item) => {
    const lines = String(item).trim().split(/\r?\n/);
    return lines.map((line, index) => index === 0 ? `- [ ] ${line}` : `  ${line}`).join("\n");
  }).join("\n")}\n`;
}

export function validateAntiPatterns(skill: SkillDefinition): readonly AntiPatternDefinition[] {
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

function renderAntiPatterns(skill: SkillDefinition): string {
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

function renderRelatedSkills(skill: SkillDefinition): string {
  const relatedSkills = skill.relatedSkills ?? [];
  if (relatedSkills.length === 0) return "";
  const rows = relatedSkills.map((related) => {
    const label = related.label ?? related.id;
    return `- [${label}](../${related.id}/SKILL.md) — ${related.reason}`;
  });
  return `## 相关 Skill\n\n${rows.join("\n")}\n`;
}

function renderBodyWithGeneratedSections(skill: SkillDefinition, body: string): string {
  const bodyWithChecklist = insertSectionBeforeH2Matching(
    body,
    renderChecklist(skill),
    (title) => title === "反模式" || title === "反模式速查",
  );
  const antiPatterns = renderAntiPatterns(skill);
  if (!antiPatterns) return bodyWithChecklist;
  return `${bodyWithChecklist.trimEnd()}\n\n${antiPatterns.trimEnd()}`;
}

export function renderSkillMd(skill: SkillDefinition, platform: PlatformType): string {
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

function renderReferencesIndex(skill: SkillDefinition): string {
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

async function buildScriptFromTypeScript(
  sourcePath: string,
  outfile: string,
  bundle: boolean,
): Promise<void> {
  await esbuild.build({
    entryPoints: [sourcePath],
    outfile,
    bundle,
    platform: "node",
    format: "esm",
    target: "node20",
    banner: nodeScriptBanner(sourcePath),
    logLevel: "silent",
  });
}

export async function compileSkillScripts(
  skill: SkillDefinition,
  skillRoot: string,
): Promise<CompiledScriptManifestItem[]> {
  if (skill.scriptRoots && skill.scriptRoots.length > 0) {
    for (const root of skill.scriptRoots) {
      copyComponentPath(root.source, join(skillRoot, root.target ?? "scripts"));
    }
  }

  const scriptsRoot = join(skillRoot, "scripts");
  removeFiles(scriptsRoot, (file) => file.endsWith(".ts"));
  if (!skill.scripts || skill.scripts.length === 0) return [];
  ensureDir(scriptsRoot);

  const compiled: CompiledScriptManifestItem[] = [];
  for (const script of skill.scripts) {
    await compileSingleScript(skillRoot, script, compiled);
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

async function compileSingleScript(
  skillRoot: string,
  script: SkillScriptDefinition,
  compiled: CompiledScriptManifestItem[],
): Promise<void> {
  const sourcePath = toAbsolutePath(script.entry);
  const runtime = script.runtime ?? (sourcePath.endsWith(".py") ? "python3" : "node");
  const defaultTarget = runtime === "python3" ? `scripts/${script.id}.py` : `scripts/${script.id}.mjs`;
  const target = script.target ?? defaultTarget;
  const outfile = join(skillRoot, target);
  ensureDir(dirname(outfile));

  if (script.bundle === false) {
    if (sourcePath.endsWith(".ts") && runtime === "node") {
      await buildScriptFromTypeScript(sourcePath, outfile, false);
      rewriteRuntimeRelativeImports(outfile);
    } else if (!existsSync(outfile)) {
      copyComponentPath(script.entry, outfile);
    }
  } else if (sourcePath.endsWith(".ts") && runtime === "node") {
    await buildScriptFromTypeScript(sourcePath, outfile, true);
  } else {
    await esbuild.build({
      entryPoints: [sourcePath],
      outfile,
      bundle: true,
      platform: "node",
      format: "esm",
      target: "node20",
      banner: runtime === "node" ? nodeScriptBanner(sourcePath) : undefined,
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

function renderCodexOpenAiYaml(skill: SkillDefinition): string {
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

export async function emitSkill(
  skill: SkillDefinition,
  platformRoot: string,
  platform: PlatformType,
): Promise<void> {
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

function copyLooseSkillFiles(skill: SkillDefinition, skillRoot: string): void {
  const sourceDir = dirname(toAbsolutePath(skill.body));
  const reserved = new Set([
    "index.ts",
    "index.js",
    "SKILL.body.md",
    "scripts",
    "references",
    "assets",
    "evals",
  ]);
  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    if (reserved.has(entry.name)) continue;
    const sourceUrl = new URL(
      `./${entry.name}${entry.isDirectory() ? "/" : ""}`,
      pathToFileURL(`${sourceDir}/`),
    );
    copyComponentPath(sourceUrl, join(skillRoot, entry.name));
  }
}

