import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { afterAll, beforeAll, describe, test } from "vitest";
import { defaultReferenceTarget, toAbsolutePath } from "../../src/build/core.ts";
import { resolveHookTimeoutSeconds } from "../../src/build/hooks.ts";
import { validateMermaidSyntax } from "../../src/build/mermaid.ts";
import { codexSystemSkillIds } from "../../src/build/platform.ts";
import { listProcedureUses, procedureUseAppliesToPlatform } from "../../src/build/procedure-uses.ts";
import { compactCodexOpenAiShortDescription } from "../../src/build/skills.ts";
import { registry } from "../../src/components/registry.ts";
import { InvocationPolicy, Platform, type SkillReferenceDefinition } from "../../src/components/sdk.ts";
import {
  assertSingleDispatcherHookGroups,
  collectFiles,
  countH2OutsideCodeFence,
  markdownDestination,
  repoRoot,
  stripFrontmatter,
  stripMarkdownCode,
} from "./test-helpers";

let tmpDistDir = "";

export function getTmpDistDir(): string {
  return tmpDistDir;
}
export const codexSystemSkillIdSet = new Set<string>(codexSystemSkillIds);
export const componentBuildSetupTimeoutMs = 300_000;

type ParsedTomlScalar = string | boolean | number;
type ParsedGeneratedToml = {
  root: Record<string, ParsedTomlScalar>;
  sections: Record<string, Record<string, ParsedTomlScalar>>;
  arrays: Record<string, Record<string, ParsedTomlScalar>[]>;
};

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function findRuntimeCommandsMissingPassthroughSeparator(source: string, label: string): string[] {
  const findings: string[] = [];
  const runtimeCommandPattern =
    /node ~\/\.(?:claude|codex)\/procedures\.js --procedure-id [a-z0-9-]+ --trigger-(?:skill|agent) [a-z0-9-]+(?<tail>[^`"'\n]*)/gu;

  for (const match of source.matchAll(runtimeCommandPattern)) {
    const tail = (match.groups?.tail ?? "").trim();
    if (tail === "" || /^[).,;:]/u.test(tail)) continue;
    if (/^--(?:\s|\\|$)/u.test(tail)) continue;
    findings.push(`${label}: ${match[0].trim()}`);
  }

  return findings;
}

export function normalizeMarkdownReferenceLabel(label: string): string {
  return label.trim().replace(/\s+/gu, " ").toLowerCase();
}

export function githubStyleHeadingSlug(text: string): string {
  return text
    .replace(/`[^`]*`/gu, "")
    .trim()
    .toLowerCase()
    .replace(/<[^>]*>/gu, "")
    .replace(/[\t\n\r ]+/gu, "-")
    .replace(/[^\p{Letter}\p{Number}\p{Mark}\p{Connector_Punctuation}-]/gu, "");
}

export function decodeMarkdownAnchor(anchor: string): string {
  try {
    return decodeURIComponent(anchor);
  } catch {
    return anchor;
  }
}

export function collectMarkdownAnchors(source: string): Set<string> {
  const slugCounts = new Map<string, number>();
  const anchors = new Set<string>();

  for (const line of source.split(/\r?\n/u)) {
    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/u.exec(line);
    if (heading) {
      const baseSlug = githubStyleHeadingSlug(heading[2]);
      if (baseSlug) {
        const count = slugCounts.get(baseSlug) ?? 0;
        slugCounts.set(baseSlug, count + 1);
        anchors.add(count === 0 ? baseSlug : `${baseSlug}-${count}`);
      }
    }

    for (const match of line.matchAll(/<a\s+[^>]*(?:id|name)=["']([^"']+)["'][^>]*>/giu)) {
      anchors.add(match[1].toLowerCase());
    }
  }

  return anchors;
}

export function isLikelyLocalDefinitionPath(href: string): boolean {
  return href.startsWith("./")
    || href.startsWith("../")
    || href.includes("/")
    || /\.[A-Za-z0-9]+$/u.test(href);
}

export function referenceDirectoryIndexTarget(reference: SkillReferenceDefinition): string {
  const target = defaultReferenceTarget(reference).replace(/\/+$/u, "");
  return `${target}/index.md`;
}

export function parseGeneratedToml(source: string, label: string): ParsedGeneratedToml {
  const parsed: ParsedGeneratedToml = { root: {}, sections: {}, arrays: {} };
  let current = parsed.root;
  const lines = source.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;

    const arrayMatch = trimmed.match(/^\[\[([A-Za-z0-9_.-]+)\]\]$/);
    if (arrayMatch) {
      current = {};
      (parsed.arrays[arrayMatch[1]] ??= []).push(current);
      continue;
    }

    const sectionMatch = trimmed.match(/^\[([A-Za-z0-9_.-]+)\]$/);
    if (sectionMatch) {
      current = parsed.sections[sectionMatch[1]] ??= {};
      continue;
    }

    const assignment = line.match(/^([A-Za-z_][A-Za-z0-9_]*) = (.*)$/);
    assert.ok(assignment, `${label}:${index + 1} should be a TOML assignment or table header`);
    const key = assignment[1];
    const rawValue = assignment[2];
    assert.equal(Object.hasOwn(current, key), false, `${label}:${index + 1} should not duplicate ${key}`);

    if (rawValue === "'''") {
      const valueLines: string[] = [];
      let foundTerminator = false;
      for (index += 1; index < lines.length; index += 1) {
        if (lines[index] === "'''") {
          foundTerminator = true;
          break;
        }
        valueLines.push(lines[index]);
      }
      assert.equal(foundTerminator, true, `${label}:${key} multiline literal should terminate`);
      current[key] = valueLines.join("\n");
      continue;
    }

    if (rawValue === "true" || rawValue === "false") {
      current[key] = rawValue === "true";
      continue;
    }
    if (/^-?\d+$/.test(rawValue)) {
      current[key] = Number(rawValue);
      continue;
    }
    assert.match(rawValue, /^"/, `${label}:${index + 1} should use a TOML basic string`);
    current[key] = JSON.parse(rawValue) as string;
  }

  return parsed;
}

export function collectMermaidCodeBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  let open: { marker: string; length: number; language: string; lines: string[] } | null = null;

  for (const line of markdown.split(/\r?\n/u)) {
    const fence = line.match(/^( {0,3})(`{3,}|~{3,})([A-Za-z0-9_-]+)?\s*$/u);
    if (fence?.[2]) {
      const marker = fence[2][0] ?? "";
      const length = fence[2].length;
      if (!open) {
        open = {
          marker,
          length,
          language: (fence[3] ?? "").toLowerCase(),
          lines: [],
        };
        continue;
      }
      if (marker === open.marker && length >= open.length) {
        if (open.language === "mermaid") {
          blocks.push(open.lines.join("\n"));
        }
        open = null;
        continue;
      }
    }

    if (open) {
      open.lines.push(line);
    }
  }

  return blocks;
}

export function countMarkdownTablePipes(line: string): number {
  let count = 0;
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === "|" && line[index - 1] !== "\\") count += 1;
  }
  return count;
}

export function isMarkdownTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/u.test(line);
}

export function parseMarkdownFrontmatter(file: string): any {
  const source = readFileSync(file, "utf-8");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  assert.ok(match, `${relative(tmpDistDir, file)} should start with YAML frontmatter`);
  return parseYaml(match[1] ?? "");
}

export function collectSymlinks(root: string): string[] {
  const links: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isSymbolicLink()) {
        links.push(full);
        continue;
      }
      if (entry.isDirectory()) {
        walk(full);
      } else if (lstatSync(full).isSymbolicLink()) {
        links.push(full);
      }
    }
  };
  if (existsSync(root)) walk(root);
  return links.sort();
}

export function buildComponents(outDir: string): void {
  execFileSync(
    process.execPath,
    ["--import", "tsx/esm", "src/build.ts", "--out-dir", outDir],
    { cwd: repoRoot, encoding: "utf-8" },
  );
}

export function assertInstallManifestEntriesExist(platformRoot: string, manifest: any, label: string): void {
  const install = manifest.install as {
    rootEntries: string[];
    skillSourceRoot: string;
    skillEntries: string[];
    forbiddenRootEntries: string[];
    forbiddenSkillEntries: string[];
  };
  const assertNormalizedInstallEntry = (entry: string, context: string): void => {
    assert.equal(entry.trim(), entry, `${label} ${context} should not contain surrounding whitespace`);
    assert.doesNotMatch(entry, /\\/u, `${label} ${context} should use POSIX separators`);
    assert.doesNotMatch(entry, /^(?:\/|~\/)/u, `${label} ${context} should be relative to manifest roots`);
    assert.doesNotMatch(entry, /(?:^|\/)\.\.(?:\/|$)/u, `${label} ${context} should not traverse parent directories`);
    assert.doesNotMatch(entry, /^\.\//u, `${label} ${context} should not use redundant ./ prefixes`);
  };
  const assertUniqueEntries = (entries: string[], context: string): void => {
    assert.equal(
      new Set(entries).size,
      entries.length,
      `${label} ${context} should not contain duplicate entries`,
    );
  };

  assertNormalizedInstallEntry(install.skillSourceRoot, "install skillSourceRoot");
  assert.equal(
    install.skillSourceRoot.endsWith("/"),
    true,
    `${label} install skillSourceRoot should use a trailing slash to mark a directory`,
  );
  assertUniqueEntries(install.rootEntries, "install rootEntries");
  assertUniqueEntries(install.skillEntries, "install skillEntries");
  assertUniqueEntries(install.forbiddenRootEntries, "install forbiddenRootEntries");
  assertUniqueEntries(install.forbiddenSkillEntries, "install forbiddenSkillEntries");
  for (const rootEntry of install.rootEntries) {
    assertNormalizedInstallEntry(rootEntry, `install root entry ${rootEntry}`);
  }
  for (const skillEntry of install.skillEntries) {
    assertNormalizedInstallEntry(skillEntry, `install skill entry ${skillEntry}`);
    assert.equal(skillEntry.endsWith("/"), true, `${label} install skill entry should end with /: ${skillEntry}`);
    assert.match(
      skillEntry,
      /^[^/]+\/$/u,
      `${label} install skill entry should be a direct skill directory under skillSourceRoot: ${skillEntry}`,
    );
  }
  for (const forbiddenRootEntry of install.forbiddenRootEntries) {
    assertNormalizedInstallEntry(forbiddenRootEntry, `install forbidden root entry ${forbiddenRootEntry}`);
  }
  for (const forbiddenSkillEntry of install.forbiddenSkillEntries) {
    assertNormalizedInstallEntry(forbiddenSkillEntry, `install forbidden skill entry ${forbiddenSkillEntry}`);
    assert.equal(
      forbiddenSkillEntry.endsWith("/"),
      true,
      `${label} install forbidden skill entry should end with /: ${forbiddenSkillEntry}`,
    );
  }

  assert.equal(
    install.rootEntries.includes(install.skillSourceRoot),
    false,
    `${label} rootEntries should not duplicate skillEntries`,
  );

  for (const rootEntry of install.rootEntries) {
    assert.equal(
      existsSync(join(platformRoot, rootEntry)),
      true,
      `${label} install root entry should exist: ${rootEntry}`,
    );
  }

  const skillSourceRoot = join(platformRoot, install.skillSourceRoot);
  assert.equal(existsSync(skillSourceRoot), true, `${label} skillSourceRoot should exist`);
  for (const skillEntry of install.skillEntries) {
    assert.equal(
      existsSync(join(skillSourceRoot, skillEntry)),
      true,
      `${label} install skill entry should exist: ${skillEntry}`,
    );
  }

  for (const forbiddenRootEntry of install.forbiddenRootEntries) {
    assert.equal(
      install.rootEntries.includes(forbiddenRootEntry),
      false,
      `${label} forbidden root entry should not be installed as a config root entry: ${forbiddenRootEntry}`,
    );
    if (forbiddenRootEntry === install.skillSourceRoot) continue;

    assert.equal(
      existsSync(join(platformRoot, forbiddenRootEntry)),
      false,
      `${label} forbidden runtime entry should not be generated: ${forbiddenRootEntry}`,
    );
  }

  for (const forbiddenSkillEntry of install.forbiddenSkillEntries) {
    assert.equal(
      install.skillEntries.includes(forbiddenSkillEntry),
      false,
      `${label} forbidden skill entry should not be installed as a managed skill entry: ${forbiddenSkillEntry}`,
    );
    assert.equal(
      existsSync(join(skillSourceRoot, forbiddenSkillEntry)),
      false,
      `${label} forbidden skill-root runtime entry should not be generated: ${forbiddenSkillEntry}`,
    );
  }
}

beforeAll(() => {
  tmpDistDir = mkdtempSync(join(tmpdir(), "ai-experts-component-build-"));

  const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf-8"));
  assert.equal(existsSync(join(repoRoot, "scripts")), false);
  assert.equal(existsSync(join(repoRoot, "scripts/build-components.mjs")), false);
  assert.equal(existsSync(join(repoRoot, "src/build-components.ts")), false);
  assert.equal(existsSync(join(repoRoot, "src/build-components")), false);
  assert.match(packageJson.scripts["build:components"], /src\/build\.ts/);
  assert.doesNotMatch(packageJson.scripts["build:components"], /scripts\/build-components/);
  assert.doesNotMatch(packageJson.scripts["build:components"], /src\/build-components/);
  assert.doesNotMatch(packageJson.scripts["build:components"], /build-components\.mjs/);

  buildComponents(tmpDistDir);
}, componentBuildSetupTimeoutMs);

afterAll(() => {
  if (tmpDistDir) {
    rmSync(tmpDistDir, { recursive: true, force: true });
  }
});

export function collectHookGroupTimeouts(config: any): Record<string, number> {
  const timeouts: Record<string, number> = {};
  for (const [event, groups] of Object.entries(config.hooks as Record<string, any[]>)) {
    for (const group of groups) {
      const key = `${event}\0${group.matcher ?? ""}`;
      timeouts[key] = group.hooks[0].timeout;
    }
  }
  return timeouts;
}

export function collectExpectedHookGroupTimeouts(manifest: any): Record<string, number> {
  const timeouts: Record<string, number> = {};
  for (const hook of manifest.hooks as any[]) {
    const key = `${hook.event}\0${hook.matcher ?? ""}`;
    timeouts[key] = (timeouts[key] ?? 0) + resolveHookTimeoutSeconds(hook);
  }
  return timeouts;
}

export function assertHookGroupTimeoutsMatchManifest(config: any, manifest: any, label: string): void {
  assert.deepEqual(
    collectHookGroupTimeouts(config),
    collectExpectedHookGroupTimeouts(manifest),
    `${label} grouped dispatcher timeouts should equal the sum of sequential hook budgets`,
  );
}
