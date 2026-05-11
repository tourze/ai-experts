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

export function registerComponentBuildMarkdownLinkTests(): void {
  test("renders directory references through generated index.md entry files", () => {
    for (const platform of [Platform.Claude, Platform.Codex]) {
      for (const skill of registry.skills.filter((entry) => entry.platforms.includes(platform))) {
        const directoryReferences = (skill.references ?? []).filter((reference) =>
          statSync(toAbsolutePath(reference.source)).isDirectory()
        );
        if (directoryReferences.length === 0) continue;

        const platformDir = platform === Platform.Claude ? "claude" : "codex";
        const skillRoot = join(getTmpDistDir(), platformDir, "skills", skill.id);
        const skillMarkdown = readFileSync(join(skillRoot, "SKILL.md"), "utf-8");
        const referencesIndex = readFileSync(join(skillRoot, "references", "index.md"), "utf-8");

        for (const reference of directoryReferences) {
          const entryTarget = referenceDirectoryIndexTarget(reference);
          const referenceIndexLink = entryTarget.startsWith("references/")
            ? entryTarget.slice("references/".length)
            : entryTarget;
          assert.match(
            skillMarkdown,
            new RegExp(`\\[${escapeRegExp(reference.id)}\\]\\(${escapeRegExp(entryTarget)}\\)`, "u"),
            `${platformDir}/${skill.id} should link directory reference ${reference.id} to ${entryTarget}`,
          );
          assert.match(
            referencesIndex,
            new RegExp(`\\[${escapeRegExp(reference.id)}\\]\\(${escapeRegExp(referenceIndexLink)}\\)`, "u"),
            `${platformDir}/${skill.id} references/index.md should link ${reference.id} to ${referenceIndexLink}`,
          );
          assert.equal(
            existsSync(join(skillRoot, entryTarget)),
            true,
            `${platformDir}/${skill.id} should emit directory reference entry file ${entryTarget}`,
          );
        }
      }
    }
  });

  test("renders generated skill markdown sections and excludes eval references", () => {
    for (const platform of ["claude", "codex"]) {
      const generatedEvalsReferences = collectFiles(join(getTmpDistDir(), platform, "skills"), (file) =>
        file.includes(join("references", "evals")),
      );
      assert.equal(
        generatedEvalsReferences.length,
        0,
        `${platform} output should not copy evals under references`,
      );

      const brokenLocalLinks: string[] = [];
      const directoryLinks: string[] = [];
      const missingReferenceDefinitions: string[] = [];
      const runtimeMarkdownFiles = collectFiles(join(getTmpDistDir(), platform, "skills"), (file) =>
        file.endsWith(".md"),
      );
      for (const markdownFile of runtimeMarkdownFiles) {
        const markdown = stripMarkdownCode(readFileSync(markdownFile, "utf-8"));
        const definedLabels = new Set<string>();
        const usedLabels = new Set<string>();

        for (const match of markdown.matchAll(/^\s*\[([^\]\n]+)\]:\s+([^\n]+)$/gmu)) {
          definedLabels.add(normalizeMarkdownReferenceLabel(match[1] ?? ""));
        }

        for (const match of markdown.matchAll(/(?<!!)\[[^\]\n]+\]\[([^\]\n]+)\]/gu)) {
          usedLabels.add(normalizeMarkdownReferenceLabel(match[1] ?? ""));
        }

        for (const match of markdown.matchAll(/(?<!!)\[([^\]\n]+)\]\[\]/gu)) {
          usedLabels.add(normalizeMarkdownReferenceLabel(match[1] ?? ""));
        }

        for (const match of markdown.matchAll(/!?\[[^\]\n]*\]\(([^)\n]+)\)/gu)) {
          const href = markdownDestination(match[1] as string);
          if (/^[a-z][a-z0-9+.-]*:|^#|^\//iu.test(href)) continue;
          const [pathWithoutAnchor] = href.split("#", 1);
          if (pathWithoutAnchor && !existsSync(resolve(dirname(markdownFile), pathWithoutAnchor))) {
            brokenLocalLinks.push(`${markdownFile}: ${href}`);
          } else if (pathWithoutAnchor) {
            const resolvedPath = resolve(dirname(markdownFile), pathWithoutAnchor);
            if (statSync(resolvedPath).isDirectory()) {
              directoryLinks.push(`${markdownFile}: ${href}`);
            }
          }
        }
        for (const match of markdown.matchAll(/^\s*\[([^\]\n]+)\]:\s+([^\n]+)$/gmu)) {
          const label = (match[1] ?? "").trim();
          if (label.startsWith("^")) continue;
          const href = markdownDestination(match[2] as string);
          if (/^[a-z][a-z0-9+.-]*:|^#|^\//iu.test(href) || !isLikelyLocalDefinitionPath(href)) continue;
          const [pathWithoutAnchor] = href.split("#", 1);
          if (pathWithoutAnchor && !existsSync(resolve(dirname(markdownFile), pathWithoutAnchor))) {
            brokenLocalLinks.push(`${markdownFile}: [${label}] -> ${href}`);
          } else if (pathWithoutAnchor) {
            const resolvedPath = resolve(dirname(markdownFile), pathWithoutAnchor);
            if (statSync(resolvedPath).isDirectory()) {
              directoryLinks.push(`${markdownFile}: [${label}] -> ${href}`);
            }
          }
        }

        for (const label of usedLabels) {
          if (!label || label.startsWith("^")) continue;
          if (!definedLabels.has(label)) {
            missingReferenceDefinitions.push(`${markdownFile}: [${label}]`);
          }
        }
      }
      assert.deepEqual(brokenLocalLinks, [], `${platform} generated Markdown should not contain broken local links`);
      assert.deepEqual(
        missingReferenceDefinitions,
        [],
        `${platform} generated Markdown should define every used reference-style link label`,
      );
      assert.deepEqual(directoryLinks, [], `${platform} generated Markdown should not link local directories directly`);

      const skillIds = new Set(
        readdirSync(join(getTmpDistDir(), platform, "skills"), { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name),
      );
      const skillH1Cache = new Map<string, string>();
      const getSkillH1 = (skillId: string): string => {
        const cached = skillH1Cache.get(skillId);
        if (cached) return cached;
        const skillMdPath = join(getTmpDistDir(), platform, "skills", skillId, "SKILL.md");
        if (!existsSync(skillMdPath)) return skillId;
        const md = stripFrontmatter(readFileSync(skillMdPath, "utf-8"));
        const h1Match = md.match(/^#\s+(.+)/m);
        const h1 = h1Match ? h1Match[1].trim() : skillId;
        skillH1Cache.set(skillId, h1);
        return h1;
      };
      const misleadingSkillLinks: string[] = [];
      for (const markdownFile of runtimeMarkdownFiles) {
        const markdown = stripMarkdownCode(readFileSync(markdownFile, "utf-8"));
        for (const match of markdown.matchAll(/(?<!!)\[([^\]\n]+)\]\(([^)\n]+)\)/gu)) {
          const label = (match[1] ?? "").trim();
          const href = markdownDestination(match[2] as string);
          if (/^[a-z][a-z0-9+.-]*:|^#|^\//iu.test(href) || !isLikelyLocalDefinitionPath(href)) continue;

          const [pathWithoutAnchor] = href.split("#", 1);
          if (!pathWithoutAnchor) continue;
          const resolvedPath = resolve(dirname(markdownFile), pathWithoutAnchor);
          const targetSkillMatch = resolvedPath.match(/[/\\]skills[/\\]([^/\\]+)[/\\]SKILL\.md$/u);

          if (targetSkillMatch) {
            const targetSkillId = targetSkillMatch[1] ?? "";
            if (label !== targetSkillId && label !== getSkillH1(targetSkillId)) {
              misleadingSkillLinks.push(`${markdownFile}: [${label}] -> ${href} targets ${targetSkillId}`);
            }
          } else if (skillIds.has(label)) {
            misleadingSkillLinks.push(`${markdownFile}: [${label}] -> ${href} labels a skill but targets a reference`);
          }
        }
      }
      assert.deepEqual(
        misleadingSkillLinks,
        [],
        `${platform} generated Markdown skill links should use the target skill fullName as the label`,
      );

      for (const skillFile of collectFiles(join(getTmpDistDir(), platform, "skills"), (file) => file.endsWith("SKILL.md"))) {
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

  test("generated dist markdown local links resolve across each platform root", () => {
    for (const platform of ["claude", "codex"]) {
      const markdownFiles = collectFiles(join(getTmpDistDir(), platform), (file) => file.endsWith(".md"));
      const brokenLocalLinks: string[] = [];
      const directoryLinks: string[] = [];
      const brokenAnchors: string[] = [];
      const anchorCache = new Map<string, Set<string>>();

      const checkAnchor = (markdownFile: string, href: string, resolvedPath: string): void => {
        const hashIndex = href.indexOf("#");
        if (hashIndex === -1 || !href.slice(hashIndex + 1) || !resolvedPath.endsWith(".md")) return;
        let targetAnchors = anchorCache.get(resolvedPath);
        if (!targetAnchors) {
          targetAnchors = collectMarkdownAnchors(readFileSync(resolvedPath, "utf-8"));
          anchorCache.set(resolvedPath, targetAnchors);
        }

        const target = decodeMarkdownAnchor(href.slice(hashIndex + 1)).toLowerCase();
        if (!targetAnchors.has(target)) {
          brokenAnchors.push(`${markdownFile}: ${href} missing #${target}`);
        }
      };

      for (const markdownFile of markdownFiles) {
        const markdown = stripMarkdownCode(readFileSync(markdownFile, "utf-8"));

        for (const match of markdown.matchAll(/!?\[[^\]\n]*\]\(([^)\n]+)\)/gu)) {
          const href = markdownDestination(match[1] as string);
          if (href.startsWith("#")) {
            checkAnchor(markdownFile, href, markdownFile);
            continue;
          }
          if (/^[a-z][a-z0-9+.-]*:|^\//iu.test(href)) continue;
          const [pathWithoutAnchor] = href.split("#", 1);
          if (!pathWithoutAnchor) continue;
          const resolvedPath = resolve(dirname(markdownFile), pathWithoutAnchor);
          if (!existsSync(resolvedPath)) {
            brokenLocalLinks.push(`${markdownFile}: ${href}`);
          } else if (statSync(resolvedPath).isDirectory()) {
            directoryLinks.push(`${markdownFile}: ${href}`);
          } else {
            checkAnchor(markdownFile, href, resolvedPath);
          }
        }

        for (const match of markdown.matchAll(/^\s*\[([^\]\n]+)\]:\s+([^\n]+)$/gmu)) {
          const label = (match[1] ?? "").trim();
          if (label.startsWith("^")) continue;
          const href = markdownDestination(match[2] as string);
          if (href.startsWith("#")) {
            checkAnchor(markdownFile, `[${label}] -> ${href}`, markdownFile);
            continue;
          }
          if (/^[a-z][a-z0-9+.-]*:|^\//iu.test(href) || !isLikelyLocalDefinitionPath(href)) continue;
          const [pathWithoutAnchor] = href.split("#", 1);
          if (!pathWithoutAnchor) continue;
          const resolvedPath = resolve(dirname(markdownFile), pathWithoutAnchor);
          if (!existsSync(resolvedPath)) {
            brokenLocalLinks.push(`${markdownFile}: [${label}] -> ${href}`);
          } else if (statSync(resolvedPath).isDirectory()) {
            directoryLinks.push(`${markdownFile}: [${label}] -> ${href}`);
          } else {
            checkAnchor(markdownFile, `[${label}] -> ${href}`, resolvedPath);
          }
        }
      }

      assert.deepEqual(
        brokenLocalLinks,
        [],
        `${platform} generated Markdown should not contain broken local links`,
      );
      assert.deepEqual(
        directoryLinks,
        [],
        `${platform} generated Markdown should not link local directories directly`,
      );
      assert.deepEqual(
        brokenAnchors,
        [],
        `${platform} generated Markdown anchors should match generated heading slugs or explicit HTML anchors`,
      );
    }
  });
}
