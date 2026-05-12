import { join } from "node:path";
import type { Platform as PlatformType, RuleBodyDefinition, RuleDefinition } from "../components/sdk";
import { ensureDir, Platform, readComponentText, writeText } from "./core";

function yamlString(value: string): string {
  return JSON.stringify(value);
}

function ruleSort(a: RuleDefinition, b: RuleDefinition): number {
  return (a.priority ?? 100) - (b.priority ?? 100) || a.id.localeCompare(b.id);
}

export function collectPlatformRules(
  rules: readonly RuleDefinition[],
  platform: PlatformType,
): RuleDefinition[] {
  return rules
    .filter((rule) => rule.platforms.includes(platform))
    .slice()
    .sort(ruleSort);
}

export function ruleOutputDirName(platform: PlatformType): "rules" | "context-rules" {
  return platform === Platform.Claude ? "rules" : "context-rules";
}

export function ruleRuntimePath(rule: RuleDefinition, platform: PlatformType): string {
  return platform === Platform.Claude
    ? `~/.claude/rules/${rule.id}.md`
    : `~/.codex/context-rules/${rule.id}.md`;
}

function renderRuleFrontmatter(rule: RuleDefinition): string {
  return [
    "---",
    `description: ${yamlString(rule.description)}`,
    "paths:",
    ...rule.paths.map((path) => `  - ${yamlString(path)}`),
    "---",
    "",
  ].join("\n");
}

function isInlineRuleBody(body: RuleDefinition["body"]): body is RuleBodyDefinition {
  return typeof body === "object" && body !== null && !(body instanceof URL) && Array.isArray(body.lines);
}

function readRuleBodyText(rule: RuleDefinition): string {
  if (isInlineRuleBody(rule.body)) return rule.body.lines.join("\n");
  return readComponentText(rule.body);
}

export function renderRuleMd(rule: RuleDefinition): string {
  return [
    renderRuleFrontmatter(rule).trimEnd(),
    `# ${rule.title}`,
    readRuleBodyText(rule).trim(),
    "",
  ].join("\n\n");
}

export function renderCodexRuleIndex(rules: readonly RuleDefinition[]): string {
  const rows = rules.length > 0
    ? rules.map((rule) => `- [${rule.id}](${rule.id}.md): ${rule.paths.map((path) => `\`${path}\``).join(", ")}`)
    : ["- none"];
  return ["# Context Rule Index", "", ...rows, ""].join("\n");
}

export function renderCodexRuleRouteSupplement(rules: readonly RuleDefinition[]): string {
  if (rules.length === 0) return "";
  return [
    "## Context Rule 路由补充",
    "",
    "当任务会读取或修改匹配路径时，先读取对应上下文 Rule：",
    ...rules.map((rule) =>
      `- ${rule.id}: ${rule.paths.map((path) => `\`${path}\``).join(", ")} -> \`${ruleRuntimePath(rule, Platform.Codex)}\``
    ),
    "",
  ].join("\n");
}

export function emitRules(
  rules: readonly RuleDefinition[],
  platformRoot: string,
  platform: PlatformType,
): string[] {
  const platformRules = collectPlatformRules(rules, platform);
  const rulesRoot = join(platformRoot, ruleOutputDirName(platform));
  ensureDir(rulesRoot);

  for (const rule of platformRules) {
    writeText(join(rulesRoot, `${rule.id}.md`), renderRuleMd(rule));
  }

  if (platform === Platform.Codex) {
    writeText(join(rulesRoot, "index.md"), renderCodexRuleIndex(platformRules));
  }

  return platformRules.map((rule) => rule.id);
}
