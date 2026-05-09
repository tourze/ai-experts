import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { stringify as stringifyYaml } from "yaml";
import { InvocationPolicy, Platform } from "../components/sdk";
import type {
  ComponentFile,
  HookDefinition,
  SkillReferenceDefinition,
  ToolMatcher,
} from "../components/sdk";

const buildComponentsRoot = dirname(fileURLToPath(import.meta.url));
export const srcRoot = resolve(buildComponentsRoot, "..");
export const repoRoot = resolve(srcRoot, "..");
export const sourceRoot = join(repoRoot, "src/components");

export { InvocationPolicy, Platform };

export type ParsedBuildArgs = {
  outDir: string;
  check: boolean;
  help: boolean;
};

export function parseArgs(argv: readonly string[]): ParsedBuildArgs {
  const args: ParsedBuildArgs = { outDir: join(repoRoot, "dist"), check: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check") args.check = true;
    else if (arg === "--out-dir" && argv[index + 1] !== undefined) {
      args.outDir = resolve(argv[index + 1] as string);
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

export function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

export function writeText(path: string, content: string): void {
  ensureDir(dirname(path));
  writeFileSync(path, content, "utf-8");
}

export type FilePredicate = (path: string) => boolean;

export function collectFiles(root: string, predicate: FilePredicate = () => true): string[] {
  const files: string[] = [];
  function walk(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && predicate(full)) files.push(full);
    }
  }
  if (existsSync(root)) walk(root);
  return files.sort();
}

export function needsRuntimeJsExtension(specifier: string): boolean {
  if (!specifier.startsWith(".")) return false;
  const [pathPart] = specifier.split(/[?#]/, 1);
  return typeof pathPart === "string" && !/\.(?:js|mjs|cjs|json|node)$/u.test(pathPart);
}

export function appendRuntimeJsExtension(specifier: string): string {
  if (!needsRuntimeJsExtension(specifier)) return specifier;
  const match = specifier.match(/^([^?#]*)(.*)$/);
  if (!match) return `${specifier}.js`;
  return `${match[1]}.js${match[2]}`;
}

export function rewriteRelativeImportSpecifiers(source: string): string {
  return source
    .replace(/(\bfrom\s*["'])(\.[^"']+)(["'])/g, (_match, prefix: string, specifier: string, suffix: string) =>
      `${prefix}${appendRuntimeJsExtension(specifier)}${suffix}`)
    .replace(/(\bimport\s*["'])(\.[^"']+)(["'])/g, (_match, prefix: string, specifier: string, suffix: string) =>
      `${prefix}${appendRuntimeJsExtension(specifier)}${suffix}`)
    .replace(/(\bimport\s*\(\s*["'])(\.[^"']+)(["']\s*\))/g, (_match, prefix: string, specifier: string, suffix: string) =>
      `${prefix}${appendRuntimeJsExtension(specifier)}${suffix}`);
}

export function rewriteCompiledJsImports(root: string): void {
  for (const file of collectFiles(root, (candidate) => candidate.endsWith(".js"))) {
    const source = readFileSync(file, "utf-8");
    const rewritten = rewriteRelativeImportSpecifiers(source);
    if (rewritten !== source) {
      writeFileSync(file, rewritten, "utf-8");
    }
  }
}

export function stripBundledSourcePathComments(file: string): void {
  const source = readFileSync(file, "utf-8");
  const stripped = source.replace(
    /^\/\/ .*?(?:[\\/]components[\\/].*|[\\/]hooks[\\/]\.dispatch-entry)\.(?:ts|mjs)\r?\n/gm,
    "",
  );
  if (stripped !== source) {
    writeFileSync(file, stripped, "utf-8");
  }
}

export function toAbsolutePath(source: ComponentFile): string {
  if (source instanceof URL) return fileURLToPath(source);
  if (typeof source === "string") return resolve(repoRoot, source);
  throw new Error(`Unsupported component file reference: ${String(source)}`);
}

export function displayPath(source: ComponentFile): string {
  const absolute = toAbsolutePath(source);
  const rel = relative(repoRoot, absolute);
  return rel.startsWith("..") ? absolute : rel;
}

export function isSameOrInsidePath(candidate: string, parent: string): boolean {
  const rel = relative(parent, candidate);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

export function readComponentText(source: ComponentFile): string {
  return readFileSync(toAbsolutePath(source), "utf-8");
}

export function copyComponentPath(source: ComponentFile, target: string): void {
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

export function removeFiles(root: string, predicate: FilePredicate): void {
  for (const file of collectFiles(root, predicate)) {
    rmSync(file, { force: true });
  }
}

export function runtimeRelativeSpecifier(specifier: string): string {
  if (!specifier.startsWith(".")) return specifier;
  const leaf = specifier.split("/").at(-1) ?? "";
  if (extname(leaf)) return specifier;
  return `${specifier}.mjs`;
}

export function rewriteRuntimeRelativeImports(file: string): void {
  const source = readFileSync(file, "utf-8");
  const rewritten = source
    .replace(/\b(from\s*["'])(\.[^"']+)(["'])/g, (_, prefix: string, specifier: string, suffix: string) =>
      `${prefix}${runtimeRelativeSpecifier(specifier)}${suffix}`,
    )
    .replace(/\b(import\s*\(\s*["'])(\.[^"']+)(["']\s*\))/g, (_, prefix: string, specifier: string, suffix: string) =>
      `${prefix}${runtimeRelativeSpecifier(specifier)}${suffix}`,
    );
  if (rewritten !== source) writeFileSync(file, rewritten, "utf-8");
}

export function nodeScriptBanner(sourcePath: string): { js: string } | undefined {
  const source = readFileSync(sourcePath, "utf-8");
  return source.startsWith("#!") ? undefined : { js: "#!/usr/bin/env node" };
}

export function renderYamlFrontmatter(fields: Record<string, unknown>): string {
  const frontmatter = stringifyYaml(fields, { lineWidth: 0 }).trimEnd();
  return `---\n${frontmatter}\n---\n`;
}

export function tomlString(value: unknown): string {
  return JSON.stringify(String(value));
}

export function tomlMultiline(value: unknown): string {
  const text = String(value);
  if (!text.includes("'''")) {
    return `'''\n${text}\n'''`;
  }
  return tomlString(text);
}

export function tomlBoolean(value: boolean): string {
  return value ? "true" : "false";
}

function escapeRegexLiteral(value: string): string {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}

export function renderToolMatcher(matcher: ToolMatcher): string {
  if (typeof matcher === "string") return matcher;
  if (matcher.kind === "mcp") {
    return matcher.tool
      ? `mcp__${matcher.server}__${matcher.tool}`
      : `mcp__${matcher.server}__.*`;
  }
  if (matcher.kind === "regex") return matcher.source;
  throw new Error(`Unsupported matcher: ${JSON.stringify(matcher)}`);
}

function renderHookToolMatcher(matcher: ToolMatcher): string {
  if (typeof matcher === "string") return escapeRegexLiteral(matcher);
  if (matcher.kind === "mcp") {
    const server = escapeRegexLiteral(matcher.server);
    return matcher.tool
      ? `mcp__${server}__${escapeRegexLiteral(matcher.tool)}`
      : `mcp__${server}__.*`;
  }
  if (matcher.kind === "regex") return matcher.source;
  throw new Error(`Unsupported matcher: ${JSON.stringify(matcher)}`);
}

export function renderHookMatcher(hook: Pick<HookDefinition, "matcher">): string {
  if (!hook.matcher || hook.matcher.length === 0) return "";
  return hook.matcher.map(renderHookToolMatcher).join("|");
}

export function defaultReferenceTarget(reference: SkillReferenceDefinition): string {
  const sourcePath = toAbsolutePath(reference.source);
  const name = basename(sourcePath);
  return reference.target ?? `references/${name}`;
}
