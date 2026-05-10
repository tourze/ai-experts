import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { stringify as stringifyYaml } from "yaml";
import type {
  AntiPatternDefinition,
  Platform as PlatformType,
  ProcedureDefinition,
  RelatedSkillDefinition,
  SkillDefinition,
  SkillGoalDefinition,
  SkillOutputsDefinition,
  SkillParameter,
  SkillReferenceDefinition,
  WorkflowDefinition,
} from "../components/sdk";
import {
  copyComponentPath,
  collectFiles,
  defaultReferenceTarget,
  ensureDir,
  InvocationPolicy,
  Platform,
  renderToolMatcher,
  renderYamlFrontmatter,
  toAbsolutePath,
  writeText,
} from "./core";
import { listProcedureUses, procedureUseAppliesToPlatform } from "./procedure-uses";
import type { ResolvedProcedureUse } from "./procedure-uses";
import {
  renderMarkdownBulletList,
  renderMarkdownTableCell,
} from "./markdown";
import { validateMermaidSyntax } from "./mermaid";
import { renderWorkflowMermaidSource, renderWorkflowSection, validateWorkflow } from "./workflows";
import { rewriteGeneratedSkillMarkdown } from "./skill-rewrites";
import { procedureRuntimePath } from "./skill-runtime";

type TextListProperty = "useCases" | "constraints" | "checklist";

const CODEX_OPENAI_SHORT_DESCRIPTION_MIN_LENGTH = 25;
const CODEX_OPENAI_SHORT_DESCRIPTION_MAX_LENGTH = 64;

function validateSingleLineText(owner: string, property: string, value: string): void {
  if (/\r|\n/u.test(value)) {
    throw new Error(`${owner} ${property} must be a single line`);
  }
}

export function compactCodexOpenAiShortDescription(description: string): string {
  const normalized = description.replace(/\s+/gu, " ").trim();
  const characters = Array.from(normalized);
  if (characters.length <= CODEX_OPENAI_SHORT_DESCRIPTION_MAX_LENGTH) return normalized;

  const maxEnd = Math.min(characters.length, CODEX_OPENAI_SHORT_DESCRIPTION_MAX_LENGTH);
  let boundaryEnd = -1;
  for (const boundaryCharacters of [
    new Set(["。", "；", ";"]),
    new Set(["，", ",", "、", "：", ":", "）", ")"]),
    new Set([" "]),
  ]) {
    for (let index = CODEX_OPENAI_SHORT_DESCRIPTION_MIN_LENGTH - 1; index < maxEnd; index += 1) {
      if (boundaryCharacters.has(characters[index])) boundaryEnd = index + 1;
    }
    if (boundaryEnd >= CODEX_OPENAI_SHORT_DESCRIPTION_MIN_LENGTH) break;
  }

  if (boundaryEnd >= CODEX_OPENAI_SHORT_DESCRIPTION_MIN_LENGTH) {
    const candidate = characters.slice(0, boundaryEnd).join("").replace(/[，,、；;：:\s]+$/u, "").trim();
    if (Array.from(candidate).length >= CODEX_OPENAI_SHORT_DESCRIPTION_MIN_LENGTH) return candidate;
  }

  return `${characters.slice(0, CODEX_OPENAI_SHORT_DESCRIPTION_MAX_LENGTH - 3).join("").trimEnd()}...`;
}

export function skillSourceRoot(skill: SkillDefinition): string {
  if (skill.sourceDir !== undefined) return toAbsolutePath(skill.sourceDir);
  throw new Error(`Skill ${skill.id} must define sourceDir`);
}

function renderSkillFrontmatter(skill: SkillDefinition, platform: PlatformType): string {
  const frontmatter: Record<string, unknown> = {
    name: skill.id,
    description: skill.description,
  };
  if (platform === Platform.Claude) {
    if (skill.invocation === InvocationPolicy.ExplicitOnly) {
      frontmatter["disable-model-invocation"] = true;
    }
    if (skill.invocation === InvocationPolicy.ModelOnly) {
      frontmatter["user-invocable"] = false;
    }
    const tools = (skill.tools ?? []).map(renderToolMatcher);
    if (tools.length > 0) {
      frontmatter["allowed-tools"] = tools;
    }
    if (skill.argumentHint) {
      frontmatter["argument-hint"] = skill.argumentHint;
    }
    const params = validateParameters(skill);
    if (params.length > 0) {
      frontmatter.arguments = params.map((param) => param.name);
    }
  }
  return `${renderYamlFrontmatter(frontmatter)}\n`;
}

function renderProcedureRegistry(
  skill: SkillDefinition,
  platform: PlatformType,
  proceduresById: ReadonlyMap<string, ProcedureDefinition>,
): string {
  const procedureUses = listProcedureUses(skill)
    .filter((procedureUse) => procedureUseAppliesToPlatform(procedureUse, platform))
    .filter((procedureUse) => proceduresById.has(procedureUse.id));
  if (procedureUses.length === 0) return "";

  const entries = procedureUses.map((procedureUse) => {
    const procedure = proceduresById.get(procedureUse.id);
    return renderProcedureEntry(skill, platform, procedureUse, procedure);
  });

  return `\n## Procedure 调用说明\n\n${entries.join("\n\n")}\n`;
}

function renderProcedureEntry(
  skill: SkillDefinition,
  platform: PlatformType,
  procedureUse: ResolvedProcedureUse,
  procedure: ProcedureDefinition | undefined,
): string {
  const lines: string[] = [];

  const heading = procedureUse.label
    ? `### \`${procedureUse.id}\` — ${procedureUse.label}`
    : `### \`${procedureUse.id}\``;
  lines.push(heading);

  const description = procedureUse.reason ?? procedure?.description ?? "";
  if (description) {
    lines.push("");
    lines.push(description);
  }

  if (procedureUse.when) {
    lines.push("");
    lines.push(`**何时调用：** ${procedureUse.when}`);
  }

  const paramsSection = procedureUse.showParams === false ? "" : renderProcedureParams(procedure);
  if (paramsSection) {
    lines.push("");
    lines.push(paramsSection);
  } else if (procedureUse.showParams === false && procedure?.params && procedure.params.length > 0) {
    lines.push("");
    lines.push("**参数：** 完整参数以该 Procedure 的 `--help` 输出为准。");
  }

  lines.push("");
  lines.push("**调用示例：**");
  lines.push("");
  lines.push(renderProcedureCommand(skill, platform, procedureUse, procedure));

  return lines.join("\n");
}

function renderProcedureParams(procedure: ProcedureDefinition | undefined): string {
  if (!procedure?.params || procedure.params.length === 0) return "";

  const header = "| 参数 | 取值 | 必填 | 说明 |";
  const divider = "|------|------|------|------|";
  const rows = procedure.params.map((p) => {
    const cells = [
      `\`${p.flag}\``,
      p.type || "—",
      p.required === false ? "否" : "是",
      p.description,
    ];
    return `| ${cells.map(renderMarkdownTableCell).join(" | ")} |`;
  });
  return `**参数：**\n\n${[header, divider, ...rows].join("\n")}`;
}

function shellQuoteArg(value: string): string {
  if (value === "") return "''";
  if (/^[A-Za-z0-9_./:@%+=,~-]+$/u.test(value)) return value;
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function renderProcedureCommand(
  skill: SkillDefinition,
  platform: PlatformType,
  procedureUse: ResolvedProcedureUse,
  procedure: ProcedureDefinition | undefined,
): string {
  const exampleArgs = procedureUse.exampleArgs ?? procedure?.exampleArgs;
  const argsArray: unknown[] = (exampleArgs != null && typeof exampleArgs === "object" && "args" in exampleArgs)
    ? (exampleArgs as Record<string, unknown>).args as unknown[] ?? []
    : [];
  const procedureArgs = Array.isArray(argsArray) && argsArray.length > 0
    ? argsArray.map(String)
    : [];
  const runtimePath = procedureRuntimePath(platform);
  const parts = [
    `node ${runtimePath}`,
    `--procedure-id ${procedureUse.id}`,
    `--trigger-skill ${skill.id}`,
  ];
  if (procedureArgs.length > 0) {
    parts.push("--");
    parts.push(procedureArgs.map(shellQuoteArg).join(" "));
  }
  return "```bash\n" + parts.join(" \\\n  ") + "\n```";
}

function renderReferenceMap(skill: SkillDefinition): string {
  if (!skill.references || skill.references.length === 0) return "";
  const rows = [
    "| Reference | 内容 | 何时读取 |",
    "|-----------|------|----------|",
    ...skill.references.map((reference) => {
      const cells = [
        `[${reference.id}](${renderReferenceLinkTarget(reference)})`,
        reference.summary,
        reference.loadWhen,
      ];
      return `| ${cells.map(renderMarkdownTableCell).join(" | ")} |`;
    }),
  ];
  return `\n## Reference Map\n\n${rows.join("\n")}\n`;
}

function normalizeReferenceTarget(target: string): string {
  return target.replace(/\/+$/u, "");
}

function isDirectoryReference(reference: SkillReferenceDefinition): boolean {
  const sourcePath = toAbsolutePath(reference.source);
  return statSync(sourcePath).isDirectory();
}

function referenceDirectoryIndexTarget(reference: SkillReferenceDefinition): string {
  return `${normalizeReferenceTarget(defaultReferenceTarget(reference))}/index.md`;
}

function renderReferenceLinkTarget(reference: SkillReferenceDefinition): string {
  if (!isDirectoryReference(reference)) return defaultReferenceTarget(reference);
  return referenceDirectoryIndexTarget(reference);
}

function renderReferenceDirectoryIndex(
  reference: SkillReferenceDefinition,
  referenceRoot: string,
): string {
  const indexFile = join(referenceRoot, "index.md");
  const entries = collectFiles(referenceRoot)
    .filter((file) => file !== indexFile)
    .map((file) => relative(referenceRoot, file).split("\\").join("/"));
  const filesSection = entries.length > 0
    ? entries.map((entry) => `- [${entry}](${entry})`).join("\n")
    : "- （当前目录暂无可索引文件）";
  const header = `# ${reference.title}\n\n${reference.summary}`;
  return `${header}\n\n## Files\n\n${filesSection}\n`;
}

function writeReferenceDirectoryIndex(
  reference: SkillReferenceDefinition,
  skillRoot: string,
): void {
  const referenceRoot = join(skillRoot, normalizeReferenceTarget(defaultReferenceTarget(reference)));
  const indexFile = join(referenceRoot, "index.md");
  if (existsSync(indexFile)) return;
  writeText(indexFile, renderReferenceDirectoryIndex(reference, referenceRoot));
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

export function validateParameters(skill: SkillDefinition): readonly SkillParameter[] {
  const params = skill.parameters ?? [];
  if (params.length === 0) return [];
  const seen = new Set<string>();
  for (const [index, param] of params.entries()) {
    if (!param || typeof param !== "object") {
      throw new Error(`Skill ${skill.id} parameters[${index}] must be an object`);
    }
    if (typeof param.name !== "string" || param.name.trim() === "") {
      throw new Error(`Skill ${skill.id} parameters[${index}].name must be a non-empty string`);
    }
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/u.test(param.name.trim())) {
      throw new Error(
        `Skill ${skill.id} parameters[${index}].name must start with a letter and only contain letters, numbers, "_", or "-"`,
      );
    }
    if (typeof param.description !== "string" || param.description.trim() === "") {
      throw new Error(`Skill ${skill.id} parameters[${index}].description must be a non-empty string`);
    }
    const name = param.name.trim();
    if (seen.has(name)) {
      throw new Error(`Skill ${skill.id} parameters[${index}].name "${name}" is duplicate`);
    }
    seen.add(name);
    if (param.type !== undefined && !["string", "file", "url", "slug"].includes(param.type)) {
      throw new Error(`Skill ${skill.id} parameters[${index}].type "${param.type}" is invalid; must be string, file, url, or slug`);
    }
  }
  return params;
}

export function validateSkillGoal(skill: SkillDefinition): SkillGoalDefinition | null {
  const goal = skill.goal;
  if (goal === undefined) return null;
  if (!goal || typeof goal !== "object" || Array.isArray(goal)) {
    throw new Error(`Skill ${skill.id} goal must be a single object when defined`);
  }
  if (typeof goal.title !== "string" || goal.title.trim() === "") {
    throw new Error(`Skill ${skill.id} goal.title must be a non-empty string`);
  }
  validateSingleLineText(`Skill ${skill.id}`, "goal.title", goal.title);
  if (goal.title.trim() === "目标") {
    throw new Error(`Skill ${skill.id} goal.title must be specific; use outputs or checklist for generic goals`);
  }
  if (typeof goal.body !== "string" || goal.body.trim() === "") {
    throw new Error(`Skill ${skill.id} goal.body must be a non-empty string`);
  }
  return goal;
}

export function validateSkillWorkflow(skill: SkillDefinition): WorkflowDefinition | null {
  return validateWorkflow(`Skill ${skill.id}`, skill.workflow);
}

export function validateSkillOutputs(skill: SkillDefinition): SkillOutputsDefinition | null {
  const outputs = skill.outputs;
  if (outputs === undefined) return null;
  if (!outputs || typeof outputs !== "object" || Array.isArray(outputs)) {
    throw new Error(`Skill ${skill.id} outputs must be a single object when defined`);
  }
  if (outputs.title !== undefined && (typeof outputs.title !== "string" || outputs.title.trim() === "")) {
    throw new Error(`Skill ${skill.id} outputs.title must be non-empty when defined`);
  }
  if (outputs.title !== undefined) {
    validateSingleLineText(`Skill ${skill.id}`, "outputs.title", outputs.title);
  }
  const hasItems = outputs.items !== undefined;
  const hasBody = outputs.body !== undefined;
  if (hasItems === hasBody) {
    throw new Error(`Skill ${skill.id} outputs must define exactly one of items or body`);
  }
  if (outputs.items !== undefined) {
    if (!Array.isArray(outputs.items) || outputs.items.length === 0) {
      throw new Error(`Skill ${skill.id} outputs.items must be a non-empty array when defined`);
    }
    for (const [index, item] of outputs.items.entries()) {
      if (typeof item !== "string" || item.trim() === "") {
        throw new Error(`Skill ${skill.id} outputs.items[${index}] must be a non-empty string`);
      }
    }
  }
  if (outputs.body !== undefined && (typeof outputs.body !== "string" || outputs.body.trim() === "")) {
    throw new Error(`Skill ${skill.id} outputs.body must be a non-empty string when defined`);
  }
  return outputs;
}

function renderUserInput(skill: SkillDefinition, platform: PlatformType): string {
  const params = validateParameters(skill);
  if (params.length === 0) return "";
  if (platform === Platform.Claude) {
    const names = params.map((p) => `$${p.name}`).join(" ");
    return `## 用户输入\n\n\`\`\`text\n${names}\n\`\`\`\n`;
  }
  // Codex: parameter table
  const rows = [
    "| 参数 | 类型 | 必填 | 说明 |",
    "|------|------|------|------|",
    ...params.map((p) => {
      const cells = [
        `\`${p.name}\``,
        p.type ?? "string",
        p.required !== false ? "是" : "否",
        p.description,
      ];
      return `| ${cells.map(renderMarkdownTableCell).join(" | ")} |`;
    }),
  ];
  return `## 用户输入\n\n${rows.join("\n")}\n`;
}

function renderSkillGoal(skill: SkillDefinition): string {
  const goal = validateSkillGoal(skill);
  if (!goal) return "";
  return `## ${goal.title.trim()}\n\n${goal.body.trim()}\n`;
}

function renderSkillWorkflow(skill: SkillDefinition): string {
  const workflow = validateSkillWorkflow(skill);
  if (!workflow) return "";
  return renderWorkflowSection(workflow);
}

function renderSkillOutputs(skill: SkillDefinition): string {
  const outputs = validateSkillOutputs(skill);
  if (!outputs) return "";
  const title = outputs.title?.trim() ?? "输出";
  if (outputs.items !== undefined) {
    return `## ${title}\n\n${renderMarkdownBulletList([...outputs.items])}\n`;
  }
  return `## ${title}\n\n${outputs.body?.trim()}\n`;
}

function renderStructuredSkillBody(skill: SkillDefinition): string {
  return [
    renderSkillGoal(skill),
    renderSkillWorkflow(skill),
    renderSkillOutputs(skill),
  ].filter((section) => section.trim() !== "")
    .map((section) => section.trimEnd())
    .join("\n\n");
}

function renderRelatedSkills(skill: SkillDefinition, platform: PlatformType): string {
  const relatedSkills = uniqueRelatedSkills(
    (skill.relatedSkills ?? []).filter((related) => !related.platforms || related.platforms.includes(platform)),
  );
  if (relatedSkills.length === 0) return "";
  const rows = relatedSkills.map((related) => {
    return `- [${related.id}](../${related.id}/SKILL.md) — ${related.reason}`;
  });
  return `## 相关 Skill\n\n${rows.join("\n")}\n`;
}

function uniqueRelatedSkills(relatedSkills: readonly RelatedSkillDefinition[]): RelatedSkillDefinition[] {
  const seen = new Set<string>();
  const unique: RelatedSkillDefinition[] = [];
  for (const related of relatedSkills) {
    if (seen.has(related.id)) continue;
    seen.add(related.id);
    unique.push(related);
  }
  return unique;
}

function renderBodyWithGeneratedSections(skill: SkillDefinition, body: string): string {
  const antiPatterns = renderAntiPatterns(skill);
  if (!antiPatterns) return body;
  return `${body.trimEnd()}\n\n${antiPatterns.trimEnd()}`;
}

function normalizeMarkdownBlankLines(markdown: string): string {
  return `${markdown.replace(/\r\n/g, "\n").replace(/\n{3,}/gu, "\n\n").trimEnd()}\n`;
}

export function renderSkillMd(
  skill: SkillDefinition,
  platform: PlatformType,
  proceduresById: ReadonlyMap<string, ProcedureDefinition>,
): string {
  if (typeof skill.fullName !== "string" || skill.fullName.trim() === "") {
    throw new Error(`Skill ${skill.id} must define a non-empty fullName`);
  }
  validateSingleLineText(`Skill ${skill.id}`, "fullName", skill.fullName);
  const body = [
    renderStructuredSkillBody(skill),
  ].filter((section) => section.trim() !== "")
    .join("\n\n");
  const generatedBody = renderBodyWithGeneratedSections(skill, body);
  const sections = [
    renderSkillFrontmatter(skill, platform),
    `# ${skill.fullName}`,
    renderUseCases(skill),
    renderConstraints(skill),
    renderUserInput(skill, platform),
    generatedBody,
    renderChecklist(skill),
    renderProcedureRegistry(skill, platform, proceduresById),
    renderReferenceMap(skill),
    renderRelatedSkills(skill, platform),
  ].filter((section) => section.trim() !== "")
    .map((section) => section.trimEnd());
  return normalizeMarkdownBlankLines(sections.join("\n\n"));
}

function renderReferencesIndex(skill: SkillDefinition): string {
  const rows = [
    "| Reference | Title | Summary | Load When |",
    "|-----------|-------|---------|-----------|",
    ...(skill.references ?? []).map((reference) => {
      const target = renderReferenceLinkTarget(reference);
      const link = target.startsWith("references/") ? target.slice("references/".length) : target;
      const cells = [
        `[${reference.id}](${link})`,
        reference.title,
        reference.summary,
        reference.loadWhen,
      ];
      return `| ${cells.map(renderMarkdownTableCell).join(" | ")} |`;
    }),
  ];
  return `# Reference Index\n\n${rows.join("\n")}\n`;
}

function renderCodexOpenAiYaml(skill: SkillDefinition): string {
  const allowImplicit = skill.invocation !== InvocationPolicy.ExplicitOnly;
  return stringifyYaml(
    {
      interface: {
        display_name: skill.fullName,
        short_description: compactCodexOpenAiShortDescription(skill.description),
      },
      policy: {
        allow_implicit_invocation: allowImplicit,
      },
    },
    { lineWidth: 0 },
  );
}

export async function emitSkill(
  skill: SkillDefinition,
  platformRoot: string,
  platform: PlatformType,
  proceduresById: ReadonlyMap<string, ProcedureDefinition>,
  platformSkillIds: ReadonlySet<string>,
): Promise<void> {
  const skillRoot = join(platformRoot, "skills", skill.id);
  ensureDir(skillRoot);
  const workflow = validateSkillWorkflow(skill);
  if (workflow) {
    await validateMermaidSyntax(`Skill ${skill.id}`, renderWorkflowMermaidSource(workflow));
  }
  writeText(join(skillRoot, "SKILL.md"), renderSkillMd(skill, platform, proceduresById));
  copySupplementalSkillRootFiles(skill, skillRoot);

  if (skill.references && skill.references.length > 0) {
    for (const reference of skill.references) {
      const target = join(skillRoot, defaultReferenceTarget(reference));
      copyComponentPath(reference.source, target);
      if (isDirectoryReference(reference)) {
        writeReferenceDirectoryIndex(reference, skillRoot);
      }
    }
    writeText(join(skillRoot, "references", "index.md"), renderReferencesIndex(skill));
  }

  if (skill.assets && skill.assets.length > 0) {
    for (const asset of skill.assets) {
      copyComponentPath(asset.source, join(skillRoot, asset.target ?? `assets/${basename(toAbsolutePath(asset.source))}`));
    }
  }

  if (platform === Platform.Codex) {
    writeText(join(skillRoot, "agents", "openai.yaml"), renderCodexOpenAiYaml(skill));
  }

  rewriteGeneratedSkillMarkdown(skill, skillRoot, platform, proceduresById, platformSkillIds);
}

function copySupplementalSkillRootFiles(skill: SkillDefinition, skillRoot: string): void {
  const sourceDir = skillSourceRoot(skill);
  const reserved = new Set([
    "index.ts",
    "index.js",
    "AGENTS.md",
    "CLAUDE.md",
    "metadata.json",
    "_meta.json",
    "scripts",
    "references",
    "assets",
    "evals",
    "tests",
  ]);
  const allowedLooseRootFiles = new Set(["README.md", "LICENSE.txt"]);
  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    if (reserved.has(entry.name)) continue;
    if (!entry.isFile() || !allowedLooseRootFiles.has(entry.name)) {
      const sourcePath = join(sourceDir, entry.name);
      throw new Error(
        `Skill ${skill.id} has unregistered root entry ${relative(sourceDir, sourcePath)}; move it to references/, assets/, evals/, or procedures.`,
      );
    }
    const sourceUrl = new URL(
      `./${entry.name}${entry.isDirectory() ? "/" : ""}`,
      pathToFileURL(`${sourceDir}/`),
    );
    copyComponentPath(sourceUrl, join(skillRoot, entry.name));
  }
}
