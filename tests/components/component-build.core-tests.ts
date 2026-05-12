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
  codexSystemSkillIdSet,
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

export function registerComponentBuildCoreTests(): void {
  test("generated dist does not contain symbolic links", () => {
    const generatedSymlinks = collectSymlinks(getTmpDistDir()).map((path) => relative(getTmpDistDir(), path));
    assert.deepEqual(
      generatedSymlinks,
      [],
      "generated dist should contain concrete files/directories only and must not include symlinks",
    );
  });

  test("emits claude/codex manifests and core component counts", () => {
    const claudeManifest = JSON.parse(readFileSync(join(getTmpDistDir(), "claude/manifest.json"), "utf-8"));
    const codexManifest = JSON.parse(readFileSync(join(getTmpDistDir(), "codex/manifest.json"), "utf-8"));

    assert.equal(
      claudeManifest.schema,
      6,
      "Claude manifest schema should version the install contract",
    );
    assert.equal(
      codexManifest.schema,
      6,
      "Codex manifest schema should version the install contract",
    );
    assert.equal(
      claudeManifest.skills.length,
      registry.skills.filter((skill) => skill.platforms.includes(Platform.Claude)).length,
    );
    assert.equal(
      codexManifest.skills.length,
      registry.skills.filter((skill) => skill.platforms.includes(Platform.Codex)).length,
    );
    assert.deepEqual(
      (codexManifest.skills as string[]).filter((skillId) => codexSystemSkillIdSet.has(skillId)),
      [],
      "Codex user skill dist should not emit skills that collide with Codex system skill names",
    );
    assert.equal(
      (claudeManifest.skills as string[]).includes("skill-creator"),
      true,
      "Claude should keep the custom skill creator skill",
    );
    assert.equal(claudeManifest.instructions.length, 6);
    assert.equal(codexManifest.instructions.length, 6);
    assert.equal(claudeManifest.agents.length, 80);
    assert.equal(codexManifest.agents.length, 80);
    assert.equal(claudeManifest.hooks.length, 99);
    assert.equal(codexManifest.hooks.length, 98);
    assert.equal(
      claudeManifest.rules.length,
      registry.rules.filter((rule) => rule.platforms.includes(Platform.Claude)).length,
    );
    assert.equal(
      codexManifest.rules.length,
      registry.rules.filter((rule) => rule.platforms.includes(Platform.Codex)).length,
    );
    assert.equal(Object.hasOwn(claudeManifest, "profile"), false);
    assert.equal(Object.hasOwn(codexManifest, "profile"), false);
    assert.equal(existsSync(join(getTmpDistDir(), "claude/rules")), true);
    assert.equal(existsSync(join(getTmpDistDir(), "codex/context-rules")), true);
    assert.equal(existsSync(join(getTmpDistDir(), "codex/rules")), false);
    assert.equal(
      existsSync(join(getTmpDistDir(), "codex/installation_id")),
      false,
      "Codex runtime installation state should not be generated into dist",
    );
    assert.equal(
      existsSync(join(getTmpDistDir(), "codex/skills/.system")),
      false,
      "Codex system skill cache should stay runtime-local, not generated into dist",
    );

    assert.equal(claudeManifest.install.configRoot, "~/.claude");
    assert.equal(claudeManifest.install.skillSourceRoot, "skills/");
    assert.equal(claudeManifest.install.skillRoot, "~/.claude/skills");
    assert.equal(claudeManifest.install.rootEntries.includes("rules/"), true);
    assert.equal(claudeManifest.install.skillEntries.length, claudeManifest.skills.length);
    assert.deepEqual(
      claudeManifest.install.skillEntries,
      (claudeManifest.skills as string[]).map((skillId) => `${skillId}/`),
      "Claude install manifest should map target-relative skill directories",
    );
    assert.deepEqual(claudeManifest.install.forbiddenRootEntries, []);
    assert.deepEqual(claudeManifest.install.forbiddenSkillEntries, []);
    assert.equal(codexManifest.install.configRoot, "~/.codex");
    assert.equal(codexManifest.install.skillSourceRoot, "skills/");
    assert.equal(codexManifest.install.skillRoot, "~/.agents/skills");
    assert.equal(codexManifest.install.skillEntries.length, codexManifest.skills.length);
    assert.equal(codexManifest.install.rootEntries.includes("skills/"), false);
    assert.equal(codexManifest.install.rootEntries.includes("rules/"), false);
    assert.equal(codexManifest.install.rootEntries.includes("context-rules/"), true);
    assert.equal(codexManifest.install.rootEntries.includes("AGENTS.md"), true);
    assert.equal(codexManifest.install.rootEntries.includes("config.toml"), true);
    assert.equal(codexManifest.install.rootEntries.includes("procedures.js"), true);
    assert.deepEqual(codexManifest.install.forbiddenRootEntries, ["skills/", "installation_id", "rules/"]);
    assert.deepEqual(codexManifest.install.forbiddenSkillEntries, [".system/"]);
    assert.deepEqual(
      codexManifest.install.skillEntries,
      (codexManifest.skills as string[]).map((skillId) => `${skillId}/`),
      "Codex install manifest should map target-relative skill directories to ~/.agents/skills",
    );

    assertInstallManifestEntriesExist(join(getTmpDistDir(), "claude"), claudeManifest, "Claude");
    assertInstallManifestEntriesExist(join(getTmpDistDir(), "codex"), codexManifest, "Codex");
  });

  test("emits context rules without occupying Codex rules policy directory", () => {
    const claudeRuleFiles = collectFiles(join(getTmpDistDir(), "claude/rules"), (file) => file.endsWith(".md"));
    const codexRuleFiles = collectFiles(
      join(getTmpDistDir(), "codex/context-rules"),
      (file) => file.endsWith(".md") && basename(file) !== "index.md",
    );
    const codexRuleIndex = readFileSync(join(getTmpDistDir(), "codex/context-rules/index.md"), "utf-8");

    assert.equal(claudeRuleFiles.length, registry.rules.filter((rule) => rule.platforms.includes(Platform.Claude)).length);
    assert.equal(codexRuleFiles.length, registry.rules.filter((rule) => rule.platforms.includes(Platform.Codex)).length);
    assert.equal(existsSync(join(getTmpDistDir(), "codex/rules")), false);

    for (const ruleFile of [...claudeRuleFiles, ...codexRuleFiles]) {
      const frontmatter = parseMarkdownFrontmatter(ruleFile);
      assert.equal(typeof frontmatter.description, "string", `${relative(getTmpDistDir(), ruleFile)} should describe the rule`);
      assert.equal(Array.isArray(frontmatter.paths), true, `${relative(getTmpDistDir(), ruleFile)} should include path globs`);
      assert.equal(frontmatter.paths.length > 0, true, `${relative(getTmpDistDir(), ruleFile)} should include at least one path glob`);
      assert.match(readFileSync(ruleFile, "utf-8"), /^# .+/mu);
    }

    for (const rule of registry.rules.filter((item) => item.platforms.includes(Platform.Codex))) {
      assert.match(codexRuleIndex, new RegExp(`\\[${escapeRegExp(rule.id)}\\]\\(${escapeRegExp(rule.id)}\\.md\\)`));
    }
  });

  test("emits shared Mermaid workflows for every generated skill and agent", () => {
    const generatedDocuments = [
      ...collectFiles(join(getTmpDistDir(), "claude/skills"), (file) => file.endsWith("SKILL.md")),
      ...collectFiles(join(getTmpDistDir(), "codex/skills"), (file) => file.endsWith("SKILL.md")),
      ...collectFiles(join(getTmpDistDir(), "claude/agents"), (file) => file.endsWith(".md")),
      ...collectFiles(join(getTmpDistDir(), "codex/agents"), (file) => file.endsWith(".toml")),
    ];
    const missingWorkflow: string[] = [];
    const malformedWorkflow: string[] = [];
    const legacyExecutionStepHeadings: string[] = [];

    for (const documentPath of generatedDocuments) {
      const label = relative(getTmpDistDir(), documentPath);
      const source = readFileSync(documentPath, "utf-8");
      const workflowIndex = source.indexOf("## 工作流");
      if (workflowIndex === -1) {
        missingWorkflow.push(label);
      } else if (!/## 工作流\n\n```mermaid\nflowchart (?:TD|TB|BT|RL|LR)\n/u.test(source.slice(workflowIndex))) {
        malformedWorkflow.push(label);
      }
      if (/## 执行步骤/u.test(source)) {
        legacyExecutionStepHeadings.push(label);
      }
    }

    assert.deepEqual(
      missingWorkflow,
      [],
      "generated skills and agents should all expose the shared workflow section",
    );
    assert.deepEqual(
      malformedWorkflow,
      [],
      "generated workflow sections should all render through the shared Mermaid flowchart renderer",
    );
    assert.deepEqual(
      legacyExecutionStepHeadings,
      [],
      "generated skills and agents should not emit legacy execution-step headings",
    );
  });

  test("generated dist outputs do not reference legacy plugin-root paths", () => {
    const legacyPluginRootMentions: string[] = [];
    const generatedTextFiles = collectFiles(
      getTmpDistDir(),
      (file) => /\.(?:md|toml|json|mjs|js|ya?ml|txt)$/u.test(file),
    );
    const legacyPattern =
      /~\/\.claude\/plugins\b|~\/\.codex\/plugins\b|~\/\.codex\/skills\b|\bisLegacyPluginsRoot\b|\blegacyPluginsRoot\b/u;

    for (const generatedFile of generatedTextFiles) {
      const source = readFileSync(generatedFile, "utf-8");
      const match = source.match(legacyPattern);
      if (match) {
        legacyPluginRootMentions.push(`${relative(getTmpDistDir(), generatedFile)}: ${match[0]}`);
      }
    }

    assert.deepEqual(
      legacyPluginRootMentions,
      [],
      "generated dist text outputs should only reference canonical configRoot/skillRoot paths and must not mention legacy plugin roots or ~/.codex/skills",
    );
  });

  test("generated supplemental READMEs do not advertise external skill installation", () => {
    const generatedReadmes = collectFiles(
      getTmpDistDir(),
      (file) => basename(file) === "README.md" && file.split(/[\\/]/).includes("skills"),
    );
    const offenders: string[] = [];

    for (const readmeFile of generatedReadmes) {
      const source = readFileSync(readmeFile, "utf-8");
      if (
        /npx\s+skills\s+add|google-labs-code\/stitch-skills|--skill\s+\S+\s+--global|dist\/(?:claude|codex)\/skills|src\/components\/skills|agents\/openai\.yaml|`(?:rust-best-practices|typescript-magician)`/u.test(
          source,
        )
      ) {
        offenders.push(relative(getTmpDistDir(), readmeFile));
      }
    }

    assert.deepEqual(
      offenders,
      [],
      "generated supplemental README files should describe this harness package without external install commands or platform-specific generated files",
    );
  });

  test("generated dist keeps platform-specific skill root references isolated", () => {
    const textFileMatcher = (file: string): boolean => /\.(?:md|toml|json|mjs|js|ya?ml|txt)$/u.test(file);
    const claudeFiles = collectFiles(join(getTmpDistDir(), "claude"), textFileMatcher);
    const codexFiles = collectFiles(join(getTmpDistDir(), "codex"), textFileMatcher);

    const claudeCrossPlatformMentions: string[] = [];
    const codexCrossPlatformMentions: string[] = [];
    let claudeCanonicalMentions = 0;
    let codexCanonicalMentions = 0;

    for (const file of claudeFiles) {
      const source = readFileSync(file, "utf-8");
      if (/~\/\.agents\/skills\b/u.test(source)) {
        claudeCrossPlatformMentions.push(relative(getTmpDistDir(), file));
      }
      claudeCanonicalMentions += (source.match(/~\/\.claude\/skills\b/gu) ?? []).length;
    }

    for (const file of codexFiles) {
      const source = readFileSync(file, "utf-8");
      if (/~\/\.claude\/skills\b/u.test(source)) {
        codexCrossPlatformMentions.push(relative(getTmpDistDir(), file));
      }
      codexCanonicalMentions += (source.match(/~\/\.agents\/skills\b/gu) ?? []).length;
    }

    assert.deepEqual(
      claudeCrossPlatformMentions,
      [],
      "claude dist should not reference Codex skill root ~/.agents/skills",
    );
    assert.deepEqual(
      codexCrossPlatformMentions,
      [],
      "codex dist should not reference Claude skill root ~/.claude/skills",
    );
    assert.equal(
      claudeCanonicalMentions > 0,
      true,
      "claude dist should keep canonical ~/.claude/skills references",
    );
    assert.equal(
      codexCanonicalMentions > 0,
      true,
      "codex dist should keep canonical ~/.agents/skills references",
    );
  });

  test("generated dist keeps platform-specific procedure runtime paths isolated", () => {
    const textFileMatcher = (file: string): boolean => /\.(?:md|toml|json|mjs|js|ya?ml|txt)$/u.test(file);
    const claudeFiles = collectFiles(join(getTmpDistDir(), "claude"), textFileMatcher);
    const codexFiles = collectFiles(join(getTmpDistDir(), "codex"), textFileMatcher);

    const claudeCrossPlatformMentions: string[] = [];
    const codexCrossPlatformMentions: string[] = [];
    const unresolvedPlaceholders: string[] = [];
    let claudeCanonicalMentions = 0;
    let codexCanonicalMentions = 0;

    for (const file of claudeFiles) {
      const source = readFileSync(file, "utf-8");
      if (/~\/\.codex\/procedures\.js\b/u.test(source)) {
        claudeCrossPlatformMentions.push(relative(getTmpDistDir(), file));
      }
      if (/<runtime-root>|<skills-dir>/u.test(source)) {
        unresolvedPlaceholders.push(relative(getTmpDistDir(), file));
      }
      claudeCanonicalMentions += (source.match(/~\/\.claude\/procedures\.js\b/gu) ?? []).length;
    }

    for (const file of codexFiles) {
      const source = readFileSync(file, "utf-8");
      if (/~\/\.claude\/procedures\.js\b/u.test(source)) {
        codexCrossPlatformMentions.push(relative(getTmpDistDir(), file));
      }
      if (/<runtime-root>|<skills-dir>/u.test(source)) {
        unresolvedPlaceholders.push(relative(getTmpDistDir(), file));
      }
      codexCanonicalMentions += (source.match(/~\/\.codex\/procedures\.js\b/gu) ?? []).length;
    }

    assert.deepEqual(
      unresolvedPlaceholders,
      [],
      "generated dist should not retain runtime placeholder paths",
    );
    assert.deepEqual(
      claudeCrossPlatformMentions,
      [],
      "claude dist should not reference Codex runtime path ~/.codex/procedures.js",
    );
    assert.deepEqual(
      codexCrossPlatformMentions,
      [],
      "codex dist should not reference Claude runtime path ~/.claude/procedures.js",
    );
    assert.equal(
      claudeCanonicalMentions > 0,
      true,
      "claude dist should keep canonical ~/.claude/procedures.js references",
    );
    assert.equal(
      codexCanonicalMentions > 0,
      true,
      "codex dist should keep canonical ~/.codex/procedures.js references",
    );
  });

  test("generated markdown frontmatter parses as YAML", () => {
    const markdownFiles = [
      ...collectFiles(join(getTmpDistDir(), "claude/skills"), (file) => file.endsWith("SKILL.md")),
      ...collectFiles(join(getTmpDistDir(), "codex/skills"), (file) => file.endsWith("SKILL.md")),
      ...collectFiles(join(getTmpDistDir(), "claude/agents"), (file) => file.endsWith(".md")),
    ];

    for (const markdownFile of markdownFiles) {
      const label = relative(getTmpDistDir(), markdownFile);
      const frontmatter = parseMarkdownFrontmatter(markdownFile);
      assert.equal(typeof frontmatter.name, "string", `${label} frontmatter should include name`);
      assert.equal(typeof frontmatter.description, "string", `${label} frontmatter should include description`);
      if (Object.hasOwn(frontmatter, "allowed-tools")) {
        assert.equal(Array.isArray(frontmatter["allowed-tools"]), true, `${label} allowed-tools should be a YAML list`);
      }
      if (Object.hasOwn(frontmatter, "skills")) {
        assert.equal(Array.isArray(frontmatter.skills), true, `${label} skills should be a YAML list`);
      }
    }
  });

  test("claude agent skill preload frontmatter only includes preloadable skills", () => {
    const disabledModelInvocationSkills = new Set<string>();
    for (const skillFile of collectFiles(join(getTmpDistDir(), "claude/skills"), (file) => basename(file) === "SKILL.md")) {
      const frontmatter = parseMarkdownFrontmatter(skillFile);
      if (frontmatter["disable-model-invocation"] === true) disabledModelInvocationSkills.add(frontmatter.name);
    }

    for (const agentFile of collectFiles(join(getTmpDistDir(), "claude/agents"), (file) => file.endsWith(".md"))) {
      const frontmatter = parseMarkdownFrontmatter(agentFile);
      for (const skillId of frontmatter.skills ?? []) {
        assert.equal(
          disabledModelInvocationSkills.has(skillId),
          false,
          `${relative(getTmpDistDir(), agentFile)} should not preload explicit-only skill ${skillId}`,
        );
      }
    }

    const typescriptReviewer = parseMarkdownFrontmatter(join(getTmpDistDir(), "claude/agents/typescript-reviewer.md"));
    assert.deepEqual(
      typescriptReviewer.skills,
      ["typescript-type-safety"],
      "Route-only skills should stay in agent body routing guidance, not Claude preload frontmatter",
    );
    assert.match(
      typescriptReviewer.tools,
      /(?:^|, )Skill(?:,|$)/,
      "Claude agents with route-only skills and explicit tools must keep the Skill tool available",
    );

    for (const agentFile of collectFiles(join(getTmpDistDir(), "claude/agents"), (file) => file.endsWith(".md"))) {
      const source = readFileSync(agentFile, "utf-8");
      const frontmatter = parseMarkdownFrontmatter(agentFile);
      const preloadedSkillIds = new Set(frontmatter.skills ?? []);
      const routedSkillIds = [
        ...source.matchAll(/- `([a-z0-9-]+)` \((?:route|reference)\):/gu),
      ].map((match) => match[1]);
      const hasExplicitTools = Object.hasOwn(frontmatter, "tools");
      const tools = typeof frontmatter.tools === "string"
        ? frontmatter.tools.split(/,\s*/u)
        : frontmatter.tools ?? [];
      for (const skillId of routedSkillIds) {
        if (preloadedSkillIds.has(skillId) || !hasExplicitTools) continue;
        assert.equal(
          tools.includes("Skill"),
          true,
          `${relative(getTmpDistDir(), agentFile)} routes ${skillId} but omits the Claude Skill tool`,
        );
      }
    }
  });

  test("generated skill entrypoints stay concise", () => {
    for (const platform of ["claude", "codex"]) {
      for (const skillFile of collectFiles(join(getTmpDistDir(), platform, "skills"), (file) => basename(file) === "SKILL.md")) {
        const lineCount = readFileSync(skillFile, "utf-8").split(/\r?\n/u).length;
        assert.ok(
          lineCount <= 500,
          `${relative(getTmpDistDir(), skillFile)} has ${lineCount} lines; move detail to references or compact procedure params`,
        );
      }
    }
  });

  test("manifest file checksums cover every generated file", () => {
    for (const platform of ["claude", "codex"]) {
      const platformRoot = join(getTmpDistDir(), platform);
      const platformValue = platform === "claude" ? Platform.Claude : Platform.Codex;
      const manifest = JSON.parse(readFileSync(join(platformRoot, "manifest.json"), "utf-8"));
      const manifestFiles = manifest.files as Record<string, string>;
      const proceduresFile = manifest.procedures.proceduresFile as string;
      const actualFiles = collectFiles(platformRoot)
        .map((file) => file.slice(platformRoot.length + 1).split("\\").join("/"))
        .filter((file) => file !== "manifest.json")
        .sort();

      assert.deepEqual(
        Object.keys(manifestFiles).sort(),
        actualFiles,
        `${platform} manifest files should exactly cover generated output except manifest.json`,
      );

      for (const relativeFile of actualFiles) {
        const checksum = createHash("sha256")
          .update(readFileSync(join(platformRoot, relativeFile)))
          .digest("hex");
        assert.equal(manifestFiles[relativeFile], checksum, `${platform} manifest checksum for ${relativeFile}`);
      }

      assert.equal(existsSync(join(platformRoot, proceduresFile)), true, `${platform} procedures bundle should exist`);
      const proceduresChecksum = createHash("sha256")
        .update(readFileSync(join(platformRoot, proceduresFile)))
        .digest("hex");
      assert.equal(
        manifest.procedures.bundleChecksum,
        proceduresChecksum,
        `${platform} procedure bundle checksum should match generated procedures.js`,
      );
      assert.deepEqual(
        manifest.procedures.items
          .filter((procedure: any) => procedure.target !== proceduresFile)
          .map((procedure: any) => `${procedure.id}:${procedure.target}`),
        [],
        `${platform} procedure manifest entries should all target the generated procedures bundle`,
      );
      const platformSkillIds = new Set(manifest.skills as string[]);
      const platformAgentIds = new Set(manifest.agents as string[]);
      const sourceSkillProcedureOwners = new Set(
        registry.skills
          .filter((skill) => skill.platforms.includes(platformValue))
          .flatMap((skill) =>
            listProcedureUses(skill)
              .filter((procedureUse) => procedureUseAppliesToPlatform(procedureUse, platformValue))
              .map((procedureUse) => `${skill.id}:${procedureUse.id}`)
          ),
      );
      const sourceAgentProcedureOwners = new Set(
        registry.agents
          .filter((agent) => agent.platforms.includes(platformValue))
          .flatMap((agent) =>
            listProcedureUses(agent)
              .filter((procedureUse) => procedureUseAppliesToPlatform(procedureUse, platformValue))
              .map((procedureUse) => `${agent.id}:${procedureUse.id}`)
          ),
      );
      const invalidProcedureOwners: string[] = [];
      for (const procedure of manifest.procedures.items as any[]) {
        const ownerSkillIds = procedure.owners?.skillIds ?? [];
        const ownerAgentIds = procedure.owners?.agentIds ?? [];
        if (ownerSkillIds.length + ownerAgentIds.length === 0) {
          invalidProcedureOwners.push(`${procedure.id}:missing-owner`);
        }
        for (const skillId of ownerSkillIds) {
          if (!platformSkillIds.has(skillId)) invalidProcedureOwners.push(`${procedure.id}:skill:${skillId}`);
          if (!sourceSkillProcedureOwners.has(`${skillId}:${procedure.id}`)) {
            invalidProcedureOwners.push(`${procedure.id}:unused-skill-owner:${skillId}`);
          }
        }
        for (const agentId of ownerAgentIds) {
          if (!platformAgentIds.has(agentId)) invalidProcedureOwners.push(`${procedure.id}:agent:${agentId}`);
          if (!sourceAgentProcedureOwners.has(`${agentId}:${procedure.id}`)) {
            invalidProcedureOwners.push(`${procedure.id}:unused-agent-owner:${agentId}`);
          }
        }
      }
      assert.deepEqual(
        invalidProcedureOwners,
        [],
        `${platform} procedure owners should reference generated skills or agents for the same platform`,
      );

      const proceduresById = new Map((manifest.procedures.items as any[]).map((procedure) => [procedure.id, procedure]));
      const invalidProcedureCommands: string[] = [];
      const commandSources = [
        ...collectFiles(join(platformRoot, "skills"), (file) => /\.(?:md|toml)$/.test(file)),
        ...collectFiles(join(platformRoot, "agents"), (file) => /\.(?:md|toml)$/.test(file)),
      ];

      for (const commandSource of commandSources) {
        const source = readFileSync(commandSource, "utf-8");
        for (const match of source.matchAll(/--procedure-id\s+([A-Za-z0-9-]+)[\s\S]*?(?=\n```)/g)) {
          const procedureId = match[1];
          const commandText = match[0];
          const procedure = proceduresById.get(procedureId);
          if (!procedure) {
            invalidProcedureCommands.push(`${commandSource}:missing-procedure:${procedureId}`);
            continue;
          }
          const triggerSkill = commandText.match(/--trigger-skill\s+([A-Za-z0-9-]+)/)?.[1];
          const triggerAgent = commandText.match(/--trigger-agent\s+([A-Za-z0-9-]+)/)?.[1];
          if (!triggerSkill && !triggerAgent) {
            invalidProcedureCommands.push(`${commandSource}:${procedureId}:missing-trigger`);
          }
          if (triggerSkill && !procedure.owners?.skillIds?.includes(triggerSkill)) {
            invalidProcedureCommands.push(`${commandSource}:${procedureId}:skill:${triggerSkill}`);
          }
          if (triggerAgent && !procedure.owners?.agentIds?.includes(triggerAgent)) {
            invalidProcedureCommands.push(`${commandSource}:${procedureId}:agent:${triggerAgent}`);
          }
          const triggerMatch = commandText.match(/--trigger-(?:skill|agent)\s+[A-Za-z0-9-]+([\s\S]*)$/u);
          const afterTrigger = triggerMatch?.[1]?.replace(/\\\s*/gu, " ").trim() ?? "";
          const isGeneratedProcedureCommand = /node ~\/\.(?:claude|codex)\/procedures\.js\s+\\\n/u.test(source);
          if (isGeneratedProcedureCommand && afterTrigger !== "" && !afterTrigger.startsWith("-- ")) {
            invalidProcedureCommands.push(`${commandSource}:${procedureId}:missing-args-separator`);
          }
        }
      }
      assert.deepEqual(
        invalidProcedureCommands,
        [],
        `${platform} generated procedure commands should reference manifest procedures and valid owners`,
      );
    }
  });

}
