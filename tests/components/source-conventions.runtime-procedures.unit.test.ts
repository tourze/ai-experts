import assert from "node:assert/strict";
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, test } from "vitest";
import { validateRegistry } from "../../src/build/platform.ts";
import { collectPlatformProcedures } from "../../src/build/procedures.ts";
import { registry } from "../../src/components/registry.ts";
import { InvocationPolicy, Platform } from "../../src/components/sdk.ts";
import {
  collectFiles,
  extractPropertyArray,
  markdownDestination,
  repoRoot,
  stripMarkdownCode,
} from "./test-helpers";

function githubStyleHeadingSlug(text: string): string {
  return text
    .replace(/`[^`]*`/gu, "")
    .trim()
    .toLowerCase()
    .replace(/<[^>]*>/gu, "")
    .replace(/[\t\n\r ]+/gu, "-")
    .replace(/[^\p{Letter}\p{Number}\p{Mark}\p{Connector_Punctuation}-]/gu, "");
}

function decodeMarkdownAnchor(anchor: string): string {
  try {
    return decodeURIComponent(anchor);
  } catch {
    return anchor;
  }
}

function normalizeMarkdownReferenceLabel(label: string): string {
  return label.trim().replace(/\s+/gu, " ").toLowerCase();
}

function isLikelyLocalDefinitionPath(href: string): boolean {
  if (href.includes("[") || href.includes("]")) return false;
  return href.startsWith("./")
    || href.startsWith("../")
    || href.includes("/")
    || /\.[A-Za-z0-9]+$/u.test(href);
}

function localMarkdownPath(destination: string): string | null {
  const path = destination.split("#", 1)[0] ?? "";
  if (!path || path.startsWith("//") || /^[a-z][a-z0-9+.-]*:/iu.test(path)) {
    return null;
  }
  return path.replace(/\\/gu, "/");
}

function collectMarkdownAnchors(source: string): Set<string> {
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


describe("component source runtime procedure conventions", () => {
  test("skill authoring guidance does not reintroduce skill-local scripts directories", () => {
    const authoringSources = [
      join(repoRoot, "src/components/agents/skill-author/index.ts"),
      join(repoRoot, "src/components/skills/skill-creator/index.ts"),
      ...collectFiles(join(repoRoot, "src/components/skills/skill-creator/references"), (file) =>
        file.endsWith(".md"),
      ),
      join(repoRoot, "src/components/skills/skill-evolver/index.ts"),
      ...collectFiles(join(repoRoot, "src/components/skills/skill-evolver/references"), (file) =>
        file.endsWith(".md"),
      ),
      ...collectFiles(join(repoRoot, "src/components/skills/skill-evaluator/references"), (file) =>
        file.endsWith(".md"),
      ),
    ];
    const legacyAuthoringScriptRefs: string[] = [];
    const legacyScriptPackagePattern = /scripts\/\*|`scripts\/`|scripts\/、|references\/scripts|scripts\/references|scripts、|脚手架资产（scripts/u;

    for (const sourceFile of authoringSources) {
      const source = readFileSync(sourceFile, "utf-8");
      const match = source.match(legacyScriptPackagePattern);
      if (match) {
        legacyAuthoringScriptRefs.push(`${relative(repoRoot, sourceFile)}: ${match[0]}`);
      }
    }

    assert.deepEqual(
      legacyAuthoringScriptRefs,
      [],
      "skill authoring guidance should route reusable code through procedures instead of skill-local scripts/ directories",
    );
  });

  test("skill creator authoring guidance uses cases yaml eval files", () => {
    const skillCreatorSources = [
      join(repoRoot, "src/components/skills/skill-creator/index.ts"),
      ...collectFiles(join(repoRoot, "src/components/skills/skill-creator/references"), (file) =>
        file.endsWith(".md"),
      ),
      join(repoRoot, "src/components/procedures/sources/skill-creator/run_eval.ts"),
      join(repoRoot, "src/components/procedures/sources/skill-creator/run_loop.ts"),
    ];
    const staleEvalSetRefs: string[] = [];

    for (const sourceFile of skillCreatorSources) {
      const source = readFileSync(sourceFile, "utf-8");
      if (/evals\/evals\.json|--eval-set evals\.json/u.test(source)) {
        staleEvalSetRefs.push(relative(repoRoot, sourceFile));
      }
    }

    assert.deepEqual(staleEvalSetRefs, [], "skill creator should default to evals/cases.yaml, not evals/evals.json");
    assert.match(
      readFileSync(join(repoRoot, "src/components/skills/skill-creator/index.ts"), "utf-8"),
      /evals\/cases\.yaml/,
    );
    assert.match(
      readFileSync(join(repoRoot, "src/components/skills/skill-creator/references/schemas.md"), "utf-8"),
      /cases:\n  - id:/,
    );
  });

  test("cross-platform source names project memory files neutrally", () => {
    const platformSpecificMemoryRefs: string[] = [];
    for (const sourceFile of collectFiles(join(repoRoot, "src/components"))) {
      const source = readFileSync(sourceFile, "utf-8");
      if (/全局 CLAUDE\.md|仓库 `CLAUDE\.md`|记忆文件 \/ plan \/ CLAUDE\.md/.test(source)) {
        platformSpecificMemoryRefs.push(relative(repoRoot, sourceFile));
      }
    }

    assert.deepEqual(
      platformSpecificMemoryRefs,
      [],
      "cross-platform components should refer to project memory files neutrally, not only CLAUDE.md",
    );
  });

  test("hooks use the normalized payload contract", () => {
    const sdkSource = readFileSync(join(repoRoot, "src/components/sdk.ts"), "utf-8");
    const hookBuilderSource = readFileSync(join(repoRoot, "src/build/hooks.ts"), "utf-8");
    const hookSources = collectFiles(join(repoRoot, "src/components/hooks"), (file) => file.endsWith(".ts"));

    assert.doesNotMatch(sdkSource, /\bLegacyHook(?:Payload|ToolInput)\b|payloadMode\?:/);
    assert.doesNotMatch(hookBuilderSource, /\btoLegacyClaudePayload\b|payloadMode|claude-raw/);
    for (const hookSource of hookSources) {
      const source = readFileSync(hookSource, "utf-8");
      assert.doesNotMatch(
        source,
        /\bLegacyHookPayload\b|payloadMode:\s*"claude-raw"|payload\?\.(?:tool_input|tool_name|transcript_path|session_id|stop_hook_active)/,
        `${hookSource} should consume NormalizedHookPayload directly`,
      );
    }
  });

  test("hook source modules are all registered", () => {
    const hookRoot = join(repoRoot, "src/components/hooks");
    const hookSourceFiles = collectFiles(
      hookRoot,
      (file) => file.endsWith(".ts") && !file.endsWith("/index.ts") && !file.includes(`${join("hooks", "_shared")}${"/"}`),
    );
    const hookFilesWithDefinitions = hookSourceFiles
      .filter((file) => /export\s+const\s+[A-Za-z0-9_$]+\s*=\s*defineHook\s*\(/.test(readFileSync(file, "utf-8")))
      .map((file) => relative(repoRoot, file))
      .sort();
    const registeredHookFiles = registry.hooks
      .map((hook) => relative(repoRoot, hook.entry instanceof URL ? fileURLToPath(hook.entry) : hook.entry))
      .sort();

    assert.deepEqual(
      registeredHookFiles,
      hookFilesWithDefinitions,
      "every hook source that defines a hook should be registered through src/components/hooks/index.ts",
    );
  });

  test("registered procedures export main and do not execute at module top level", () => {
    function procedurePath(entry: URL | string): string {
      return entry instanceof URL ? fileURLToPath(entry) : entry;
    }

    function exportsProcedure(sourceFile: ts.SourceFile): boolean {
      return sourceFile.statements.some((statement) =>
        ts.isVariableStatement(statement) &&
        statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) &&
        statement.declarationList.declarations.some((declaration) =>
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === "procedure" &&
          declaration.initializer !== undefined &&
          ts.isCallExpression(declaration.initializer) &&
          declaration.initializer.expression.getText(sourceFile) === "defineCliProcedure"
        )
      );
    }

    function sourceLocalProcedureEntry(sourceFile: ts.SourceFile): string | null {
      for (const statement of sourceFile.statements) {
        if (!ts.isVariableStatement(statement)) continue;
        for (const declaration of statement.declarationList.declarations) {
          if (
            !ts.isIdentifier(declaration.name) ||
            declaration.name.text !== "procedure" ||
            !declaration.initializer ||
            !ts.isCallExpression(declaration.initializer)
          ) continue;
          const objectArg = declaration.initializer.arguments[0];
          if (!objectArg || !ts.isObjectLiteralExpression(objectArg)) continue;
          for (const property of objectArg.properties) {
            if (
              ts.isPropertyAssignment(property) &&
              ts.isIdentifier(property.name) &&
              property.name.text === "entry"
            ) {
              if (
                ts.isCallExpression(property.initializer) &&
                property.initializer.expression.getText(sourceFile) === "procedureEntry" &&
                property.initializer.arguments[0]?.getText(sourceFile) === "import.meta.url"
              ) {
                return "__self__";
              }
              if (
                ts.isNewExpression(property.initializer) &&
                property.initializer.expression.getText(sourceFile) === "URL"
              ) {
                const [firstArg] = property.initializer.arguments ?? [];
                if (firstArg && ts.isStringLiteral(firstArg)) return firstArg.text;
              }
            }
          }
        }
      }
      return null;
    }

    function exportsMain(sourceFile: ts.SourceFile): boolean {
      return sourceFile.statements.some((statement) =>
        (ts.isFunctionDeclaration(statement) &&
          statement.name?.text === "main" &&
          statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) ||
        (ts.isVariableStatement(statement) &&
          statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) &&
          statement.declarationList.declarations.some((declaration) =>
            ts.isIdentifier(declaration.name) && declaration.name.text === "main"
          ))
      );
    }

    const procedureRegistrySource = readFileSync(join(repoRoot, "src/components/procedures/registry.ts"), "utf-8");
    assert.doesNotMatch(
      procedureRegistrySource,
      /\bdefineCliProcedure\s*\(/,
      "procedure metadata should live beside the source implementation, not in the central registry",
    );

    const missingProcedureExport = registry.procedures
      .map((procedure) => {
        const path = procedurePath(procedure.entry);
        const source = readFileSync(path, "utf-8");
        const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        return {
          id: procedure.id,
          path,
          sourceFile,
        };
      })
      .filter(({ sourceFile }) => !exportsProcedure(sourceFile))
      .map(({ id, path }) => `${id}: ${relative(repoRoot, path)}`);

    assert.deepEqual(
      missingProcedureExport,
      [],
      "registered Procedure entries must export their defineCliProcedure metadata from the entry source module",
    );

    const mismatchedProcedureEntries = registry.procedures
      .map((procedure) => {
        const path = procedurePath(procedure.entry);
        const source = readFileSync(path, "utf-8");
        const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        const localEntry = sourceLocalProcedureEntry(sourceFile);
        const expected = resolve(path);
        const actual = localEntry === "__self__" ? expected : localEntry ? resolve(dirname(path), localEntry) : null;
        return { id: procedure.id, path, expected, actual };
      })
      .filter(({ expected, actual }) => expected !== actual)
      .map(({ id, path }) => `${id}: ${relative(repoRoot, path)}`);

    assert.deepEqual(
      mismatchedProcedureEntries,
      [],
      "source-local Procedure metadata entry should point at its own source file",
    );

    function mainFunctionProblem(sourceFile: ts.SourceFile): string | null {
      for (const statement of sourceFile.statements) {
        if (ts.isFunctionDeclaration(statement) && statement.name?.text === "main") {
          const argvParam = statement.parameters[0];
          if (!argvParam) return "main does not accept argv";
          if (!ts.isIdentifier(argvParam.name) || argvParam.name.text !== "argv") return "first main parameter is not argv";
          if (argvParam.initializer) return "main argv parameter has a default value";
          if (argvParam.type?.getText(sourceFile) !== "readonly string[]") return "main argv is not typed as readonly string[]";
          if (statement.getText(sourceFile).includes("process.argv")) return "main reads process.argv";
        }
        if (ts.isVariableStatement(statement)) {
          for (const declaration of statement.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name) && declaration.name.text === "main") {
              if (statement.getText(sourceFile).includes("process.argv")) return "main reads process.argv";
            }
          }
        }
      }
      return null;
    }

    function statementText(source: string, statement: ts.Statement): string {
      return source.slice(statement.getFullStart(), statement.getEnd());
    }

    function topLevelExecutionReason(source: string, statement: ts.Statement): string | null {
      const text = statementText(source, statement);
      if (ts.isExpressionStatement(statement)) return "top-level expression statement";
      if (ts.isIfStatement(statement)) return "top-level if statement";
      if (ts.isTryStatement(statement)) return "top-level try/catch statement";
      if (ts.isForStatement(statement) || ts.isForInStatement(statement) || ts.isForOfStatement(statement)) {
        return "top-level loop";
      }
      if (ts.isWhileStatement(statement) || ts.isDoStatement(statement)) return "top-level loop";
      if (ts.isThrowStatement(statement) || ts.isReturnStatement(statement)) return "top-level control flow";
      if (ts.isVariableStatement(statement) && /process\.argv|process\.exit|console\.|spawnSync\(|execFileSync\(|readFileSync\(0/.test(text)) {
        return "top-level runtime-dependent variable initializer";
      }
      return null;
    }

    const missingExportMain = registry.procedures
      .map((procedure) => {
        const path = procedurePath(procedure.entry);
        const source = readFileSync(path, "utf-8");
        const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        return {
          id: procedure.id,
          path,
          sourceFile,
        };
      })
      .filter(({ sourceFile }) => !exportsMain(sourceFile))
      .map(({ id, path }) => `${id}: ${relative(repoRoot, path)}`);

    assert.deepEqual(
      missingExportMain,
      [],
      "registered Procedure entries must export main(); import-only helper modules should stay unregistered",
    );

    const invalidMainContracts = registry.procedures
      .map((procedure) => {
        const path = procedurePath(procedure.entry);
        const source = readFileSync(path, "utf-8");
        const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        return {
          id: procedure.id,
          path,
          problem: mainFunctionProblem(sourceFile),
        };
      })
      .filter((item) => item.problem !== null)
      .map(({ id, path, problem }) => `${id}: ${relative(repoRoot, path)} (${problem})`);

    assert.deepEqual(
      invalidMainContracts,
      [],
      "registered Procedure main(argv) must accept runtime-provided args and must not read process.argv directly",
    );

    const topLevelExecution = registry.procedures.flatMap((procedure) => {
      const path = procedurePath(procedure.entry);
      const source = readFileSync(path, "utf-8");
      const sourceFile = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
      return sourceFile.statements
        .map((statement) => topLevelExecutionReason(source, statement))
        .filter((reason): reason is string => reason !== null)
        .map((reason) => `${procedure.id}: ${relative(repoRoot, path)} (${reason})`);
    });

    assert.deepEqual(
      topLevelExecution,
      [],
      "registered Procedure modules must not execute logic at import time; put runtime work inside exported main()",
    );

    const sourceSideTestProcedures = registry.procedures
      .map((procedure) => {
        const path = procedurePath(procedure.entry);
        const source = readFileSync(path, "utf-8");
        return {
          id: procedure.id,
          path,
          source,
        };
      })
      .filter(({ path, source }) =>
        /\.test\.ts$/.test(path) ||
        /(?:^|\n)\s*\/\/\s*Smoke tests for\b/.test(source) ||
        /\bfrom\s+["']node:test["']/.test(source)
      )
      .map(({ id, path }) => `${id}: ${relative(repoRoot, path)}`);

    assert.deepEqual(
      sourceSideTestProcedures,
      [],
      "source-side smoke tests and test modules should stay out of the runtime Procedure manifest",
    );
  });

  test("procedure sources do not contain source-side test modules", () => {
    const sourceSideTestModules = collectFiles(
      join(repoRoot, "src/components/procedures/sources"),
      (file) => file.endsWith(".ts"),
    ).filter((file) => {
      const source = readFileSync(file, "utf-8");
      return /\.test\.ts$/.test(file) || /\bfrom\s+["']node:test["']/.test(source);
    }).map((file) => relative(repoRoot, file));

    assert.deepEqual(
      sourceSideTestModules,
      [],
      "procedure source tests should live under tests/ so they run with the project test suite",
    );
  });

  test("procedure runtime fixtures use argv passthrough directly", () => {
    const deprecatedTokens = [
      ["--request", "json"].join("-"),
      ["request", "Payload"].join(""),
    ];
    const checkedFiles = [
      ...collectFiles(join(repoRoot, "src"), (file) => file.endsWith(".ts")),
      ...collectFiles(join(repoRoot, "tests"), (file) => file.endsWith(".ts")),
    ].filter((file) => basename(file) !== "source-conventions.unit.test.ts");
    const offenders = checkedFiles.flatMap((file) => {
      const source = readFileSync(file, "utf-8");
      return deprecatedTokens
        .filter((token) => source.includes(token))
        .map((token) => `${relative(repoRoot, file)}: ${token}`);
    });

    assert.deepEqual(
      offenders,
      [],
      "procedure runtime and tests should pass argv args directly, not deprecated request JSON wrappers",
    );
  });

  test("procedure source modules are registered entries or imported helpers", () => {
    function procedurePath(entry: URL | string): string {
      return entry instanceof URL ? fileURLToPath(entry) : entry;
    }

    function resolveRelativeProcedureImport(fromFile: string, specifier: string): string | null {
      const base = resolve(dirname(fromFile), specifier);
      const candidates = [
        base,
        `${base}.ts`,
        join(base, "index.ts"),
      ];
      return candidates.find((candidate) => existsSync(candidate)) ?? null;
    }

    const procedureSourceRoot = join(repoRoot, "src/components/procedures/sources");
    const procedureSources = collectFiles(
      procedureSourceRoot,
      (file) => file.endsWith(".ts") && !file.endsWith(".d.ts"),
    );
    const registeredEntries = new Set(registry.procedures.map((procedure) => procedurePath(procedure.entry)));
    const importedHelpers = new Set<string>();

    for (const sourceFile of procedureSources) {
      const source = readFileSync(sourceFile, "utf-8");
      for (const match of source.matchAll(
        /\bfrom\s+["'](\.[^"']+)["']|\bimport\s*\(\s*["'](\.[^"']+)["']\s*\)/g,
      )) {
        const specifier = match[1] ?? match[2];
        if (!specifier) continue;
        const resolved = resolveRelativeProcedureImport(sourceFile, specifier);
        if (resolved?.startsWith(procedureSourceRoot)) {
          importedHelpers.add(resolved);
        }
      }
    }

    const orphanedProcedureSources = procedureSources
      .filter((sourceFile) => !registeredEntries.has(sourceFile) && !importedHelpers.has(sourceFile))
      .map((sourceFile) => relative(repoRoot, sourceFile));

    assert.deepEqual(
      orphanedProcedureSources,
      [],
      "procedure source modules should either be registered runtime entries or imported helper modules",
    );
  });

  test("procedure sources do not call sibling mjs helper files", () => {
    const physicalMjsHelperCalls = collectFiles(
      join(repoRoot, "src/components/procedures/sources"),
      (file) => file.endsWith(".ts") && !file.endsWith(".test.ts"),
    ).filter((file) => {
      const source = readFileSync(file, "utf-8");
      return /join\([^\n]*(?:scriptDir|SCRIPT_DIR|__dirname)[^\n]*\.mjs/.test(source) ||
        /spawnSync\((?:process\.execPath|"node"),\s*\[[^\]]*\.mjs/.test(source) ||
        /process\.execPath,\s*\[[^\]]*\.mjs/.test(source);
    });

    assert.deepEqual(
      physicalMjsHelperCalls,
      [],
      "bundled procedure sources should import helper modules directly instead of spawning adjacent .mjs files",
    );
  });

  test("procedure sources do not suggest removed local script entrypoints", () => {
    const staleScriptSuggestions = collectFiles(
      join(repoRoot, "src/components/procedures/sources"),
      (file) => file.endsWith(".ts") && !file.endsWith(".test.ts"),
    ).flatMap((file) => {
      const source = readFileSync(file, "utf-8");
      return [...source.matchAll(/\bRun node scripts\/[A-Za-z0-9._/-]+\.mjs\b/g)].map((match) =>
        `${relative(repoRoot, file)}: ${match[0]}`
      );
    });

    assert.deepEqual(
      staleScriptSuggestions,
      [],
      "procedure sources should tell users to run a procedure id, not a removed repository-local script",
    );
  });

});
