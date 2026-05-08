import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { afterAll, beforeAll, describe, test } from "vitest";
import { resolveHookTimeoutSeconds } from "../../src/build/hooks.ts";
import { listProcedureUses, procedureUseAppliesToPlatform } from "../../src/build/procedure-uses.ts";
import { registry } from "../../src/components/registry.ts";
import { InvocationPolicy, Platform } from "../../src/components/sdk.ts";
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

type ParsedTomlScalar = string | boolean | number;
type ParsedGeneratedToml = {
  root: Record<string, ParsedTomlScalar>;
  sections: Record<string, Record<string, ParsedTomlScalar>>;
  arrays: Record<string, Record<string, ParsedTomlScalar>[]>;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseGeneratedToml(source: string, label: string): ParsedGeneratedToml {
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

function buildComponents(outDir: string): void {
  execFileSync(
    process.execPath,
    ["--import", "tsx/esm", "src/build.ts", "--out-dir", outDir],
    { cwd: repoRoot, encoding: "utf-8" },
  );
}

function assertInstallManifestEntriesExist(platformRoot: string, manifest: any, label: string): void {
  const install = manifest.install as {
    rootEntries: string[];
    skillSourceRoot: string;
    skillEntries: string[];
    forbiddenRootEntries: string[];
    forbiddenSkillEntries: string[];
  };

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
}, 120_000);

afterAll(() => {
  if (tmpDistDir) {
    rmSync(tmpDistDir, { recursive: true, force: true });
  }
});

function collectHookGroupTimeouts(config: any): Record<string, number> {
  const timeouts: Record<string, number> = {};
  for (const [event, groups] of Object.entries(config.hooks as Record<string, any[]>)) {
    for (const group of groups) {
      const key = `${event}\0${group.matcher ?? ""}`;
      timeouts[key] = group.hooks[0].timeout;
    }
  }
  return timeouts;
}

function collectExpectedHookGroupTimeouts(manifest: any): Record<string, number> {
  const timeouts: Record<string, number> = {};
  for (const hook of manifest.hooks as any[]) {
    const key = `${hook.event}\0${hook.matcher ?? ""}`;
    timeouts[key] = (timeouts[key] ?? 0) + resolveHookTimeoutSeconds(hook);
  }
  return timeouts;
}

function assertHookGroupTimeoutsMatchManifest(config: any, manifest: any, label: string): void {
  assert.deepEqual(
    collectHookGroupTimeouts(config),
    collectExpectedHookGroupTimeouts(manifest),
    `${label} grouped dispatcher timeouts should equal the sum of sequential hook budgets`,
  );
}

describe("component build integration", () => {
  test("emits claude/codex manifests and core component counts", () => {
    const claudeManifest = JSON.parse(readFileSync(join(tmpDistDir, "claude/manifest.json"), "utf-8"));
    const codexManifest = JSON.parse(readFileSync(join(tmpDistDir, "codex/manifest.json"), "utf-8"));

    assert.equal(
      claudeManifest.schema,
      5,
      "Claude manifest schema should version the install contract",
    );
    assert.equal(
      codexManifest.schema,
      5,
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
      (codexManifest.skills as string[]).filter((skillId) =>
        ["imagegen", "openai-docs", "plugin-creator", "skill-creator", "skill-installer"].includes(skillId)
      ),
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
    assert.equal(Object.hasOwn(claudeManifest, "profile"), false);
    assert.equal(Object.hasOwn(codexManifest, "profile"), false);
    assert.equal(existsSync(join(tmpDistDir, "claude/rules")), false);
    assert.equal(existsSync(join(tmpDistDir, "codex/rules")), false);
    assert.equal(
      existsSync(join(tmpDistDir, "codex/installation_id")),
      false,
      "Codex runtime installation state should not be generated into dist",
    );
    assert.equal(
      existsSync(join(tmpDistDir, "codex/skills/.system")),
      false,
      "Codex system skill cache should stay runtime-local, not generated into dist",
    );

    assert.equal(claudeManifest.install.configRoot, "~/.claude");
    assert.equal(claudeManifest.install.skillSourceRoot, "skills/");
    assert.equal(claudeManifest.install.skillRoot, "~/.claude/skills");
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
    assert.equal(codexManifest.install.rootEntries.includes("AGENTS.md"), true);
    assert.equal(codexManifest.install.rootEntries.includes("config.toml"), true);
    assert.equal(codexManifest.install.rootEntries.includes("procedures.js"), true);
    assert.deepEqual(codexManifest.install.forbiddenRootEntries, ["skills/", "installation_id"]);
    assert.deepEqual(codexManifest.install.forbiddenSkillEntries, [".system/"]);
    assert.deepEqual(
      codexManifest.install.skillEntries,
      (codexManifest.skills as string[]).map((skillId) => `${skillId}/`),
      "Codex install manifest should map target-relative skill directories to ~/.agents/skills",
    );

    assertInstallManifestEntriesExist(join(tmpDistDir, "claude"), claudeManifest, "Claude");
    assertInstallManifestEntriesExist(join(tmpDistDir, "codex"), codexManifest, "Codex");
  });

  test("manifest file checksums cover every generated file", () => {
    for (const platform of ["claude", "codex"]) {
      const platformRoot = join(tmpDistDir, platform);
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
        for (const match of source.matchAll(/--procedure-id\s+([A-Za-z0-9-]+)[^\n]*/g)) {
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
        }
      }
      assert.deepEqual(
        invalidProcedureCommands,
        [],
        `${platform} generated procedure commands should reference manifest procedures and valid owners`,
      );
    }
  });

  test("emits reproducible manifests and procedure bundles", () => {
    const firstDistDir = mkdtempSync(join(tmpdir(), "ai-experts-repro-a-"));
    const secondDistDir = mkdtempSync(join(tmpdir(), "ai-experts-repro-b-"));
    try {
      buildComponents(firstDistDir);
      buildComponents(secondDistDir);
      for (const platform of ["claude", "codex"]) {
        assert.equal(
          readFileSync(join(firstDistDir, platform, "procedures.js"), "utf-8"),
          readFileSync(join(secondDistDir, platform, "procedures.js"), "utf-8"),
          `${platform} procedure bundle should be reproducible`,
        );
        assert.equal(
          readFileSync(join(firstDistDir, platform, "manifest.json"), "utf-8"),
          readFileSync(join(secondDistDir, platform, "manifest.json"), "utf-8"),
          `${platform} manifest should be reproducible`,
        );
      }
    } finally {
      rmSync(firstDistDir, { recursive: true, force: true });
      rmSync(secondDistDir, { recursive: true, force: true });
    }
  }, 120_000);

  test("emits parseable codex TOML configs", () => {
    const codexManifest = JSON.parse(readFileSync(join(tmpDistDir, "codex/manifest.json"), "utf-8"));
    const codexConfig = parseGeneratedToml(
      readFileSync(join(tmpDistDir, "codex/config.toml"), "utf-8"),
      "codex/config.toml",
    );
    assert.equal(codexConfig.sections.features.codex_hooks, true);
    assert.equal(codexConfig.sections.agents.max_depth, 1);

    const agentFiles = collectFiles(join(tmpDistDir, "codex/agents"), (file) => file.endsWith(".toml"));
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
      const label = agentFile.slice(tmpDistDir.length + 1);
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
          /## 技能编排|When a listed skill is relevant/,
          `${label} should not describe skill routing without configured skills`,
        );
      } else {
        assert.match(developerInstructions, /## 技能编排/, `${label} should describe configured skill routing`);
      }
      for (const skillConfig of skillConfigs) {
        assert.deepEqual(Object.keys(skillConfig).sort(), ["enabled", "path"], `${label} skill config shape`);
        assert.equal(skillConfig.enabled, true, `${label} skill config should be enabled`);
        assert.equal(typeof skillConfig.path, "string", `${label} skill path should be a string`);
        const pathMatch = String(skillConfig.path).match(/^~\/\.agents\/skills\/([a-z0-9-]+)\/SKILL\.md$/);
        assert.ok(pathMatch, `${label} skill path should use the Codex user skill root`);
        assert.equal(
          existsSync(join(tmpDistDir, "codex/skills", pathMatch[1], "SKILL.md")),
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
    assert.equal(existsSync(join(tmpDistDir, "codex/skills/pdf/SKILL.md")), false);
    const restrictedCodexFiles = collectFiles(join(tmpDistDir, "codex/skills"), (file) => {
      if (!/\.(?:md|txt|ya?ml|json|toml)$/u.test(file)) return false;
      return /Anthropic[\s\S]+ADDITIONAL RESTRICTIONS[\s\S]+Extract these materials from the Services/u.test(
        readFileSync(file, "utf-8"),
      );
    });

    assert.deepEqual(restrictedCodexFiles, [], "Codex dist should not include Anthropic-only skill materials");
  });

  test("Codex runtime-facing materials do not mention unavailable procedures", () => {
    const codexManifest = JSON.parse(readFileSync(join(tmpDistDir, "codex/manifest.json"), "utf-8"));
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
      ...collectFiles(join(tmpDistDir, "codex/skills"), (file) =>
        /\.(?:css|html|js|json|md|mjs|toml|txt|ya?ml)$/u.test(file)
      ),
      ...collectFiles(join(tmpDistDir, "codex/agents"), (file) => /\.(?:md|toml|txt|ya?ml)$/u.test(file)),
    ];
    const leaks: string[] = [];

    for (const runtimeFile of runtimeFacingFiles) {
      const match = unavailableProcedurePattern.exec(readFileSync(runtimeFile, "utf-8"));
      if (match) {
        leaks.push(`${runtimeFile.slice(tmpDistDir.length + 1)}:${match[0]}`);
      }
    }

    assert.deepEqual(leaks, [], "Codex generated runtime materials should not reference unavailable procedures");
  });

  test("emits Codex skill metadata for every generated skill", () => {
    const codexManifest = JSON.parse(readFileSync(join(tmpDistDir, "codex/manifest.json"), "utf-8"));
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
      const metadataPath = join(tmpDistDir, "codex/skills", skillId, "agents/openai.yaml");
      assert.equal(existsSync(metadataPath), true, `${skillId} should emit agents/openai.yaml`);
      const metadata = readFileSync(metadataPath, "utf-8");
      const allowImplicit = skill.invocation !== InvocationPolicy.ExplicitOnly;

      assert.match(metadata, /^interface:\n/);
      assert.match(metadata, new RegExp(`^  display_name: "${escapeRegExp(skill.fullName)}"$`, "m"));
      assert.match(metadata, /^  short_description: ".+"$/m);
      assert.match(metadata, /^policy:\n/m);
      assert.match(
        metadata,
        new RegExp(`^  allow_implicit_invocation: ${allowImplicit ? "true" : "false"}$`, "m"),
        `${skillId} should mirror its InvocationPolicy in openai.yaml`,
      );
    }

    assert.deepEqual(
      collectFiles(join(tmpDistDir, "claude/skills"), (file) => file.endsWith("openai.yaml")),
      [],
      "Claude skill packages should not include Codex openai.yaml metadata",
    );
  });

  test("renders representative skill/agent/instruction outputs", () => {
    const tsSkill = readFileSync(
      join(tmpDistDir, "claude/skills/typescript-type-safety/SKILL.md"),
      "utf-8",
    );
    assert.match(tsSkill, /name: typescript-type-safety/);
    assert.match(tsSkill, /Reference Map/);
    assert.doesNotMatch(tsSkill, /plugins\//);
    assert.equal(
      existsSync(join(tmpDistDir, "claude/skills/typescript-type-safety/references/advanced-patterns.md")),
      true,
    );

    const screenshotSkill = readFileSync(join(tmpDistDir, "codex/skills/screenshot/SKILL.md"), "utf-8");
    assert.match(screenshotSkill, /Procedure 调用说明/);
    assert.match(screenshotSkill, /\| Procedure \| 用法 \| 何时调用 \| 调用目的 \| 参数 \| 返回值 \| 示例命令 \|/);
    assert.match(screenshotSkill, /screenshot-take-screenshot/);
    assert.match(screenshotSkill, /截图主入口/);
    assert.match(screenshotSkill, /--path output\/screen\.png/);
    assert.match(screenshotSkill, /--active-window/);
    assert.match(screenshotSkill, /CliProcedureRequest/);
    assert.match(screenshotSkill, /RuntimeProcedureResult/);
    assert.match(screenshotSkill, /node ~\/\.codex\/procedures\.js --procedure-id screenshot-take-screenshot/);
    assert.doesNotMatch(screenshotSkill, /node \.\.\/\.\.\/procedures\.js/);
    assert.doesNotMatch(screenshotSkill, /node scripts\/take_screenshot\.mjs/);
    assert.equal(existsSync(join(tmpDistDir, "codex/procedures.js")), true);
    assert.equal(existsSync(join(tmpDistDir, "codex/run.js")), false);
    assert.equal(existsSync(join(tmpDistDir, "codex/scripts")), false);
    assert.equal(existsSync(join(tmpDistDir, "codex/skills/screenshot/assets/screenshot.png")), true);

    const shadcnSkill = readFileSync(join(tmpDistDir, "claude/skills/shadcn-ui/SKILL.md"), "utf-8");
    assert.match(shadcnSkill, /allowed-tools:\n  - mcp__shadcn__\.\*/);

    const speckitTaskstoissuesSkill = readFileSync(
      join(tmpDistDir, "claude/skills/speckit-taskstoissues/SKILL.md"),
      "utf-8",
    );
    assert.match(speckitTaskstoissuesSkill, /allowed-tools:\n  - mcp__github\/github-mcp-server__issue_write/);

    const goTestingPatternsSkill = readFileSync(
      join(tmpDistDir, "claude/skills/go-testing-patterns/SKILL.md"),
      "utf-8",
    );
    assert.match(goTestingPatternsSkill, /## 相关 Skill/);
    assert.match(goTestingPatternsSkill, /\[testing-patterns\]\(\.\.\/testing-patterns\/SKILL\.md\)/);
    assert.match(goTestingPatternsSkill, /## 检查清单/);
    assert.ok(
      goTestingPatternsSkill.indexOf("## 反模式") < goTestingPatternsSkill.indexOf("## 检查清单"),
      "generated checklist should render after anti-patterns",
    );

    const structuredProblemSkill = readFileSync(
      join(tmpDistDir, "claude/skills/structured-problem-decomposition/SKILL.md"),
      "utf-8",
    );
    assert.match(structuredProblemSkill, /## 工作流/);
    assert.match(structuredProblemSkill, /```mermaid\nflowchart TD/);
    assert.match(structuredProblemSkill, /evidence-quality-framework/);
    assert.match(structuredProblemSkill, /匹配场景路由/);
    assert.match(structuredProblemSkill, /debug-methodology/);
    assert.match(structuredProblemSkill, /fishbone-diagram/);
    assert.match(structuredProblemSkill, /pdca-cycle/);
    assert.match(structuredProblemSkill, /join --> compose_result/);

    const codexMetadata = readFileSync(
      join(tmpDistDir, "codex/skills/typescript-type-safety/agents/openai.yaml"),
      "utf-8",
    );
    assert.match(codexMetadata, /allow_implicit_invocation: true/);
    assert.match(tsSkill, /node ~\/\.claude\/procedures\.js --procedure-id typescript-type-safety-extract-ts-errors/);
    assert.match(tsSkill, /ExtractTsErrorsArgs/);
    assert.match(tsSkill, /ExtractTsErrorsSummary/);

    const claudeManifestWithScripts = JSON.parse(readFileSync(
      join(tmpDistDir, "claude/manifest.json"),
      "utf-8",
    ));
    assert.equal(claudeManifestWithScripts.procedures.proceduresFile, "procedures.js");
    assert.match(claudeManifestWithScripts.procedures.bundleChecksum, /^[a-f0-9]{64}$/);
    assert.equal(
      claudeManifestWithScripts.procedures.items.some((procedure: any) =>
        procedure.id === "screenshot-take-screenshot" &&
        procedure.target === "procedures.js" &&
        procedure.runtime === "node" &&
        procedure.bundled === true
      ),
      true,
    );
    assert.deepEqual(
      claudeManifestWithScripts.procedures.items.filter((procedure: any) => procedure.target !== "procedures.js"),
      [],
      "bundled procedure manifest entries should point at the generated bundle, not removed per-script files",
    );
    assert.equal(
      claudeManifestWithScripts.procedures.items.some((procedure: any) => procedure.id === "skill-creator-run-eval"),
      true,
      "Claude should include Claude trigger-eval procedures",
    );
    assert.equal("scripts" in claudeManifestWithScripts, false);

    const codexManifestWithScripts = JSON.parse(readFileSync(
      join(tmpDistDir, "codex/manifest.json"),
      "utf-8",
    ));
    assert.equal(
      codexManifestWithScripts.procedures.items.some((procedure: any) => procedure.id === "skill-creator-run-eval"),
      false,
      "Codex should not expose Claude trigger-eval procedures",
    );
    assert.equal(
      codexManifestWithScripts.procedures.items.some((procedure: any) => procedure.id === "skill-creator-run-loop"),
      false,
      "Codex should not expose Claude trigger-optimization loops",
    );
    assert.deepEqual(
      codexManifestWithScripts.procedures.items
        .map((procedure: any) => procedure.id)
        .filter((procedureId: string) => procedureId.startsWith("skill-creator-")),
      [],
      "Codex should use the system skill-creator instead of bundling custom skill-creator procedures",
    );
    assert.equal(existsSync(join(tmpDistDir, "claude/skills/skill-creator/assets/eval-viewer/viewer.html")), true);
    assert.equal(existsSync(join(tmpDistDir, "codex/skills/skill-creator/SKILL.md")), false);
    assert.equal(existsSync(join(tmpDistDir, "codex/skills/skill-creator/assets/eval-viewer/viewer.html")), false);
    const codexSkillAuthor = readFileSync(join(tmpDistDir, "codex/agents/skill-author.toml"), "utf-8");
    assert.doesNotMatch(codexSkillAuthor, /skill-creator-run-eval|skill-creator-run-loop/);
    assert.doesNotMatch(codexSkillAuthor, /~\/\.agents\/skills\/skill-creator\/SKILL\.md/);
    const claudeSkillEvolver = readFileSync(join(tmpDistDir, "claude/skills/skill-evolver/SKILL.md"), "utf-8");
    const codexSkillEvolver = readFileSync(join(tmpDistDir, "codex/skills/skill-evolver/SKILL.md"), "utf-8");
    assert.match(claudeSkillEvolver, /\[skill-creator\]\(\.\.\/skill-creator\/SKILL\.md\)/);
    assert.doesNotMatch(codexSkillEvolver, /\[skill-creator\]\(\.\.\/skill-creator\/SKILL\.md\)/);

    const claudeAgent = readFileSync(join(tmpDistDir, "claude/agents/typescript-reviewer.md"), "utf-8");
    assert.match(claudeAgent, /name: typescript-reviewer/);
    assert.match(claudeAgent, /skills:\n  - typescript-type-safety\n  - debug-methodology/);
    assert.match(claudeAgent, /model: sonnet\neffort: high/);
    assert.match(claudeAgent, /你是资深 TypeScript 工程师/);
    assert.match(claudeAgent, /`debug-methodology` \(route\)/);

    const typescriptEngineerAgent = readFileSync(
      join(tmpDistDir, "claude/agents/typescript-engineer.md"),
      "utf-8",
    );
    assert.match(typescriptEngineerAgent, /## Bash 使用边界/);
    assert.match(typescriptEngineerAgent, /## 工作流/);
    assert.match(typescriptEngineerAgent, /```mermaid\nflowchart TD/);
    assert.ok(
      typescriptEngineerAgent.indexOf("## 工作流") < typescriptEngineerAgent.indexOf("## 质量标准"),
      "generated agent workflow should stay before quality standards",
    );
    assert.ok(
      typescriptEngineerAgent.indexOf("## Bash 使用边界") < typescriptEngineerAgent.indexOf("## 输出格式"),
      "generated agent Bash boundary should stay near the operational guidance sections",
    );
    assert.match(typescriptEngineerAgent, /# TypeScript 工程报告：<scope>/);
    assert.match(typescriptEngineerAgent, /## 质量标准/);
    assert.ok(
      typescriptEngineerAgent.indexOf("## 输出格式") < typescriptEngineerAgent.indexOf("## 质量标准"),
      "generated agent quality standards should stay after agent-specific output guidance",
    );

    const productDiscovererAgent = readFileSync(
      join(tmpDistDir, "claude/agents/product-discoverer.md"),
      "utf-8",
    );
    assert.doesNotMatch(
      productDiscovererAgent,
      /## Bash 使用边界/,
      "agents without KnownTool.Bash should not emit Bash boundary instructions",
    );

    const androidReviewerAgent = readFileSync(join(tmpDistDir, "claude/agents/android-reviewer.md"), "utf-8");
    assert.doesNotMatch(androidReviewerAgent, /## 质量标准/, "agents without qualityStandards should not emit quality standards");
    assert.doesNotMatch(claudeAgent, /## 输出格式/, "agents without outputFormat should not emit output format instructions");
    const analyzerAgent = readFileSync(join(tmpDistDir, "claude/agents/eval-post-hoc-analyzer.md"), "utf-8");
    assert.doesNotMatch(analyzerAgent, /Analyzing Benchmark Results/, "analyzer should keep a single output format and one responsibility");
    assert.doesNotMatch(analyzerAgent, /## 技能编排/, "agents without skills should not emit empty skill routing");

    const goReviewerAgent = readFileSync(join(tmpDistDir, "claude/agents/go-reviewer.md"), "utf-8");
    assert.match(goReviewerAgent, /## 工作流/);
    assert.match(goReviewerAgent, /```mermaid\nflowchart TD/);
    assert.match(goReviewerAgent, /匹配场景路由/);
    assert.match(goReviewerAgent, /go-concurrency-patterns/);

    const codexAgent = readFileSync(join(tmpDistDir, "codex/agents/frontend-engineer.toml"), "utf-8");
    assert.match(codexAgent, /name = "frontend-engineer"/);
    assert.doesNotMatch(codexAgent, /model = "sonnet"/);
    assert.match(codexAgent, /sandbox_mode = "workspace-write"/);
    assert.match(codexAgent, /你是资深 Web 前端工程师/);
    assert.match(codexAgent, /## 技能编排/);
    assert.match(codexAgent, /\[\[skills\.config\]\]\npath = "~\/.agents\/skills\/modern-web-design\/SKILL\.md"\nenabled = true/);
    assert.match(codexAgent, /## Bash 使用边界/);
    assert.match(codexAgent, /# 前端工程报告：<scope>/);
    assert.match(codexAgent, /## 质量标准/);
    assert.match(codexAgent, /developer_instructions = '''\n/);

    const codexWebmanAgent = readFileSync(join(tmpDistDir, "codex/agents/webman-reviewer.toml"), "utf-8");
    assert.match(codexWebmanAgent, /developer_instructions = '''\n/);
    assert.match(codexWebmanAgent, /Illuminate\\Database/);

    const claudeInstructions = readFileSync(join(tmpDistDir, "claude/CLAUDE.md"), "utf-8");
    const expectedInstructionSections = [
      "## 使用原则",
      "## 通用行为协议",
      "## 任务执行协议",
      "## 安全与交付门禁",
      "## 沟通与输出协议",
      "## 复杂报告模板",
    ];
    assert.match(claudeInstructions, /^# 本地 AI 能力使用指南\n/);
    assert.doesNotMatch(claudeInstructions.slice(0, 220), /# ai-experts|你正在使用|ai-experts/);
    let previousInstructionSectionIndex = -1;
    for (const section of expectedInstructionSections) {
      const sectionIndex = claudeInstructions.indexOf(section);
      assert.notEqual(sectionIndex, -1, `missing instruction section: ${section}`);
      assert.ok(
        sectionIndex > previousInstructionSectionIndex,
        `instruction section should be ordered after previous section: ${section}`,
      );
      previousInstructionSectionIndex = sectionIndex;
    }
    assert.doesNotMatch(claudeInstructions, /可用能力索引|Skill 索引|Agent 索引|frontend-engineer/);
    assert.doesNotMatch(claudeInstructions, /组件运行模型|组件源码边界|Procedure 运行时|生成画像|Hook 索引/);

    const codexInstructions = readFileSync(join(tmpDistDir, "codex/AGENTS.md"), "utf-8");
    assert.match(codexInstructions, /^# 本地 AI 能力使用指南\n/);
    assert.doesNotMatch(codexInstructions.slice(0, 220), /# ai-experts|你正在使用|ai-experts/);
    assert.match(codexInstructions, /## 使用原则/);
    assert.match(codexInstructions, /## 任务执行协议/);
    assert.match(codexInstructions, /## Agent 索引/);
    assert.match(codexInstructions, /frontend-engineer/);
    assert.doesNotMatch(codexInstructions, /可用能力索引|Skill 索引|typescript-type-safety/);
    assert.doesNotMatch(codexInstructions, /组件运行模型|组件源码边界|Procedure 运行时|生成画像|Hook 索引/);

    for (const platformName of ["claude", "codex"]) {
      const skillFiles = collectFiles(join(tmpDistDir, platformName, "skills"))
        .filter((file) => file.endsWith("/SKILL.md"));
      for (const skillFile of skillFiles) {
        const skillSource = readFileSync(skillFile, "utf-8");
        assert.doesNotMatch(
          skillSource,
          /\n{3,}/,
          `${skillFile} should not contain repeated blank lines`,
        );
      }

      const skillMarkdownFiles = collectFiles(join(tmpDistDir, platformName, "skills"))
        .filter((file) => file.endsWith(".md"));
      for (const skillFile of skillMarkdownFiles) {
        const skillSource = readFileSync(skillFile, "utf-8");
        assert.doesNotMatch(
          skillSource,
          /node \.\.\/\.\.\/procedures\.js/,
          `${skillFile} should not render invalid relative procedure runtime paths`,
        );
        assert.doesNotMatch(
          skillSource,
          /node\s+<runtime-root>\/procedures\.js/,
          `${skillFile} should render concrete platform procedure runtime paths`,
        );
        assert.doesNotMatch(
          skillSource,
          /node\s+(?:\.\/)?scripts\/[A-Za-z0-9._/-]+\.mjs/,
          `${skillFile} should not render legacy local script commands`,
        );
      }
    }
  });

  test("provides bundled procedures.js protocol", () => {
    const proceduresPath = join(tmpDistDir, "claude/procedures.js");
    assert.equal(existsSync(proceduresPath), true);

    const runPath = join(tmpDistDir, "claude/run.js");
    assert.equal(existsSync(runPath), false);

    function runProcedureProcess(args: string[]): { status: number | null; payload: any; stderr: string } {
      const result = spawnSync(process.execPath, [proceduresPath, ...args], { encoding: "utf-8" });
      assert.equal(result.stderr, "", `procedure runtime should emit machine-readable errors on stdout: ${result.stderr}`);
      return {
        status: result.status,
        payload: JSON.parse(result.stdout),
        stderr: result.stderr,
      };
    }

    const missingScriptIdResult = runProcedureProcess([]);
    assert.equal(missingScriptIdResult.status, 1);
    const missingScriptId = missingScriptIdResult.payload;
    assert.equal(missingScriptId.ok, false);
    assert.equal(missingScriptId.error.code, "RUNNER_ERROR");
    assert.match(missingScriptId.error.message, /--procedure-id is required/);

    const unknownScriptResult = runProcedureProcess([
      "--procedure-id",
      "not-exists",
      "--trigger-skill",
      "debug-methodology",
    ]);
    assert.equal(unknownScriptResult.status, 1);
    const unknownScript = unknownScriptResult.payload;
    assert.equal(unknownScript.ok, false);
    assert.match(unknownScript.error.message, /procedure not found/);

    const helperOnlyProcedureResult = runProcedureProcess([
      "--procedure-id",
      "android-device-automation-common",
      "--trigger-skill",
      "android-device-automation",
    ]);
    assert.equal(helperOnlyProcedureResult.status, 1);
    const helperOnlyProcedure = helperOnlyProcedureResult.payload;
    assert.equal(helperOnlyProcedure.ok, false);
    assert.match(helperOnlyProcedure.error.message, /procedure not found/);

    const ownerMismatchResult = runProcedureProcess([
      "--procedure-id",
      "debug-methodology-debug-checklist",
      "--trigger-skill",
      "screenshot",
      "--request-json",
      "{\"args\":[\"--title\",\"owner-mismatch\"]}",
    ]);
    assert.equal(ownerMismatchResult.status, 1);
    const ownerMismatch = ownerMismatchResult.payload;
    assert.equal(ownerMismatch.ok, false);
    assert.match(ownerMismatch.error.message, /not callable by trigger skill/);

    const invalidJsonResult = runProcedureProcess([
      "--procedure-id",
      "debug-methodology-debug-checklist",
      "--trigger-skill",
      "debug-methodology",
      "--request-json",
      "{not-json}",
    ]);
    assert.equal(invalidJsonResult.status, 1);
    const invalidJson = invalidJsonResult.payload;
    assert.equal(invalidJson.ok, false);
    assert.match(invalidJson.error.message, /Unexpected token|JSON/i);

    const success = JSON.parse(execFileSync(process.execPath, [
      proceduresPath,
      "--procedure-id",
      "debug-methodology-debug-checklist",
      "--trigger-skill",
      "debug-methodology",
      "--session-id",
      "fixture-session",
      "--request-json",
      "{\"args\":[\"--title\",\"fixture-checklist\"]}",
    ], { encoding: "utf-8" }));
    assert.equal(success.ok, true);
    assert.equal(success.procedureId, "debug-methodology-debug-checklist");
    assert.equal(success.sessionId, "fixture-session");
    assert.equal(success.trigger.skillId, "debug-methodology");
    assert.equal(success.error, null);
    assert.equal(typeof success.timingMs, "number");
    assert.match(success.result.stdout, /Debug Checklist: fixture-checklist/);

    const executionFailureResult = runProcedureProcess([
      "--procedure-id",
      "web-content-fetcher-fetch",
      "--trigger-skill",
      "web-content-fetcher",
      "--request-json",
      "{\"args\":[\"--invalid\"]}",
    ]);
    assert.notEqual(executionFailureResult.status, 0);
    const executionFailure = executionFailureResult.payload;
    assert.equal(executionFailure.ok, false);
    assert.equal(executionFailure.error.code, "PROCEDURE_EXECUTION_FAILED");
    assert.equal(typeof executionFailure.result.exitCode, "number");

    const passthroughArgs = JSON.parse(execFileSync(process.execPath, [
      proceduresPath,
      "--procedure-id",
      "debug-methodology-debug-checklist",
      "--trigger-skill",
      "debug-methodology",
      "--",
      "--title",
      "passthrough-mode",
    ], { encoding: "utf-8" }));
    assert.equal(passthroughArgs.ok, true);
    assert.equal(passthroughArgs.procedureId, "debug-methodology-debug-checklist");
    assert.match(passthroughArgs.result.stdout, /Debug Checklist: passthrough-mode/);

    const rewrittenHelp = JSON.parse(execFileSync(process.execPath, [
      proceduresPath,
      "--procedure-id",
      "screenshot-take-screenshot",
      "--trigger-skill",
      "screenshot",
      "--",
      "--help",
    ], { encoding: "utf-8" }));
    assert.equal(rewrittenHelp.ok, true);
    assert.match(
      rewrittenHelp.result.stdout,
      /Usage: node ~\/\.claude\/procedures\.js --procedure-id screenshot-take-screenshot --trigger-skill screenshot -- \[options\]/,
    );
    assert.doesNotMatch(rewrittenHelp.result.stdout, /node scripts\/take_screenshot\.mjs/);

    const runtimeHelp = JSON.parse(execFileSync(process.execPath, [
      proceduresPath,
      "--help",
    ], { encoding: "utf-8" }));
    assert.equal(runtimeHelp.ok, true);
    assert.match(
      runtimeHelp.result.usage,
      /node ~\/\.claude\/procedures\.js --procedure-id <id>/,
    );
  });

  test("executes representative bundled procedures with real fixtures", () => {
    const proceduresPath = join(tmpDistDir, "claude/procedures.js");
    const runtimeTmp = mkdtempSync(join(tmpdir(), "ai-experts-procedure-runtime-"));

    function runProcedureCommand(args: string[], options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): any {
      const result = spawnSync(process.execPath, [proceduresPath, ...args], {
        cwd: options.cwd,
        encoding: "utf-8",
        env: options.env,
        timeout: 20_000,
      });
      assert.ifError(result.error);
      assert.equal(result.stderr, "", `procedure runtime should emit machine-readable errors on stdout: ${result.stderr}`);
      const payload = JSON.parse(result.stdout);
      if (payload.ok) {
        assert.equal(result.status, 0, payload.result?.stderr ?? payload.error?.message);
      } else {
        assert.notEqual(result.status, 0, payload.result?.stderr ?? payload.error?.message);
      }
      return payload;
    }

    function runProcedure(id: string, skillId: string, args: string[]): any {
      return runProcedureCommand([
        "--procedure-id",
        id,
        "--trigger-skill",
        skillId,
        "--request-json",
        JSON.stringify({ args }),
      ]);
    }

    function runProcedureRequest(id: string, skillId: string, request: Record<string, unknown>): any {
      return runProcedureCommand([
        "--procedure-id",
        id,
        "--trigger-skill",
        skillId,
        "--request-json",
        JSON.stringify(request),
      ]);
    }

    function runProcedureWithEnv(id: string, skillId: string, args: string[], env: NodeJS.ProcessEnv): any {
      return runProcedureCommand([
        "--procedure-id",
        id,
        "--trigger-skill",
        skillId,
        "--request-json",
        JSON.stringify({ args }),
      ], { env: { ...process.env, ...env } });
    }

    function runProcedureInCwd(id: string, skillId: string, args: string[], cwd: string): any {
      return runProcedureCommand([
        "--procedure-id",
        id,
        "--trigger-skill",
        skillId,
        "--request-json",
        JSON.stringify({ args }),
      ], { cwd });
    }

    try {
      const tscOutput = join(runtimeTmp, "tsc.txt");
      writeFileSync(tscOutput, [
        "src/a.ts(1,2): error TS2322: Type string is not assignable to type number.",
        "src/b.ts(3,4): error TS7006: Parameter x implicitly has an any type.",
      ].join("\n"));
      const tsErrors = runProcedure("typescript-type-safety-extract-ts-errors", "typescript-type-safety", [
        "--input",
        tscOutput,
      ]);
      assert.equal(tsErrors.ok, true);
      assert.equal(JSON.parse(tsErrors.result.stdout).total, 2);

      const metadataOptimizer = runProcedureRequest(
        "app-store-optimization-metadata-optimizer",
        "app-store-optimization",
        {
          platform: "apple",
          appInfo: {
            name: "Focus Timer",
            primary_benefit: "stay focused during deep work",
            features: ["focus sessions", "progress tracking"],
          },
          targetKeywords: ["focus", "timer"],
        },
      );
      assert.equal(metadataOptimizer.ok, true, metadataOptimizer.result?.stderr);
      const metadata = JSON.parse(metadataOptimizer.result.stdout);
      assert.equal(metadata.platform, "apple");
      assert.equal(typeof metadata.title.recommendation, "string");

      const workspace = join(runtimeTmp, "review-workspace");
      mkdirSync(join(workspace, "case-1", "outputs"), { recursive: true });
      writeFileSync(join(workspace, "case-1", "eval_metadata.json"), JSON.stringify({
        eval_id: 1,
        prompt: "Review fixture prompt",
      }));
      writeFileSync(join(workspace, "case-1", "outputs", "answer.md"), "# Fixture Answer\n");
      const staticHtml = join(runtimeTmp, "review.html");
      const review = runProcedure("skill-creator-generate-review", "skill-creator", [
        workspace,
        "--skill-name",
        "fixture-skill",
        "--static",
        staticHtml,
      ]);
      assert.equal(review.ok, true, review.result?.stderr);
      assert.equal(existsSync(staticHtml), true);
      assert.match(readFileSync(staticHtml, "utf-8"), /fixture-skill/);

      const curateRepo = join(runtimeTmp, "curate-repo");
      const curateSkillDir = join(curateRepo, "src", "components", "skills", "stub-skill");
      mkdirSync(curateSkillDir, { recursive: true });
      writeFileSync(
        join(curateSkillDir, "index.ts"),
        [
          'import { defineSkill, defineWorkflow, defineWorkflowStep } from "../../sdk";',
          "",
          "export const stubSkill = defineSkill({",
          '  id: "stub-skill",',
          '  fullName: "Stub Skill",',
          '  description: "TODO",',
          '  useCases: ["TODO"],',
          '  constraints: ["TODO"],',
          '  sourceDir: new URL("./", import.meta.url),',
          '  workflow: defineWorkflow({ steps: [defineWorkflowStep({ id: "step-1", label: "TODO" })] }),',
          "});",
          "",
        ].join("\n"),
        "utf-8",
      );
      const curate = runProcedure("skills-prune-and-sync-readme-curate-skills", "skills-prune-and-sync-readme", [
        "audit",
        "--repo-root",
        curateRepo,
        "--format",
        "json",
      ]);
      assert.equal(curate.ok, true, curate.result?.stderr);
      const curateReport = JSON.parse(curate.result.stdout);
      assert.equal(curateReport.low_quality_candidates.some((item: any) => item.skill === "stub-skill"), true);

      const activationAudit = runProcedure(
        "skill-activation-analyzer-cso-audit",
        "skill-activation-analyzer",
        ["--json", "--severity", "critical"],
      );
      assert.equal(activationAudit.ok, true, activationAudit.result?.stderr);
      const activationReport = JSON.parse(activationAudit.result.stdout);
      assert.equal(activationReport.total, 335);
      assert.equal(typeof activationReport.pass_rate, "string");

      const explicitSkillsDirActivationAudit = runProcedure(
        "skill-activation-analyzer-cso-audit",
        "skill-activation-analyzer",
        ["--skills-dir", join(tmpDistDir, "codex/skills"), "--json", "--severity", "critical"],
      );
      assert.equal(explicitSkillsDirActivationAudit.ok, true, explicitSkillsDirActivationAudit.result?.stderr);
      const explicitSkillsDirActivationReport = JSON.parse(explicitSkillsDirActivationAudit.result.stdout);
      assert.equal(
        explicitSkillsDirActivationReport.total,
        registry.skills.filter((skill) => skill.platforms.includes(Platform.Codex)).length,
      );

      const canonicalSkillsRoot = join(runtimeTmp, "canonical-skills");
      const canonicalSkillDir = join(canonicalSkillsRoot, "alpha-skill");
      const nestedNonCanonicalSkillDir = join(canonicalSkillsRoot, "package-a", "skills", "nested-skill");
      mkdirSync(canonicalSkillDir, { recursive: true });
      mkdirSync(nestedNonCanonicalSkillDir, { recursive: true });
      writeFileSync(join(canonicalSkillDir, "SKILL.md"), [
        "---",
        "name: alpha-skill",
        "description: Use when auditing a canonical skill fixture.",
        "---",
        "",
        "# Alpha Skill",
      ].join("\n"));
      writeFileSync(join(nestedNonCanonicalSkillDir, "SKILL.md"), [
        "---",
        "name: nested-skill",
        "description: Use when auditing a nested non-canonical fixture.",
        "---",
        "",
        "# Nested Skill",
      ].join("\n"));
      const canonicalSkillsRootAudit = runProcedure(
        "skill-activation-analyzer-cso-audit",
        "skill-activation-analyzer",
        ["--skills-dir", canonicalSkillsRoot, "--json"],
      );
      assert.equal(canonicalSkillsRootAudit.ok, true, canonicalSkillsRootAudit.result?.stderr);
      const canonicalSkillsRootReport = JSON.parse(canonicalSkillsRootAudit.result.stdout);
      assert.equal(canonicalSkillsRootReport.total, 1);

      const nestedLayoutRoot = join(runtimeTmp, "nested-layout");
      const nestedLayoutSkillDir = join(nestedLayoutRoot, "package-a", "skills", "alpha-skill");
      mkdirSync(nestedLayoutSkillDir, { recursive: true });
      writeFileSync(join(nestedLayoutSkillDir, "SKILL.md"), [
        "---",
        "name: alpha-skill",
        "description: Use when auditing a nested layout fixture.",
        "---",
        "",
        "# Alpha Skill",
      ].join("\n"));
      const nestedLayoutRootAudit = runProcedure(
        "skill-activation-analyzer-cso-audit",
        "skill-activation-analyzer",
        ["--skills-dir", nestedLayoutRoot, "--json"],
      );
      assert.equal(nestedLayoutRootAudit.ok, false);
      assert.match(nestedLayoutRootAudit.result.stderr, /cannot find component skills directory/);

      const persona = runProcedure(
        "ux-researcher-designer-persona-generator",
        "ux-researcher-designer",
        ["--sample", "--output-format", "json"],
      );
      assert.equal(persona.ok, true, persona.result?.stderr);
      assert.equal(typeof JSON.parse(persona.result.stdout).name, "string");

      const removedPersonaJsonArg = runProcedure(
        "ux-researcher-designer-persona-generator",
        "ux-researcher-designer",
        ["--sample", "json"],
      );
      assert.equal(removedPersonaJsonArg.ok, false);
      assert.match(removedPersonaJsonArg.result.stderr, /unrecognized arguments: json/);

      const screenshotOutput = join(runtimeTmp, "screen.png");
      const screenshot = runProcedureWithEnv(
        "screenshot-take-screenshot",
        "screenshot",
        ["--mode", "temp", "--path", screenshotOutput],
        {
          AI_EXPERTS_SCREENSHOT_TEST_MODE: "1",
          AI_EXPERTS_SCREENSHOT_TEST_PLATFORM: "Darwin",
          AI_EXPERTS_SCREENSHOT_TEST_DISPLAYS: "1,2",
        },
      );
      assert.equal(screenshot.ok, true, screenshot.result?.stderr);
      const screenshotPaths = screenshot.result.stdout.trim().split(/\r?\n/);
      assert.deepEqual(
        screenshotPaths,
        [
          join(runtimeTmp, "screen-d1.png"),
          join(runtimeTmp, "screen-d2.png"),
        ],
      );
      for (const path of screenshotPaths) {
        assert.equal(existsSync(path), true, `${path} should be written by screenshot test mode`);
      }

      const speckitRepo = join(runtimeTmp, "speckit-repo");
      mkdirSync(speckitRepo, { recursive: true });
      const bootstrap = runProcedureInCwd(
        "speckit-baseline-bootstrap-specify",
        "speckit-baseline",
        [],
        speckitRepo,
      );
      assert.equal(bootstrap.ok, true, bootstrap.result?.stderr);
      const speckitScriptsDir = join(speckitRepo, ".specify", "scripts");
      const speckitTemplatesDir = join(speckitRepo, ".specify", "templates");
      const createFeatureScript = join(speckitScriptsDir, "create-new-feature.mjs");
      const setupPlanScript = join(speckitScriptsDir, "setup-plan.mjs");
      const checkPrerequisitesScript = join(speckitScriptsDir, "check-prerequisites.mjs");
      assert.equal(existsSync(createFeatureScript), true);
      assert.equal(existsSync(setupPlanScript), true);
      assert.equal(existsSync(checkPrerequisitesScript), true);
      assert.equal(existsSync(join(speckitTemplatesDir, "spec-template.md")), true);
      assert.equal(existsSync(join(speckitTemplatesDir, "plan-template.md")), true);
      const createFeatureWrapper = readFileSync(createFeatureScript, "utf-8");
      assert.doesNotMatch(createFeatureWrapper, /\.claude|\.codex|homedir/);
      assert.match(createFeatureWrapper, new RegExp(proceduresPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

      const wrapperEnv = { ...process.env };
      delete wrapperEnv.AI_EXPERTS_PROCEDURES_FILE;
      delete wrapperEnv.AI_EXPERTS_PROCEDURE_RUNTIME;
      const feature = JSON.parse(execFileSync(process.execPath, [
        createFeatureScript,
        "--json",
        "--short-name",
        "demo-feature",
        "Demo feature",
      ], { cwd: speckitRepo, encoding: "utf-8", env: wrapperEnv, stdio: ["ignore", "pipe", "pipe"], timeout: 20_000 }));
      assert.equal(feature.SLUG, "demo-feature");
      const plan = JSON.parse(execFileSync(process.execPath, [
        setupPlanScript,
        "--json",
      ], { cwd: speckitRepo, encoding: "utf-8", env: wrapperEnv, stdio: ["ignore", "pipe", "pipe"], timeout: 20_000 }));
      const expectedFeatureDir = realpathSync(join(speckitRepo, ".specify", "features", "demo-feature"));
      assert.equal(plan.SPECS_DIR, expectedFeatureDir);
      assert.equal(existsSync(join(expectedFeatureDir, "plan.md")), true);
      const prerequisites = JSON.parse(execFileSync(process.execPath, [
        checkPrerequisitesScript,
        "--json",
        "--paths-only",
      ], { cwd: speckitRepo, encoding: "utf-8", env: wrapperEnv, stdio: ["ignore", "pipe", "pipe"], timeout: 20_000 }));
      assert.equal(prerequisites.FEATURE_DIR, expectedFeatureDir);
    } finally {
      rmSync(runtimeTmp, { recursive: true, force: true });
    }
  }, 30_000);

  test("generates clean script artifacts with valid runtime imports", () => {
    for (const platform of ["claude", "codex"]) {
      assert.equal(existsSync(join(tmpDistDir, platform, "scripts")), false);
      assert.deepEqual(
        collectFiles(join(tmpDistDir, platform, "skills"), (file) =>
          file.slice(join(tmpDistDir, platform, "skills").length + 1).split(/[\\/]/).includes("tests"),
        ),
        [],
        `${platform} skill dist should not include source-side tests/ directories`,
      );
      const staleSkillLocalScriptMentions: string[] = [];
      for (const markdownFile of collectFiles(join(tmpDistDir, platform, "skills"), (file) => file.endsWith(".md"))) {
        const markdown = readFileSync(markdownFile, "utf-8");
        if (
          /`scripts\/` 下 \d+ 个 CLI/u.test(markdown) ||
          /仅把 `scripts\/` 目录下的可执行 Node 脚本当作入口/u.test(markdown) ||
          /命令中的 `scripts\/\.\.\.` 路径相对本 skill 根目录解析/u.test(markdown) ||
          /└── scripts\/\s+— Utility scripts/u.test(markdown)
        ) {
          staleSkillLocalScriptMentions.push(markdownFile);
        }
      }
      assert.deepEqual(
        staleSkillLocalScriptMentions,
        [],
        `${platform} generated skill docs should not describe removed skill-local script directories`,
      );
      const crossPlatformSkillInvocationHints: string[] = [];
      for (const markdownFile of collectFiles(join(tmpDistDir, platform, "skills"), (file) => file.endsWith(".md"))) {
        const markdown = readFileSync(markdownFile, "utf-8");
        if (/Claude Code: `\/[A-Za-z0-9_-]+`；Codex: `\$[A-Za-z0-9_-]+`/u.test(markdown)) {
          crossPlatformSkillInvocationHints.push(markdownFile);
        }
      }
      assert.deepEqual(
        crossPlatformSkillInvocationHints,
        [],
        `${platform} generated skill docs should not include dual-platform invocation syntax`,
      );
      assert.equal(
        collectFiles(join(tmpDistDir, platform, "skills"), (file) =>
          /[\\/]skills[\\/][^\\/]+[\\/]index\.js$/.test(file),
        ).length,
        0,
        `${platform} skill dist should not include compiled component index.js files`,
      );
    }

    const sourceMjsSkillScripts = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.split(/[\\/]/).includes("scripts") && file.endsWith(".mjs"),
    );
    assert.deepEqual(sourceMjsSkillScripts, [], "skill script source files should use TypeScript");

    const sourceAlternateSkillFiles = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      /[\\/]SKILL\.toon$/.test(file),
    );
    assert.deepEqual(sourceAlternateSkillFiles, [], "source skills should not keep alternate SKILL.toon artifacts");

    const sourceCrossPlatformInvocationHints = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith("index.ts") &&
      /Claude Code: `\/[A-Za-z0-9_-]+`；Codex: `\$[A-Za-z0-9_-]+`/u.test(readFileSync(file, "utf-8")),
    );
    assert.deepEqual(
      sourceCrossPlatformInvocationHints,
      [],
      "source skills should avoid hard-coded dual-platform invocation syntax",
    );

    const procedureUseIdReferences = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith("index.ts") &&
      /procedureUse\([A-Za-z_][A-Za-z0-9_]*\.id\b/.test(readFileSync(file, "utf-8")),
    );
    assert.deepEqual(
      procedureUseIdReferences,
      [],
      "skills should call procedureUse(exportedProcedure) so TypeScript can infer args/results",
    );

    const generatedTsSkillScripts = collectFiles(join(tmpDistDir, "claude/skills"), (file) =>
      file.split(/[\\/]/).includes("scripts") && file.endsWith(".ts"),
    );
    assert.deepEqual(generatedTsSkillScripts, [], "generated skill scripts should not copy TypeScript source files");

    for (const platform of ["claude", "codex"]) {
      const generatedAlternateSkillFiles = collectFiles(join(tmpDistDir, platform, "skills"), (file) =>
        /[\\/]SKILL\.toon$/.test(file),
      );
      assert.deepEqual(
        generatedAlternateSkillFiles,
        [],
        `${platform} skill dist should not include alternate SKILL.toon artifacts`,
      );

      const generatedPlatformMemoryFiles = collectFiles(join(tmpDistDir, platform, "skills"), (file) =>
        /[\\/](?:AGENTS|CLAUDE)\.md$/.test(file),
      );
      assert.deepEqual(
        generatedPlatformMemoryFiles,
        [],
        `${platform} skill dist should not include platform memory files inside skill packages`,
      );

      const generatedRootMetadataFiles = collectFiles(join(tmpDistDir, platform, "skills"), (file) => {
        const parts = file.slice(join(tmpDistDir, platform, "skills").length + 1).split(/[\\/]/);
        return parts.length === 2 && /^(?:_meta|metadata)\.json$/.test(parts[1] ?? "");
      });
      assert.deepEqual(
        generatedRootMetadataFiles,
        [],
        `${platform} skill dist should not include root provenance metadata files inside skill packages`,
      );
    }

    const legacySkillScriptRunners = collectFiles(join(tmpDistDir, "claude/skills"), (file) =>
      /[\\/]scripts[\\/]run\.mjs$/.test(file),
    );
    const legacySkillScriptManifests = collectFiles(join(tmpDistDir, "claude/skills"), (file) =>
      /[\\/]scripts[\\/]manifest\.json$/.test(file),
    );
    assert.deepEqual(legacySkillScriptRunners, [], "legacy per-skill scripts/run.mjs should not be generated");
    assert.deepEqual(legacySkillScriptManifests, [], "legacy per-skill scripts/manifest.json should not be generated");

    for (const platform of ["claude", "codex"]) {
      const legacyRuntimeScriptCommands: string[] = [];
      const leakedRuntimePlaceholders: string[] = [];
      const skillsRoot = join(tmpDistDir, platform, "skills");
      for (const markdownFile of collectFiles(skillsRoot, (file) => file.endsWith(".md"))) {
        const markdown = readFileSync(markdownFile, "utf-8");
        for (const match of markdown.matchAll(/\bnode\s+(?:\.\/)?scripts\/[A-Za-z0-9._/-]+\.mjs\b/gu)) {
          legacyRuntimeScriptCommands.push(`${markdownFile}: ${match[0]}`);
        }
        for (const match of markdown.matchAll(/<(?:runtime-root|skills-dir)>/gu)) {
          leakedRuntimePlaceholders.push(`${markdownFile}: ${match[0]}`);
        }
      }
      assert.deepEqual(
        legacyRuntimeScriptCommands,
        [],
        `${platform} Markdown should not reference legacy local scripts`,
      );
      assert.deepEqual(
        leakedRuntimePlaceholders,
        [],
        `${platform} Markdown should rewrite generated runtime path placeholders`,
      );

      const sourceProcedureEntrypointReferences: string[] = [];
      const pseudoProcedureCommands: string[] = [];
      for (const markdownFile of collectFiles(skillsRoot, (file) => file.endsWith(".md"))) {
        const markdown = readFileSync(markdownFile, "utf-8");
        if (/src\/components\/procedures\/sources/.test(markdown)) {
          sourceProcedureEntrypointReferences.push(markdownFile);
        }
        if (
          markdownFile.split(/[\\/]/).includes("references") &&
          /\bprocedure\s+`[a-z0-9-]+`/.test(markdown)
        ) {
          pseudoProcedureCommands.push(markdownFile);
        }
      }
      assert.deepEqual(
        sourceProcedureEntrypointReferences,
        [],
        `${platform} Markdown should not reference source-side procedure entrypoints`,
      );
      assert.deepEqual(
        pseudoProcedureCommands,
        [],
        `${platform} reference docs should point to generated procedure commands instead of pseudo procedure syntax`,
      );

      const staleAgentScriptCommands: string[] = [];
      const agentsRoot = join(tmpDistDir, platform, "agents");
      for (const agentFile of collectFiles(agentsRoot, (file) => /\.(?:md|toml)$/.test(file))) {
        const agentText = readFileSync(agentFile, "utf-8");
        for (const match of agentText.matchAll(/\b(?:node\s+)?scripts\/[A-Za-z0-9._/-]+\.mjs\b/gu)) {
          const prefix = agentText.slice(Math.max(0, (match.index ?? 0) - ".specify/".length), match.index);
          if (prefix === ".specify/") continue;
          staleAgentScriptCommands.push(`${agentFile}: ${match[0]}`);
        }
      }
      assert.deepEqual(
        staleAgentScriptCommands,
        [],
        `${platform} agents should reference procedures or skills instead of legacy repository scripts`,
      );
    }

    for (const platform of ["claude", "codex"]) {
      const platformProceduresSource = readFileSync(join(tmpDistDir, `${platform}/procedures.js`), "utf-8");
      const bundledTsModuleIds = [...platformProceduresSource.matchAll(/["'](\.\/src\/[^"']+\.ts)["']/gu)]
        .map((match) => match[1] ?? "");
      const nonComponentModuleIds = bundledTsModuleIds.filter(
        (moduleId) => !moduleId.startsWith("./src/components/"),
      );
      assert.doesNotMatch(
        platformProceduresSource,
        /\bnode\s+(?:\.\/)?scripts\/[A-Za-z0-9._/-]+\.mjs\b/,
        `${platform} bundled procedures.js should not suggest removed repository-local scripts`,
      );
      assert.deepEqual(
        nonComponentModuleIds,
        [],
        `${platform} bundled procedures.js should only include TypeScript modules from src/components`,
      );
      if (platform === "claude") {
        assert.match(
          platformProceduresSource,
          /skills\/skill-creator\/assets\/eval-viewer\/viewer\.html/,
          "Claude bundled procedures.js should load the registered skill-creator viewer asset",
        );
      } else {
        assert.doesNotMatch(
          platformProceduresSource,
          /skills\/skill-creator\/assets\/eval-viewer\/viewer\.html/,
          "Codex bundled procedures.js should not load custom skill-creator assets",
        );
      }
      assert.doesNotMatch(
        platformProceduresSource,
        /skills\/skill-creator\/eval-viewer\/viewer\.html/,
        `${platform} bundled procedures.js should not load stale loose skill-creator viewer paths`,
      );
    }

    const proceduresSource = readFileSync(join(tmpDistDir, "claude/procedures.js"), "utf-8");
    const codexProceduresSource = readFileSync(join(tmpDistDir, "codex/procedures.js"), "utf-8");
    const procedureRegistrySource = readFileSync(join(repoRoot, "src/components/procedures/registry.ts"), "utf-8");
    assert.doesNotMatch(procedureRegistrySource, /bundle:\s*false/);
    assert.match(proceduresSource, /^#!\/usr\/bin\/env node/);
    assert.match(proceduresSource, /__webpack_modules__/);
    assert.match(proceduresSource, /\bnode ~\/\.claude\/procedures\.js --procedure-id md-to-pdf-setup --trigger-skill md-to-pdf -- --install\b/);
    assert.match(
      proceduresSource,
      /Run this first: node ~\/\.claude\/procedures\.js --procedure-id remote-ssh-command-install-sshpass --trigger-skill remote-ssh-command\./,
    );
    assert.match(codexProceduresSource, /\bnode ~\/\.codex\/procedures\.js --procedure-id screenshot-take-screenshot --trigger-skill screenshot --/);
    assert.match(
      codexProceduresSource,
      /Run this first: node ~\/\.codex\/procedures\.js --procedure-id remote-ssh-command-install-sshpass --trigger-skill remote-ssh-command\./,
    );
    assert.doesNotMatch(proceduresSource, /\bnode \S*procedures\.js --procedure-id [a-z0-9-]+ -- --/);
    assert.doesNotMatch(codexProceduresSource, /\bnode \S*procedures\.js --procedure-id [a-z0-9-]+ -- --/);
    assert.match(codexProceduresSource, /const platform = "codex-cli"/);
    assert.match(
      codexProceduresSource,
      /homedir\)\(\),\s*"\.agents",\s*"skills",\s*skillId/,
      "codex bundled procedures should resolve skill owner roots from ~/.agents/skills",
    );
    assert.doesNotMatch(codexProceduresSource, /spawn\)\("claude"|spawn\("claude"/);
    assert.doesNotMatch(codexProceduresSource, /\.claude["']\s*,\s*["']skills|\.claude\/skills/);
    assert.doesNotMatch(codexProceduresSource, /\.codex["']\s*,\s*["']skills|\.codex\/skills/);
    assert.doesNotMatch(proceduresSource, /"source"\s*:/, "procedures.js should not embed procedure code as JSON strings");
    assert.doesNotMatch(proceduresSource, /procedure\.source|writeFileSync\(target/);
    assert.doesNotMatch(proceduresSource, /ai-components-|procedure-runtime-entry/);
    assert.doesNotMatch(proceduresSource, /\.globalThis\.__aiExperts/);
    for (const platform of ["claude", "codex"]) {
      const hookDispatchSource = readFileSync(join(tmpDistDir, `${platform}/hooks/dispatch.mjs`), "utf-8");
      assert.doesNotMatch(
        hookDispatchSource,
        /\bnode scripts\/(?:trigger-audit-report|skill-quality-report|hook-telemetry-report|audit-skill-evals)\.mjs\b/,
        `${platform} hooks should not suggest removed repository-local scripts`,
      );
      assert.doesNotMatch(
        hookDispatchSource,
        /\.ai-components/,
        `${platform} hooks should use ai-experts runtime state directories`,
      );
    }
    const distLocalImports = proceduresSource
      .split(/\r?\n/)
      .filter((line) => line.startsWith("import "))
      .filter((line) => /from ["']\.\.?\//.test(line));
    assert.deepEqual(
      distLocalImports,
      [],
      "bundled procedures.js should not import dist-local modules",
    );
  });

  test("wires hook dispatchers and runtime guard behaviors", () => {
    const claudeSettings = JSON.parse(readFileSync(join(tmpDistDir, "claude/settings.json"), "utf-8"));
    const codexHooksConfig = JSON.parse(readFileSync(join(tmpDistDir, "codex/hooks.json"), "utf-8"));
    const claudeHookCommand = claudeSettings.hooks.PostToolUse[0].hooks[0].command as string;
    const codexHookCommand = codexHooksConfig.hooks.PostToolUse[0].hooks[0].command as string;

    assert.equal(claudeSettings.hooks.UserPromptSubmit[0].hooks[0].type, "command");
    assert.match(claudeSettings.hooks.PostToolUse[0].matcher, /apply_patch/);
    assert.match(claudeHookCommand, /\$HOME\/\.claude\/hooks\/dispatch\.mjs/);
    assert.match(codexHookCommand, /\$HOME\/\.codex\/hooks\/dispatch\.mjs/);
    assert.doesNotMatch(claudeHookCommand, /:-/);
    assert.doesNotMatch(codexHookCommand, /:-/);
    assertSingleDispatcherHookGroups(claudeSettings, "claude settings");
    assertSingleDispatcherHookGroups(codexHooksConfig, "codex hooks");
    assert.equal(claudeSettings.hooks.PostToolUse[0].hooks.length, 1);
    assert.equal(codexHooksConfig.hooks.PostToolUse[0].hooks.length, 1);

    const codexConfig = readFileSync(join(tmpDistDir, "codex/config.toml"), "utf-8");
    assert.match(codexConfig, /codex_hooks = true/);

    const claudeHookManifest = JSON.parse(readFileSync(join(tmpDistDir, "claude/hooks/manifest.json"), "utf-8"));
    const hookManifest = JSON.parse(readFileSync(join(tmpDistDir, "codex/hooks/manifest.json"), "utf-8"));
    assertHookGroupTimeoutsMatchManifest(claudeSettings, claudeHookManifest, "claude settings");
    assertHookGroupTimeoutsMatchManifest(codexHooksConfig, hookManifest, "codex hooks");
    assert.equal(hookManifest.hooks.some((hook: any) => hook.id === "component-routing-reminder"), true);
    assert.equal(hookManifest.hooks.some((hook: any) => hook.id === "dangerous-command-guard"), true);
    assert.equal(
      hookManifest.hooks.some((hook: any) => hook.event === "PreCompact"),
      false,
      "Codex hooks should only include events supported by the current Codex hooks contract",
    );
    assert.equal(existsSync(join(tmpDistDir, "claude/hooks/dispatch.mjs")), true);
    assert.equal(existsSync(join(tmpDistDir, "codex/hooks/dispatch.mjs")), true);
    assert.equal(existsSync(join(tmpDistDir, "claude/hooks/modules")), false);
    assert.equal(existsSync(join(tmpDistDir, "codex/hooks/modules")), false);
    assert.equal(hookManifest.hooks.some((hook: any) => "module" in hook), false);
    assert.equal(hookManifest.hooks.some((hook: any) => "payloadMode" in hook), false);
    const legacyHookNamingPattern = /(?:^|["/_.-])(?:expert|plugin)(?:["/_.-]|$)/;
    assert.equal(hookManifest.hooks.some((hook: any) => legacyHookNamingPattern.test(hook.id)), false);
    assert.doesNotMatch(readFileSync(join(tmpDistDir, "claude/hooks/dispatch.mjs"), "utf-8"), legacyHookNamingPattern);
    assert.doesNotMatch(readFileSync(join(tmpDistDir, "codex/hooks/dispatch.mjs"), "utf-8"), legacyHookNamingPattern);

    const reminderOutput = execFileSync(
      process.execPath,
      [join(tmpDistDir, "claude/hooks/dispatch.mjs"), "--event", "UserPromptSubmit"],
      {
        cwd: repoRoot,
        input: JSON.stringify({ prompt: "请检查 dist/claude 的 hooks" }),
        encoding: "utf-8",
      },
    );
    assert.match(reminderOutput, /additionalContext/);
    assert.match(reminderOutput, /src\/components/);

    const ignoredSecretPathOnBashOutput = execFileSync(
      process.execPath,
      [join(tmpDistDir, "claude/hooks/dispatch.mjs"), "--event", "PreToolUse"],
      {
        cwd: repoRoot,
        input: JSON.stringify({
          tool_name: "Bash",
          tool_input: { command: "echo ok", file_path: ".env" },
        }),
        encoding: "utf-8",
      },
    );
    assert.equal(
      ignoredSecretPathOnBashOutput.trim(),
      "",
      "Bash matcher should not run Edit/Write secret path hooks",
    );

    const secretWriteOutput = execFileSync(
      process.execPath,
      [join(tmpDistDir, "claude/hooks/dispatch.mjs"), "--event", "PreToolUse"],
      {
        cwd: repoRoot,
        input: JSON.stringify({
          tool_name: "Write",
          tool_input: { file_path: ".env", content: "API_KEY=test" },
        }),
        encoding: "utf-8",
      },
    );
    assert.match(secretWriteOutput, /"decision": "block"/);
    assert.match(secretWriteOutput, /Secret Write Guard/);

    const codexSecretWriteOutput = execFileSync(
      process.execPath,
      [join(tmpDistDir, "codex/hooks/dispatch.mjs"), "--event", "PreToolUse"],
      {
        cwd: repoRoot,
        input: JSON.stringify({
          toolName: "Write",
          toolInput: { filePath: ".env", content: "API_KEY=test" },
        }),
        encoding: "utf-8",
      },
    );
    assert.match(codexSecretWriteOutput, /"decision": "block"/);
    assert.match(codexSecretWriteOutput, /Secret Write Guard/);

    const patchSecretWriteOutput = execFileSync(
      process.execPath,
      [join(tmpDistDir, "codex/hooks/dispatch.mjs"), "--event", "PreToolUse"],
      {
        cwd: repoRoot,
        input: JSON.stringify({
          tool_name: "apply_patch",
          tool_input: {
            command: [
              "*** Begin Patch",
              "*** Update File: config/example.env",
              "*** Move to: .env",
              "+API_KEY=test",
              "*** End Patch",
            ].join("\n"),
          },
        }),
        encoding: "utf-8",
      },
    );
    assert.match(patchSecretWriteOutput, /"decision": "block"/);
    assert.match(patchSecretWriteOutput, /Secret Write Guard/);

    const dangerousCommandOutput = execFileSync(
      process.execPath,
      [join(tmpDistDir, "codex/hooks/dispatch.mjs"), "--event", "PreToolUse"],
      {
        cwd: repoRoot,
        input: JSON.stringify({
          toolName: "Bash",
          toolInput: { command: "rm -rf /" },
        }),
        encoding: "utf-8",
      },
    );
    assert.match(dangerousCommandOutput, /"decision": "block"/);
    assert.match(dangerousCommandOutput, /Dangerous Command/);

    const guardOutput = execFileSync(
      process.execPath,
      [join(tmpDistDir, "codex/hooks/dispatch.mjs"), "--event", "PostToolUse"],
      {
        cwd: repoRoot,
        input: JSON.stringify({
          tool_name: "apply_patch",
          tool_input: { command: "*** Update File: dist/claude/CLAUDE.md\n" },
        }),
        encoding: "utf-8",
      },
    );
    assert.match(guardOutput, /additionalContext/);
    assert.match(guardOutput, /Generated dist output/);

    const stalePlatformArgResult = spawnSync(
      process.execPath,
      [join(tmpDistDir, "codex/hooks/dispatch.mjs"), "--platform", "codex-cli", "--event", "PreToolUse"],
      {
        cwd: repoRoot,
        input: "{}",
        encoding: "utf-8",
      },
    );
    assert.notEqual(stalePlatformArgResult.status, 0);
    assert.match(stalePlatformArgResult.stderr, /Unknown argument: --platform/);
  });

  test("renders generated skill markdown sections and excludes eval references", () => {
    for (const platform of ["claude", "codex"]) {
      const generatedEvalsReferences = collectFiles(join(tmpDistDir, platform, "skills"), (file) =>
        file.includes(join("references", "evals")),
      );
      assert.equal(
        generatedEvalsReferences.length,
        0,
        `${platform} output should not copy evals under references`,
      );

      const brokenLocalLinks: string[] = [];
      const runtimeMarkdownFiles = collectFiles(join(tmpDistDir, platform, "skills"), (file) =>
        file.endsWith(".md"),
      );
      for (const markdownFile of runtimeMarkdownFiles) {
        const markdown = stripMarkdownCode(readFileSync(markdownFile, "utf-8"));
        for (const match of markdown.matchAll(/!?\[[^\]\n]*\]\(([^)\n]+)\)/gu)) {
          const href = markdownDestination(match[1] as string);
          if (/^[a-z][a-z0-9+.-]*:|^#|^\//iu.test(href)) continue;
          const [pathWithoutAnchor] = href.split("#", 1);
          if (pathWithoutAnchor && !existsSync(resolve(dirname(markdownFile), pathWithoutAnchor))) {
            brokenLocalLinks.push(`${markdownFile}: ${href}`);
          }
        }
      }
      assert.deepEqual(brokenLocalLinks, [], `${platform} generated Markdown should not contain broken local links`);

      for (const skillFile of collectFiles(join(tmpDistDir, platform, "skills"), (file) => file.endsWith("SKILL.md"))) {
        const source = stripFrontmatter(readFileSync(skillFile, "utf-8")).trimStart();
        assert.match(source, /^#\s+\S/, `${skillFile} should render an H1 heading from fullName`);
        assert.match(
          source,
          /^#\s+.+\r?\n\r?\n## 适用场景\r?\n[\s\S]*?\r?\n## 核心约束\r?\n/m,
          `${skillFile} should render useCases and constraints immediately after the H1 heading`,
        );
        assert.equal(countH2OutsideCodeFence(source, "适用场景"), 1, `${skillFile} should render exactly one useCases section`);
        assert.equal(countH2OutsideCodeFence(source, "核心约束"), 1, `${skillFile} should render exactly one constraints section`);
        assert.equal(countH2OutsideCodeFence(source, "目标"), 0, `${skillFile} should not render a generic route-style goal section`);

        if (source.includes("## 相关 Skill")) {
          assert.match(
            source,
            /^## 相关 Skill\r?\n\r?\n- \[[^\]]+\]\(\.\.\/[^)]+\/SKILL\.md\) — \S/m,
            `${skillFile} should render relatedSkills as generated skill links`,
          );
        }

        if (countH2OutsideCodeFence(source, "检查清单") > 0) {
          assert.match(source, /^## 检查清单\r?\n\r?\n- \[ \] \S/m, `${skillFile} should render checklist as generated checkbox items`);
          assert.equal(countH2OutsideCodeFence(source, "检查清单"), 1, `${skillFile} should render exactly one checklist section`);
        }

        if (countH2OutsideCodeFence(source, "反模式") > 0) {
          assert.match(
            source,
            /^## 反模式\r?\n\r?\n\| 反模式 \| 正确做法 \|\r?\n\|--------\|----------\|\r?\n\| .+ \| .+ \|/m,
            `${skillFile} should render antiPatterns as a generated markdown table`,
          );
          assert.equal(countH2OutsideCodeFence(source, "反模式"), 1, `${skillFile} should render exactly one anti-pattern section`);
          if (source.includes("## 检查清单")) {
            assert.ok(
              source.indexOf("## 反模式") < source.indexOf("## 检查清单"),
              `${skillFile} should render antiPatterns before checklist`,
            );
          }
          if (source.includes("## 相关 Skill")) {
            assert.ok(
              source.indexOf("## 相关 Skill") > source.indexOf("## 反模式"),
              `${skillFile} should render relatedSkills after antiPatterns`,
            );
          }
        }

        if (source.includes("## Reference Map") && source.includes("## 相关 Skill")) {
          assert.ok(
            source.indexOf("## Reference Map") < source.indexOf("## 相关 Skill"),
            `${skillFile} should render Reference Map before relatedSkills`,
          );
        }
      }
    }
  });
});
