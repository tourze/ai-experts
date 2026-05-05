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

const buildComponentsRoot = dirname(fileURLToPath(import.meta.url));
export const scriptsRoot = resolve(buildComponentsRoot, "..");
export const repoRoot = resolve(scriptsRoot, "..");
export const sourceRoot = join(repoRoot, "src/components");

export const Platform = {
  Claude: "claude-code",
  Codex: "codex-cli",
};

export const InvocationPolicy = {
  ExplicitOnly: "explicit-only",
  ModelOnly: "model-only",
};

export function parseArgs(argv) {
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

export function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

export function writeText(path, content) {
  ensureDir(dirname(path));
  writeFileSync(path, content, "utf-8");
}

export function collectFiles(root, predicate = () => true) {
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

export function needsRuntimeJsExtension(specifier) {
  if (!specifier.startsWith(".")) return false;
  const [pathPart] = specifier.split(/[?#]/, 1);
  return !/\.(?:js|mjs|cjs|json|node)$/u.test(pathPart);
}

export function appendRuntimeJsExtension(specifier) {
  if (!needsRuntimeJsExtension(specifier)) return specifier;
  const match = specifier.match(/^([^?#]*)(.*)$/);
  return `${match[1]}.js${match[2]}`;
}

export function rewriteRelativeImportSpecifiers(source) {
  return source
    .replace(/(\bfrom\s*["'])(\.[^"']+)(["'])/g, (_match, prefix, specifier, suffix) =>
      `${prefix}${appendRuntimeJsExtension(specifier)}${suffix}`)
    .replace(/(\bimport\s*["'])(\.[^"']+)(["'])/g, (_match, prefix, specifier, suffix) =>
      `${prefix}${appendRuntimeJsExtension(specifier)}${suffix}`)
    .replace(/(\bimport\s*\(\s*["'])(\.[^"']+)(["']\s*\))/g, (_match, prefix, specifier, suffix) =>
      `${prefix}${appendRuntimeJsExtension(specifier)}${suffix}`);
}

export function rewriteCompiledJsImports(root) {
  for (const file of collectFiles(root, (candidate) => candidate.endsWith(".js"))) {
    const source = readFileSync(file, "utf-8");
    const rewritten = rewriteRelativeImportSpecifiers(source);
    if (rewritten !== source) {
      writeFileSync(file, rewritten, "utf-8");
    }
  }
}

export function stripBundledSourcePathComments(file) {
  const source = readFileSync(file, "utf-8");
  const stripped = source.replace(
    /^\/\/ .*?(?:[\\/]components[\\/].*|[\\/]hooks[\\/]\.dispatch-entry)\.(?:ts|mjs)\r?\n/gm,
    "",
  );
  if (stripped !== source) {
    writeFileSync(file, stripped, "utf-8");
  }
}

export function renderDiscoveredHooksIndex(componentsRoot) {
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

export function toAbsolutePath(source) {
  if (source instanceof URL) return fileURLToPath(source);
  if (typeof source === "string") return resolve(repoRoot, source);
  throw new Error(`Unsupported component file reference: ${String(source)}`);
}

export function displayPath(source) {
  const absolute = toAbsolutePath(source);
  const rel = relative(repoRoot, absolute);
  return rel.startsWith("..") ? absolute : rel;
}

export function isSameOrInsidePath(candidate, parent) {
  const rel = relative(parent, candidate);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

export function readComponentText(source) {
  return readFileSync(toAbsolutePath(source), "utf-8");
}

export function readOptionalComponentText(source) {
  return source === undefined ? "" : readComponentText(source);
}

export function copyComponentPath(source, target) {
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

export function removeFiles(root, predicate) {
  for (const file of collectFiles(root, predicate)) {
    rmSync(file, { force: true });
  }
}

export function runtimeRelativeSpecifier(specifier) {
  if (!specifier.startsWith(".")) return specifier;
  const leaf = specifier.split("/").at(-1) ?? "";
  if (extname(leaf)) return specifier;
  return `${specifier}.mjs`;
}

export function rewriteRuntimeRelativeImports(file) {
  const source = readFileSync(file, "utf-8");
  const rewritten = source
    .replace(/\b(from\s*["'])(\.[^"']+)(["'])/g, (_, prefix, specifier, suffix) =>
      `${prefix}${runtimeRelativeSpecifier(specifier)}${suffix}`,
    )
    .replace(/\b(import\s*\(\s*["'])(\.[^"']+)(["']\s*\))/g, (_, prefix, specifier, suffix) =>
      `${prefix}${runtimeRelativeSpecifier(specifier)}${suffix}`,
    );
  if (rewritten !== source) writeFileSync(file, rewritten);
}

export function nodeScriptBanner(sourcePath) {
  const source = readFileSync(sourcePath, "utf-8");
  return source.startsWith("#!") ? undefined : { js: "#!/usr/bin/env node" };
}

export function yamlScalar(value) {
  return JSON.stringify(String(value));
}

export function tomlString(value) {
  return JSON.stringify(String(value));
}

export function tomlMultiline(value) {
  const text = String(value);
  if (!text.includes("'''")) {
    return `'''\n${text}\n'''`;
  }
  return tomlString(text);
}

export function tomlBoolean(value) {
  return value ? "true" : "false";
}

export function renderToolMatcher(matcher) {
  if (typeof matcher === "string") return matcher;
  if (matcher.kind === "mcp") {
    return matcher.tool
      ? `mcp__${matcher.server}__${matcher.tool}`
      : `mcp__${matcher.server}__.*`;
  }
  if (matcher.kind === "regex") return matcher.source;
  throw new Error(`Unsupported matcher: ${JSON.stringify(matcher)}`);
}

export function renderHookMatcher(hook) {
  if (!hook.matcher || hook.matcher.length === 0) return "";
  return hook.matcher.map(renderToolMatcher).join("|");
}

export function defaultReferenceTarget(reference) {
  const sourcePath = toAbsolutePath(reference.source);
  const name = basename(sourcePath);
  return reference.target ?? `references/${name}`;
}
