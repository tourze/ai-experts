import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { test } from "vitest";
import { defaultReferenceTarget, toAbsolutePath } from "../../src/build/core.ts";
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
import {
  assertHookGroupTimeoutsMatchManifest,
  assertInstallManifestEntriesExist,
  buildComponents,
  collectMarkdownAnchors,
  collectMermaidCodeBlocks,
  collectSymlinks,
  countMarkdownTablePipes,
  decodeMarkdownAnchor,
  escapeRegExp,
  findRuntimeCommandsMissingPassthroughSeparator,
  getTmpDistDir,
  componentBuildSetupTimeoutMs,
  isLikelyLocalDefinitionPath,
  isMarkdownTableSeparator,
  normalizeMarkdownReferenceLabel,
  parseGeneratedToml,
  parseMarkdownFrontmatter,
  referenceDirectoryIndexTarget,
} from "./component-build.test-context";

export function registerComponentBuildGeneratedContentTests(): void {
  test("generated runtime materials use direct procedure arguments", () => {
    const bareProcedureSeparators: string[] = [];
    const legacyRequestProtocolMentions: string[] = [];
    const legacyRequestFlag = ["--request", "json"].join("-");
    const legacyRequestSchema = ["CliProcedure", "Request"].join("");
    const legacyRequestPayload = ["request", "Payload"].join("");
    const textFilePattern = /\.(?:css|html|js|json|md|mjs|toml|ts|tsx|txt|ya?ml)$/u;

    for (const platform of ["claude", "codex"]) {
      const platformRoot = join(getTmpDistDir(), platform);
      for (const generatedFile of collectFiles(platformRoot, (file) => textFilePattern.test(file))) {
        const source = readFileSync(generatedFile, "utf-8");
        const generatedPath = relative(platformRoot, generatedFile).split("\\").join("/");
        if (
          source.includes(legacyRequestSchema) ||
          source.includes(legacyRequestPayload) ||
          source.includes(legacyRequestFlag)
        ) {
          legacyRequestProtocolMentions.push(`${platform}/${generatedPath}`);
        }
        source.split(/\r?\n/u).forEach((line, index) => {
          if (
            /node ~\/\.(?:claude|codex)\/procedures\.js\b.*\s--(?:$|[`"')\];,。])/u.test(line.trim())
          ) {
            bareProcedureSeparators.push(`${platform}/${generatedPath}:${index + 1}`);
          }
        });
      }
    }

    assert.deepEqual(
      bareProcedureSeparators,
      [],
      "generated runtime procedure commands should not end with a bare -- separator",
    );
    assert.deepEqual(
      legacyRequestProtocolMentions,
      [],
      "generated runtime materials should not expose removed legacy request protocol",
    );
  });

  test("generated Chinese runtime prose does not split 时使用 from Chinese text", () => {
    const textFilePattern = /\.(?:css|html|js|json|md|mjs|toml|ts|tsx|txt|ya?ml)$/u;
    const spacingIssues: string[] = [];

    for (const platform of ["claude", "codex"]) {
      const platformRoot = join(getTmpDistDir(), platform);
      for (const generatedFile of collectFiles(platformRoot, (file) => textFilePattern.test(file))) {
        const source = readFileSync(generatedFile, "utf-8");
        source.split(/\r?\n/u).forEach((line, index) => {
          if (/\p{Script=Han}\s+时使用/u.test(line)) {
            const generatedPath = relative(platformRoot, generatedFile).split("\\").join("/");
            spacingIssues.push(`${platform}/${generatedPath}:${index + 1}`);
          }
        });
      }
    }

    assert.deepEqual(spacingIssues, [], "generated runtime prose should not contain `中文 时使用` spacing");
  });

  test("generated incident response prose names observability gaps explicitly", () => {
    const stalePhrases: string[] = [];
    const textFilePattern = /\.(?:md|toml|ya?ml)$/u;

    for (const platform of ["claude", "codex"]) {
      const platformRoot = join(getTmpDistDir(), platform);
      for (const generatedFile of collectFiles(platformRoot, (file) => textFilePattern.test(file))) {
        const source = readFileSync(generatedFile, "utf-8");
        if (source.includes("待补观测")) {
          stalePhrases.push(`${platform}/${relative(platformRoot, generatedFile).split("\\").join("/")}`);
        }
      }
    }

    assert.deepEqual(stalePhrases, [], "generated incident response prose should say 观测缺口, not 待补观测");
  });

  test("generated runtime files do not leak maintainer-local absolute paths", () => {
    const localPathPattern = /(?:^|[\s"'`(])(?:file:\/\/)?(?:\/Users\/[^\s"'`)]+|\/home\/[^\s"'`)]+|\/private\/var\/[^\s"'`)]+|\/var\/folders\/[^\s"'`)]+|[A-Za-z]:\\Users\\[^\s"'`)]+)/u;
    const textFilePattern = /\.(?:css|html|js|json|md|mjs|toml|ts|tsx|txt|ya?ml)$/u;
    const leakedPaths: string[] = [];

    for (const platform of ["claude", "codex"]) {
      const platformRoot = join(getTmpDistDir(), platform);
      for (const generatedFile of collectFiles(platformRoot, (file) => textFilePattern.test(file))) {
        const source = readFileSync(generatedFile, "utf-8");
        const match = localPathPattern.exec(source);
        if (match) {
          leakedPaths.push(`${platform}/${relative(platformRoot, generatedFile).split("\\").join("/")}: ${match[0].trim()}`);
        }
      }
    }

    assert.deepEqual(leakedPaths, [], "generated runtime files should not leak maintainer-local absolute paths");
  });

  test("generated text files end with a final newline", () => {
    const textFilePattern = /\.(?:css|html|js|json|md|mjs|toml|ts|tsx|txt|ya?ml)$/u;
    const missingFinalNewline: string[] = [];

    for (const platform of ["claude", "codex"]) {
      const platformRoot = join(getTmpDistDir(), platform);
      for (const generatedFile of collectFiles(platformRoot, (file) => textFilePattern.test(file))) {
        const source = readFileSync(generatedFile, "utf-8");
        if (!source.endsWith("\n")) {
          missingFinalNewline.push(`${platform}/${relative(platformRoot, generatedFile).split("\\").join("/")}`);
        }
      }
    }

    assert.deepEqual(missingFinalNewline, [], "generated text files should end with a final newline");
  });

  test("generated Markdown code fences are closed", () => {
    const unclosedFences: string[] = [];
    const findUnclosedFence = (source: string): { marker: string; length: number; line: number } | null => {
      let open: { marker: string; length: number; line: number } | null = null;
      const lines = source.split(/\r?\n/u);
      for (let index = 0; index < lines.length; index += 1) {
        const match = lines[index]?.match(/^( {0,3})(`{3,}|~{3,})/u);
        if (!match?.[2]) continue;
        const marker = match[2][0] ?? "";
        const length = match[2].length;
        if (!open) {
          open = { marker, length, line: index + 1 };
        } else if (marker === open.marker && length >= open.length) {
          open = null;
        }
      }
      return open;
    };

    for (const platform of ["claude", "codex"]) {
      const platformRoot = join(getTmpDistDir(), platform);
      for (const markdownFile of collectFiles(platformRoot, (file) => file.endsWith(".md"))) {
        const open = findUnclosedFence(readFileSync(markdownFile, "utf-8"));
        if (open) {
          unclosedFences.push(
            `${platform}/${relative(platformRoot, markdownFile).split("\\").join("/")}: opened ${open.marker.repeat(open.length)} at line ${open.line}`,
          );
        }
      }
    }

    assert.deepEqual(unclosedFences, [], "generated Markdown should not contain unclosed code fences");
  });

  test("generated Markdown table rows keep consistent column counts", () => {
    const tableIssues: string[] = [];

    for (const platform of ["claude", "codex"]) {
      const platformRoot = join(getTmpDistDir(), platform);
      for (const markdownFile of collectFiles(platformRoot, (file) => file.endsWith(".md"))) {
        const label = `${platform}/${relative(platformRoot, markdownFile).split("\\").join("/")}`;
        const lines = readFileSync(markdownFile, "utf-8").split(/\r?\n/u);
        let inFence = false;

        for (let index = 0; index < lines.length; index += 1) {
          const line = lines[index] ?? "";
          if (/^\s*(?:```|~~~)/u.test(line)) {
            inFence = !inFence;
            continue;
          }
          if (inFence || !isMarkdownTableSeparator(line)) continue;

          const expectedPipes = countMarkdownTablePipes(line);
          const checkLine = (lineIndex: number): void => {
            const actualPipes = countMarkdownTablePipes(lines[lineIndex] ?? "");
            if (actualPipes !== expectedPipes) {
              tableIssues.push(
                `${label}:${lineIndex + 1}: expected ${expectedPipes} table pipes, got ${actualPipes}`,
              );
            }
          };

          for (let lineIndex = index - 1; lineIndex >= 0; lineIndex -= 1) {
            const candidate = lines[lineIndex] ?? "";
            if (!candidate.includes("|") || candidate.trim() === "") break;
            checkLine(lineIndex);
          }
          for (let lineIndex = index + 1; lineIndex < lines.length; lineIndex += 1) {
            const candidate = lines[lineIndex] ?? "";
            if (!candidate.includes("|") || candidate.trim() === "") break;
            checkLine(lineIndex);
          }
        }
      }
    }

    assert.deepEqual(tableIssues, [], "generated Markdown tables should keep a stable column count");
  });

  test("generated Markdown Mermaid code blocks parse", async () => {
    const failures: string[] = [];

    for (const platform of ["claude", "codex"]) {
      const platformRoot = join(getTmpDistDir(), platform);
      for (const markdownFile of collectFiles(platformRoot, (file) => file.endsWith(".md"))) {
        const label = `${platform}/${relative(platformRoot, markdownFile).split("\\").join("/")}`;
        const markdown = readFileSync(markdownFile, "utf-8");
        const mermaidBlocks = collectMermaidCodeBlocks(markdown);

        for (const [index, diagram] of mermaidBlocks.entries()) {
          try {
            await validateMermaidSyntax(`${label}#${index + 1}`, diagram);
          } catch (error) {
            failures.push(error instanceof Error ? error.message : String(error));
          }
        }
      }
    }

    assert.deepEqual(failures, [], "generated Markdown Mermaid code blocks should parse");
  });

  test("emits reproducible manifests and procedure bundles", () => {
    const secondDistDir = mkdtempSync(join(tmpdir(), "ai-experts-repro-b-"));
    try {
      buildComponents(secondDistDir);
      for (const platform of ["claude", "codex"]) {
        assert.equal(
          readFileSync(join(getTmpDistDir(), platform, "procedures.js"), "utf-8"),
          readFileSync(join(secondDistDir, platform, "procedures.js"), "utf-8"),
          `${platform} procedure bundle should be reproducible`,
        );
        assert.equal(
          readFileSync(join(getTmpDistDir(), platform, "manifest.json"), "utf-8"),
          readFileSync(join(secondDistDir, platform, "manifest.json"), "utf-8"),
          `${platform} manifest should be reproducible`,
        );
      }
    } finally {
      rmSync(secondDistDir, { recursive: true, force: true });
    }
  }, componentBuildSetupTimeoutMs);

  test("emits parseable codex TOML configs", () => {
    const codexManifest = JSON.parse(readFileSync(join(getTmpDistDir(), "codex/manifest.json"), "utf-8"));
    const codexConfig = parseGeneratedToml(
      readFileSync(join(getTmpDistDir(), "codex/config.toml"), "utf-8"),
      "codex/config.toml",
    );
    assert.equal(codexConfig.sections.features.codex_hooks, true);
    assert.equal(codexConfig.sections.agents.max_depth, 1);

    const agentFiles = collectFiles(join(getTmpDistDir(), "codex/agents"), (file) => file.endsWith(".toml"));
    assert.deepEqual(
      agentFiles.map((file) => basename(file, ".toml")).sort(),
      [...codexManifest.agents].sort(),
      "Codex manifest agents should exactly match generated TOML files",
    );

    const allowedTopLevelKeys = new Set([
      "name",
      "description",
      "model",
      "model_reasoning_effort",
      "sandbox_mode",
      "developer_instructions",
    ]);
    for (const agentFile of agentFiles) {
      const label = agentFile.slice(getTmpDistDir().length + 1);
      const parsed = parseGeneratedToml(readFileSync(agentFile, "utf-8"), label);
      const agentId = basename(agentFile, ".toml");
      assert.equal(parsed.root.name, agentId, `${label} name should match filename`);
      assert.equal(typeof parsed.root.description, "string", `${label} description should be a string`);
      assert.equal(typeof parsed.root.developer_instructions, "string", `${label} instructions should be a string`);
      const developerInstructions = String(parsed.root.developer_instructions);
      assert.match(developerInstructions, /## /, `${label} instructions should include sections`);
      assert.deepEqual(Object.keys(parsed.sections), [], `${label} should not emit unexpected TOML sections`);
      for (const key of Object.keys(parsed.root)) {
        assert.equal(allowedTopLevelKeys.has(key), true, `${label} should not emit unsupported top-level key ${key}`);
      }

      const arrayKeys = Object.keys(parsed.arrays).sort();
      const skillConfigs = parsed.arrays["skills.config"] ?? [];
      assert.deepEqual(
        arrayKeys,
        arrayKeys.length === 0 ? [] : ["skills.config"],
        `${label} should only emit skills.config arrays`,
      );
      if (skillConfigs.length === 0) {
        assert.doesNotMatch(
          developerInstructions,
          /## 技能编排|当列出的 skill 与任务相关时/,
          `${label} should not describe skill routing without configured skills`,
        );
      } else {
        assert.match(developerInstructions, /## 技能编排/, `${label} should describe configured skill routing`);
        assert.match(
          developerInstructions,
          /当列出的 skill 与任务相关时，必须显式按该 skill 的工作流执行。/,
          `${label} should render localized skill routing guidance`,
        );
        assert.doesNotMatch(
          developerInstructions,
          /When a listed skill is relevant/,
          `${label} should not render English fallback skill routing guidance`,
        );
      }
      const seenSkillConfigPaths = new Set<string>();
      for (const skillConfig of skillConfigs) {
        assert.deepEqual(Object.keys(skillConfig).sort(), ["enabled", "path"], `${label} skill config shape`);
        assert.equal(skillConfig.enabled, true, `${label} skill config should be enabled`);
        assert.equal(typeof skillConfig.path, "string", `${label} skill path should be a string`);
        const skillPath = String(skillConfig.path);
        assert.equal(
          seenSkillConfigPaths.has(skillPath),
          false,
          `${label} should not duplicate skill config path ${skillPath}`,
        );
        seenSkillConfigPaths.add(skillPath);
        const pathMatch = skillPath.match(/^~\/\.agents\/skills\/([a-z0-9-]+)\/SKILL\.md$/);
        assert.ok(pathMatch, `${label} skill path should use the Codex user skill root`);
        assert.equal(
          existsSync(join(getTmpDistDir(), "codex/skills", pathMatch[1], "SKILL.md")),
          true,
          `${label} should reference an emitted Codex skill`,
        );
      }
      for (const skill of registry.skills.filter((skill) => !skill.platforms.includes(Platform.Codex))) {
        assert.doesNotMatch(
          developerInstructions,
          new RegExp(`(?:^|\\n)- ${skill.id} \\(`),
          `${label} should not route unavailable Codex skill ${skill.id}`,
        );
      }
    }
  });

  test("Codex dist does not include Anthropic-only skill materials", () => {
    assert.equal(existsSync(join(getTmpDistDir(), "codex/skills/pdf/SKILL.md")), false);
    const restrictedCodexFiles = collectFiles(join(getTmpDistDir(), "codex/skills"), (file) => {
      if (!/\.(?:md|txt|ya?ml|json|toml)$/u.test(file)) return false;
      return /Anthropic[\s\S]+ADDITIONAL RESTRICTIONS[\s\S]+Extract these materials from the Services/u.test(
        readFileSync(file, "utf-8"),
      );
    });

    assert.deepEqual(restrictedCodexFiles, [], "Codex dist should not include Anthropic-only skill materials");
  });

  test("Codex runtime-facing materials do not mention unavailable procedures", () => {
    const codexManifest = JSON.parse(readFileSync(join(getTmpDistDir(), "codex/manifest.json"), "utf-8"));
    const codexProcedureIds = new Set((codexManifest.procedures.items as any[]).map((procedure) => procedure.id));
    const unavailableProcedureIds = registry.procedures
      .map((procedure) => procedure.id)
      .filter((procedureId) => !codexProcedureIds.has(procedureId))
      .sort();
    if (unavailableProcedureIds.length === 0) return;
    const unavailableProcedurePattern = new RegExp(
      `\\b(?:${unavailableProcedureIds.map(escapeRegExp).join("|")})\\b`,
      "u",
    );
    const runtimeFacingFiles = [
      ...collectFiles(join(getTmpDistDir(), "codex/skills"), (file) =>
        /\.(?:css|html|js|json|md|mjs|toml|txt|ya?ml)$/u.test(file)
      ),
      ...collectFiles(join(getTmpDistDir(), "codex/agents"), (file) => /\.(?:md|toml|txt|ya?ml)$/u.test(file)),
    ];
    const leaks: string[] = [];

    for (const runtimeFile of runtimeFacingFiles) {
      const match = unavailableProcedurePattern.exec(readFileSync(runtimeFile, "utf-8"));
      if (match) {
        leaks.push(`${runtimeFile.slice(getTmpDistDir().length + 1)}:${match[0]}`);
      }
    }

    assert.deepEqual(leaks, [], "Codex generated runtime materials should not reference unavailable procedures");
  });

  test("emits Codex skill metadata for every generated skill", () => {
    const codexManifest = JSON.parse(readFileSync(join(getTmpDistDir(), "codex/manifest.json"), "utf-8"));
    const codexSkillDefinitions = new Map(
      registry.skills
        .filter((skill) => skill.platforms.includes(Platform.Codex))
        .map((skill) => [skill.id, skill]),
    );

    assert.deepEqual(
      [...codexManifest.skills].sort(),
      [...codexSkillDefinitions.keys()].sort(),
      "Codex manifest skills should exactly match Codex-enabled source skills",
    );

    for (const skillId of codexManifest.skills as string[]) {
      const skill = codexSkillDefinitions.get(skillId);
      assert.ok(skill, `${skillId} should have a source definition`);
      const metadataPath = join(getTmpDistDir(), "codex/skills", skillId, "agents/openai.yaml");
      assert.equal(existsSync(metadataPath), true, `${skillId} should emit agents/openai.yaml`);
      const metadata = readFileSync(metadataPath, "utf-8");
      const allowImplicit = skill.invocation !== InvocationPolicy.ExplicitOnly;
      const parsedMetadata = parseYaml(metadata);

      assert.deepEqual(
        parsedMetadata,
        {
          interface: {
            display_name: skill.fullName,
            short_description: compactCodexOpenAiShortDescription(skill.description),
          },
          policy: {
            allow_implicit_invocation: allowImplicit,
          },
        },
        `${skillId} should mirror its InvocationPolicy in openai.yaml`,
      );
      assert.ok(
        Array.from(parsedMetadata.interface.short_description).length <= 64,
        `${skillId} Codex openai.yaml short_description should stay UI-sized`,
      );
    }

    assert.deepEqual(
      collectFiles(join(getTmpDistDir(), "claude/skills"), (file) => file.endsWith("openai.yaml")),
      [],
      "Claude skill packages should not include Codex openai.yaml metadata",
    );

    for (const skillId of ["remote-ssh-command", "prlctl-vm-control"]) {
      const claudeSkill = readFileSync(join(getTmpDistDir(), "claude/skills", skillId, "SKILL.md"), "utf-8");
      const codexMetadata = readFileSync(
        join(getTmpDistDir(), "codex/skills", skillId, "agents/openai.yaml"),
        "utf-8",
      );
      assert.match(
        claudeSkill,
        /disable-model-invocation: true/,
        `${skillId} should not be model-invoked implicitly on Claude`,
      );
      assert.match(
        codexMetadata,
        /allow_implicit_invocation: false/,
        `${skillId} should not be model-invoked implicitly on Codex`,
      );
    }
  });

}
