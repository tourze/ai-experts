import { readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import type {
  AntiPatternDefinition,
  Platform as PlatformType,
  ProcedureArgsDefinition,
  ProcedureDefinition,
  ProcedureOutputDefinition,
  RelatedSkillDefinition,
  SkillDefinition,
  SkillParameter,
  SkillReferenceDefinition,
} from "../components/sdk";
import {
  copyComponentPath,
  defaultReferenceTarget,
  ensureDir,
  InvocationPolicy,
  Platform,
  readComponentText,
  toAbsolutePath,
  writeText,
  yamlScalar,
} from "./core.ts";
import { listProcedureUses } from "./script-uses.ts";
import type { ResolvedProcedureUse } from "./script-uses.ts";
import {
  insertSectionBeforeH2Matching,
  renderMarkdownBulletList,
  renderMarkdownTableCell,
} from "./markdown.ts";

type TextListProperty = "useCases" | "constraints" | "checklist";

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
    if (skill.argumentHint) {
      lines.push(`argument-hint: ${yamlScalar(skill.argumentHint)}`);
    }
    const params = skill.parameters ?? [];
    if (params.length > 0) {
      lines.push("arguments:");
      for (const param of params) {
        lines.push(`  - ${param.name}`);
      }
    }
  }
  lines.push("---", "");
  return lines.join("\n");
}

function renderProcedureRegistry(
  skill: SkillDefinition,
  platform: PlatformType,
  proceduresById: ReadonlyMap<string, ProcedureDefinition>,
): string {
  const procedureUses = listProcedureUses(skill);
  if (procedureUses.length === 0) return "";
  const columns = ["Procedure", "用法", "何时调用", "调用目的", "参数", "返回值", "示例命令"];
  const header = `| ${columns.join(" | ")} |`;
  const divider = `| ${columns.map(() => "----------").join(" | ")} |`;
  const rows = [
    header,
    divider,
    ...procedureUses.map((procedureUse) => {
      const procedureId = procedureUse.id;
      const procedure = proceduresById.get(procedureId);
      const cells = [
        `\`${procedureId}\``,
        procedureUse.label ?? procedureUse.useId ?? "默认",
        procedureUse.when ?? "按 skill 主流程需要调用时",
        procedureUse.reason ?? procedure?.description ?? "执行该 procedure 对应步骤",
        renderProcedureArgs(procedure),
        renderProcedureOutput(procedure),
        renderProcedureCommand(skill, platform, procedureUse),
      ];
      return `| ${cells.map(renderMarkdownTableCell).join(" | ")} |`;
    }),
  ];
  return `\n## Procedure 调用说明\n\n${rows.join("\n")}\n`;
}

function procedureRuntimePath(platform: PlatformType): string {
  return platform === Platform.Claude ? "~/.claude/procedures.js" : "~/.codex/procedures.js";
}

function renderProcedureFields<TValue>(schema: ProcedureArgsDefinition<TValue> | ProcedureOutputDefinition<TValue> | undefined): string {
  if (!schema) return "未声明";
  const fields = Object.entries(schema.fields).map(([name, definition]) => {
    const required = definition.required === false ? "可选" : "必填";
    return `\`${name}\`: ${definition.type} (${required}) - ${definition.description}`;
  });
  if (fields.length === 0) return `\`${schema.typeName}\``;
  return `\`${schema.typeName}\`: ${fields.join("; ")}`;
}

function renderProcedureArgs(procedure: ProcedureDefinition | undefined): string {
  return renderProcedureFields(procedure?.args);
}

function renderProcedureOutput(procedure: ProcedureDefinition | undefined): string {
  return renderProcedureFields(procedure?.output);
}

function shellSingleQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function renderProcedureCommand(
  skill: SkillDefinition,
  platform: PlatformType,
  procedureUse: ResolvedProcedureUse,
): string {
  const requestPayload = procedureUse.exampleArgs ?? { args: [] };
  const requestJson = JSON.stringify(requestPayload);
  return [
    "node",
    procedureRuntimePath(platform),
    "--procedure-id",
    procedureUse.id,
    "--trigger-skill",
    skill.id,
    "--request-json",
    shellSingleQuote(requestJson),
  ].join(" ");
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

function renderUserInput(skill: SkillDefinition, platform: PlatformType): string {
  const params = skill.parameters ?? [];
  if (params.length === 0) return "";
  if (platform === Platform.Claude) {
    const names = params.map((p) => `$${p.name}`).join(" ");
    return `## 用户输入\n\n\`\`\`text\n${names}\n\`\`\`\n`;
  }
  // Codex: parameter table
  const rows = [
    "| 参数 | 类型 | 必填 | 说明 |",
    "|------|------|------|------|",
    ...params.map((p) =>
      `| \`${p.name}\` | ${p.type ?? "string"} | ${p.required !== false ? "是" : "否"} | ${p.description} |`
    ),
  ];
  return `## 用户输入\n\n${rows.join("\n")}\n`;
}

function renderRelatedSkills(skill: SkillDefinition): string {
  const relatedSkills = uniqueRelatedSkills(skill.relatedSkills ?? []);
  if (relatedSkills.length === 0) return "";
  const rows = relatedSkills.map((related) => {
    const label = related.label ?? related.id;
    return `- [${label}](../${related.id}/SKILL.md) — ${related.reason}`;
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
  const bodyWithChecklist = insertSectionBeforeH2Matching(
    body,
    renderChecklist(skill),
    (title) => title === "反模式" || title === "反模式速查",
  );
  const antiPatterns = renderAntiPatterns(skill);
  if (!antiPatterns) return bodyWithChecklist;
  return `${bodyWithChecklist.trimEnd()}\n\n${antiPatterns.trimEnd()}`;
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
  const body = readComponentText(skill.body).trimEnd();
  const generatedBody = renderBodyWithGeneratedSections(skill, body);
  return normalizeMarkdownBlankLines([
    renderSkillFrontmatter(skill, platform),
    `# ${skill.fullName}`,
    "",
    renderUseCases(skill),
    renderConstraints(skill),
    renderRelatedSkills(skill),
    renderUserInput(skill, platform),
    generatedBody,
    renderProcedureRegistry(skill, platform, proceduresById),
    renderReferenceMap(skill),
    "",
  ].join("\n"));
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
  proceduresById: ReadonlyMap<string, ProcedureDefinition>,
): Promise<void> {
  const skillRoot = join(platformRoot, "skills", skill.id);
  ensureDir(skillRoot);
  writeText(join(skillRoot, "SKILL.md"), renderSkillMd(skill, platform, proceduresById));
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
