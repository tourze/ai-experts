import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  appendRuntimeJsExtension,
  collectFiles,
  copyComponentPath,
  defaultReferenceTarget,
  displayPath,
  isSameOrInsidePath,
  needsRuntimeJsExtension,
  nodeScriptBanner,
  parseArgs,
  readComponentText,
  removeFiles,
  renderHookMatcher,
  renderToolMatcher,
  renderYamlFrontmatter,
  repoRoot,
  rewriteCompiledJsImports,
  rewriteRelativeImportSpecifiers,
  rewriteRuntimeRelativeImports,
  runtimeRelativeSpecifier,
  stripBundledSourcePathComments,
  toAbsolutePath,
  tomlBoolean,
  tomlMultiline,
  tomlString,
  writeText,
} from "../../src/build/core.ts";
import { KnownTool } from "../../src/components/sdk";
import { JS_LINT_EXTENSIONS, pathContains } from "../../src/components/hooks/_shared/hook-edit-write-utils";

const tempDirs: string[] = [];

function createTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop() as string, { recursive: true, force: true });
  }
});

describe("build/core", () => {
  test("parseArgs handles supported flags", () => {
    expect(parseArgs([])).toEqual({ outDir: join(repoRoot, "dist"), check: false, help: false });
    expect(parseArgs(["--check"])).toEqual({ outDir: join(repoRoot, "dist"), check: true, help: false });
    expect(parseArgs(["--help"])).toEqual({ outDir: join(repoRoot, "dist"), check: false, help: true });
    expect(parseArgs(["--out-dir", "/tmp/out"])).toEqual({ outDir: resolve("/tmp/out"), check: false, help: false });
    expect(parseArgs(["--out-dir=/tmp/out"])).toEqual({ outDir: resolve("/tmp/out"), check: false, help: false });
    expect(() => parseArgs(["--out-dir"])).toThrow("--out-dir requires a value");
    expect(() => parseArgs(["--out-dir", "--check"])).toThrow("--out-dir requires a value");
    expect(() => parseArgs(["--out-dir="])).toThrow("--out-dir requires a value");
    expect(() => parseArgs(["--bad-flag"])).toThrow("Unknown argument");
  });

  test("filesystem helpers collect and rewrite files", () => {
    const root = createTempDir("ai-experts-core-");
    writeText(join(root, "a", "input.txt"), "content");
    writeText(join(root, "a", "script.js"), "import x from './dep';\n");
    writeText(join(root, "a", "dep.js"), "export default 1;\n");
    writeText(join(root, "b", "note.md"), "doc");

    expect(new Set(collectFiles(root).map((file) => basename(file)))).toEqual(new Set(["dep.js", "input.txt", "note.md", "script.js"]));
    expect(collectFiles(root, (file) => file.endsWith(".js")).length).toBe(2);

    rewriteCompiledJsImports(root);
    expect(readFileSync(join(root, "a", "script.js"), "utf-8")).toContain("./dep.js");

    writeText(join(root, "patch.mjs"), "// /tmp/components/x.ts\nconst a = 1;\n// /tmp/hooks/.dispatch-entry.mjs\n");
    stripBundledSourcePathComments(join(root, "patch.mjs"));
    expect(readFileSync(join(root, "patch.mjs"), "utf-8")).toBe("const a = 1;\n");

    removeFiles(root, (file) => file.endsWith(".md"));
    expect(collectFiles(root, (file) => file.endsWith(".md"))).toEqual([]);
  });

  test("import specifier helpers work for runtime formats", () => {
    expect(needsRuntimeJsExtension("./x")).toBe(true);
    expect(needsRuntimeJsExtension("./x.js")).toBe(false);
    expect(needsRuntimeJsExtension("node:fs")).toBe(false);
    expect(appendRuntimeJsExtension("./x?raw")).toBe("./x.js?raw");
    expect(rewriteRelativeImportSpecifiers("import a from './a';")).toContain("./a.js");

    expect(runtimeRelativeSpecifier("./task")).toBe("./task.mjs");
    expect(runtimeRelativeSpecifier("./task.js")).toBe("./task.js");
    const root = createTempDir("ai-experts-runtime-imports-");
    writeText(join(root, "run.mjs"), "import x from './dep';\nconst y = import('./lazy');\n");
    rewriteRuntimeRelativeImports(join(root, "run.mjs"));
    const rewritten = readFileSync(join(root, "run.mjs"), "utf-8");
    expect(rewritten).toContain("./dep.mjs");
    expect(rewritten).toContain("./lazy.mjs");
  });

  test("component path helpers and serializers", () => {
    const root = createTempDir("ai-experts-path-");
    writeText(join(root, "entry.txt"), "hello");
    const sourceUrl = new URL(`file://${join(root, "entry.txt")}`);
    expect(toAbsolutePath(sourceUrl)).toBe(join(root, "entry.txt"));
    expect(readComponentText(sourceUrl)).toBe("hello");
    expect(displayPath(sourceUrl)).toBe(join(root, "entry.txt"));
    expect(displayPath("README.md")).toBe("README.md");

    copyComponentPath(sourceUrl, join(root, "copy", "entry.txt"));
    expect(readFileSync(join(root, "copy", "entry.txt"), "utf-8")).toBe("hello");
    expect(() => copyComponentPath(new URL("file:///tmp/not-found.txt"), join(root, "target"))).toThrow("Missing source path");

    expect(isSameOrInsidePath(join(root, "copy", "entry.txt"), root)).toBe(true);
    expect(isSameOrInsidePath("/tmp", join(root, "copy"))).toBe(false);

    expect(nodeScriptBanner(join(root, "entry.txt"))).toEqual({ js: "#!/usr/bin/env node" });
    writeFileSync(join(root, "with-shebang.ts"), "#!/usr/bin/env node\nconsole.log(1)\n");
    expect(nodeScriptBanner(join(root, "with-shebang.ts"))).toBeUndefined();

    expect(renderYamlFrontmatter({ name: "v", enabled: true })).toBe("---\nname: v\nenabled: true\n---\n");
    expect(tomlString("v")).toBe("\"v\"");
    expect(tomlBoolean(true)).toBe("true");
    expect(tomlMultiline("a\nb")).toContain("'''");
  });

  test("hook matcher rendering and reference targets", () => {
    const componentsRoot = createTempDir("ai-experts-hooks-index-");

    expect(renderToolMatcher(KnownTool.Bash)).toBe("Bash");
    expect(renderToolMatcher({ kind: "mcp", server: "x" })).toBe("mcp__x__.*");
    expect(renderToolMatcher({ kind: "mcp", server: "x", tool: "y" })).toBe("mcp__x__y");
    expect(renderToolMatcher({ kind: "mcp", server: "gh.server+1", tool: "issue(write)" })).toBe(
      "mcp__gh.server+1__issue(write)",
    );
    expect(renderToolMatcher({ kind: "regex", source: "Bash|Read" })).toBe("Bash|Read");
    expect(renderHookMatcher({ matcher: [KnownTool.Bash] })).toBe("Bash");
    expect(
      renderHookMatcher({
        matcher: [{ kind: "mcp", server: "gh.server+1", tool: "issue(write)" }],
      }),
    ).toBe("mcp__gh\\.server\\+1__issue\\(write\\)");
    expect(renderHookMatcher({ matcher: undefined })).toBe("");

    const reference = {
      id: "ref",
      source: new URL(`file://${join(componentsRoot, "hooks", "session-start", "alpha.ts")}`),
      title: "t",
      summary: "s",
      loadWhen: "l",
    };
    expect(defaultReferenceTarget(reference)).toBe("references/alpha.ts");
    expect(defaultReferenceTarget({ ...reference, target: "references/custom.md" })).toBe("references/custom.md");
  });

  test("hook path and extension helpers cover root paths and mjs", () => {
    expect(pathContains(".github/workflows/ci.yml", ".github/workflows")).toBe(true);
    expect(pathContains("src/.github/workflows/ci.yml", ".github/workflows")).toBe(true);
    expect(pathContains("src/github/workflows/ci.yml", ".github/workflows")).toBe(false);

    expect(JS_LINT_EXTENSIONS.includes(".mjs")).toBe(true);
    expect(JS_LINT_EXTENSIONS.every((ext) => ext.length > 0)).toBe(true);
  });
});
