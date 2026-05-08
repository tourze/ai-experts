import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";

export const repoRoot = resolve(".");

export function collectFiles(root: string, predicate: (file: string) => boolean = () => true): string[] {
  const files: string[] = [];

  function walk(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && predicate(full)) {
        files.push(full);
      }
    }
  }

  walk(root);
  return files.sort();
}

export function hasTopLevelHeadingOutsideCodeFence(source: string): boolean {
  let inFence = false;
  for (const line of source.split(/\r?\n/)) {
    if (/^\s*(?:```|~~~)/.test(line)) {
      inFence = !inFence;
    } else if (!inFence && /^#\s+\S/.test(line)) {
      return true;
    }
  }
  return false;
}

export function countH2OutsideCodeFence(source: string, title: string): number {
  let count = 0;
  let inFence = false;
  for (const line of source.split(/\r?\n/)) {
    if (/^\s*(?:```|~~~)/.test(line)) {
      inFence = !inFence;
    } else if (!inFence && line.trim() === `## ${title}`) {
      count += 1;
    }
  }
  return count;
}

export function countH2OutsideCodeFenceMatching(
  source: string,
  predicate: (title: string) => boolean,
): number {
  let count = 0;
  let inFence = false;
  for (const line of source.split(/\r?\n/)) {
    if (/^\s*(?:```|~~~)/.test(line)) {
      inFence = !inFence;
    } else if (!inFence) {
      const heading = line.match(/^##\s+(.+?)\s*$/);
      if (heading && predicate(heading[1].trim())) {
        count += 1;
      }
    }
  }
  return count;
}

export function stripFrontmatter(source: string): string {
  return source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n+/, "");
}

export function stripMarkdownCode(source: string): string {
  return source
    .replace(/```[\s\S]*?```/gu, "")
    .replace(/~~~[\s\S]*?~~~/gu, "")
    .replace(/`[^`\n]*`/gu, "");
}

export function markdownDestination(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("<")) {
    const closeIndex = trimmed.indexOf(">");
    return closeIndex === -1 ? trimmed.slice(1) : trimmed.slice(1, closeIndex);
  }
  return trimmed.split(/\s+/, 1)[0] ?? "";
}

export function extractRelativeRuntimeSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  for (const match of source.matchAll(/^\s*(?:import|export|})[^\n]*\bfrom\s+["'](\.[^"']+)["']/gm)) {
    specifiers.push(match[1]);
  }
  for (const match of source.matchAll(/^\s*import\s+["'](\.[^"']+)["']/gm)) {
    specifiers.push(match[1]);
  }
  for (const match of source.matchAll(/\bimport\(\s*["'](\.[^"']+)["']\s*\)/g)) {
    specifiers.push(match[1]);
  }
  return specifiers;
}

export function firstNonEmptyLine(source: string): string {
  return source.trimStart().split(/\r?\n/, 1)[0] ?? "";
}

export function extractPropertyArray(source: string, property: string): string | null {
  const propertyMatch = new RegExp(`\\b${property}\\s*:`).exec(source);
  if (!propertyMatch) return null;
  const open = source.indexOf("[", propertyMatch.index + propertyMatch[0].length);
  if (open === -1) return null;

  let depth = 0;
  let quote: string | null = null;
  let escaped = false;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "[") depth += 1;
    else if (char === "]") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, index);
    }
  }

  throw new Error(`Unclosed ${property} array`);
}

export function assertSingleDispatcherHookGroups(config: any, label: string): void {
  for (const [event, groups] of Object.entries(config.hooks as Record<string, any[]>)) {
    const seenMatchers = new Set<string>();
    for (const group of groups) {
      const matcher = group.matcher ?? "";
      const key = `${event}\0${matcher}`;
      assert.equal(seenMatchers.has(key), false, `${label} should emit one group per ${event}/${matcher}`);
      seenMatchers.add(key);
      assert.equal(
        group.hooks.length,
        1,
        `${label} ${event}/${matcher || "(no matcher)"} should invoke the single bundled dispatcher once`,
      );
      assert.match(group.hooks[0].command, /hooks\/dispatch\.mjs/);
    }
  }
}
