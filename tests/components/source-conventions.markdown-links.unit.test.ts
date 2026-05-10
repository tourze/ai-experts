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


describe("component source markdown link conventions", () => {
  test("skill markdown sources avoid angle-bracket TODO placeholders", () => {
    const skillMarkdownSources = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(".md"),
    );

    for (const sourceFile of skillMarkdownSources) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /<TODO\b/iu,
        `${sourceFile} should avoid shipping raw <TODO ...> placeholders in runtime guidance`,
      );
    }
  });

  test("skill markdown sources avoid bare current-directory links", () => {
    const skillMarkdownSources = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(".md"),
    );

    for (const sourceFile of skillMarkdownSources) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /\]\(\.\)/u,
        `${sourceFile} should avoid bare (.) links; use a concrete file path or plain text`,
      );
    }
  });

  test("component sources avoid references root directory links", () => {
    const componentRuntimeDocs = [
      ...collectFiles(
        join(repoRoot, "src/components/skills"),
        (file) => (file.endsWith(".ts") || file.endsWith(".md")) && !file.split(/[\\/]/).includes("evals"),
      ),
      ...collectFiles(join(repoRoot, "src/components/agents"), (file) => file.endsWith(".ts")),
      ...collectFiles(join(repoRoot, "src/components/hooks"), (file) => file.endsWith(".ts")),
    ];

    for (const sourceFile of componentRuntimeDocs) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /\]\((?:\.\/)?references\/\)/u,
        `${sourceFile} should link concrete reference files instead of references/ directory roots`,
      );
    }
  });

  test("skill markdown sources define every used reference-style label", () => {
    const missingDefinitions: string[] = [];
    const skillMarkdownSources = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(".md"),
    );

    for (const sourceFile of skillMarkdownSources) {
      const source = stripMarkdownCode(readFileSync(sourceFile, "utf-8"));
      const definedLabels = new Set<string>();
      const usedLabels = new Set<string>();

      for (const match of source.matchAll(/^\s*\[([^\]\n]+)\]:\s+(\S+)/gmu)) {
        definedLabels.add(normalizeMarkdownReferenceLabel(match[1] ?? ""));
      }

      for (const match of source.matchAll(/(?<!!)\[[^\]\n]+\]\[([^\]\n]+)\]/gu)) {
        usedLabels.add(normalizeMarkdownReferenceLabel(match[1] ?? ""));
      }

      for (const match of source.matchAll(/(?<!!)\[([^\]\n]+)\]\[\]/gu)) {
        usedLabels.add(normalizeMarkdownReferenceLabel(match[1] ?? ""));
      }

      for (const label of usedLabels) {
        if (!label || label.startsWith("^")) continue;
        if (!definedLabels.has(label)) {
          missingDefinitions.push(`${relative(repoRoot, sourceFile)}: [${label}]`);
        }
      }
    }

    assert.deepEqual(
      missingDefinitions,
      [],
      "skill markdown reference-style links should define every used label",
    );
  });

  test("skill root readme/license links stay within skill root", () => {
    const skillRoot = join(repoRoot, "src/components/skills");
    const escapedRootLinks: string[] = [];
    const missingLocalLinks: string[] = [];

    for (const skillEntry of readdirSync(skillRoot, { withFileTypes: true })) {
      if (!skillEntry.isDirectory()) continue;
      const skillDir = join(skillRoot, skillEntry.name);
      for (const fileName of ["README.md", "LICENSE.txt"]) {
        const sourceFile = join(skillDir, fileName);
        if (!existsSync(sourceFile)) continue;
        const source = stripMarkdownCode(readFileSync(sourceFile, "utf-8"));
        for (const match of source.matchAll(/(!?)\[[^\]\n]+\]\(([^)\n]+)\)/gu)) {
          if (match[1] === "!") continue;
          const targetPath = localMarkdownPath(markdownDestination(match[2] ?? ""));
          if (!targetPath || !/^\.\.?\//u.test(targetPath)) continue;
          const resolvedTarget = resolve(dirname(sourceFile), targetPath);
          if (!resolvedTarget.startsWith(`${skillDir}/`) && resolvedTarget !== skillDir) {
            escapedRootLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
            continue;
          }
          if (!existsSync(resolvedTarget)) {
            missingLocalLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
          }
        }
        for (const match of source.matchAll(/^\s*\[[^\]\n]+\]:\s+(\S+)/gmu)) {
          const targetPath = localMarkdownPath(markdownDestination(match[1] ?? ""));
          if (!targetPath || !/^\.\.?\//u.test(targetPath)) continue;
          const resolvedTarget = resolve(dirname(sourceFile), targetPath);
          if (!resolvedTarget.startsWith(`${skillDir}/`) && resolvedTarget !== skillDir) {
            escapedRootLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
            continue;
          }
          if (!existsSync(resolvedTarget)) {
            missingLocalLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
          }
        }
      }
    }

    assert.deepEqual(
      escapedRootLinks,
      [],
      "skill root README/LICENSE local links should not escape the skill root; these docs are copied with the skill package",
    );
    assert.deepEqual(
      missingLocalLinks,
      [],
      "skill root README/LICENSE local links should point to files that exist in the same skill package",
    );
  });

  test("skill reference markdown links are relative to their file location", () => {
    const rootRelativeLinks: string[] = [];
    const referenceMarkdownSources = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(".md") && file.split(/[\\/]/).includes("references"),
    );

    for (const sourceFile of referenceMarkdownSources) {
      const source = stripMarkdownCode(readFileSync(sourceFile, "utf-8"));
      for (const match of source.matchAll(/(!?)\[[^\]\n]+\]\(([^)\n]+)\)/gu)) {
        if (match[1] === "!") continue;
        const targetPath = localMarkdownPath(markdownDestination(match[2] ?? ""));
        if (!targetPath) continue;
        if (
          /^(?:\.\/)?(?:references|assets)\//u.test(targetPath) ||
          /(?:^|\/)mermaid_diagrams\//u.test(targetPath)
        ) {
          rootRelativeLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
        }
      }

      for (const match of source.matchAll(/^\s*\[[^\]\n]+\]:\s+(\S+)/gmu)) {
        const targetPath = localMarkdownPath(markdownDestination(match[1] ?? ""));
        if (!targetPath) continue;
        if (
          /^(?:\.\/)?(?:references|assets)\//u.test(targetPath) ||
          /(?:^|\/)mermaid_diagrams\//u.test(targetPath)
        ) {
          rootRelativeLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
        }
      }
    }

    assert.deepEqual(
      rootRelativeLinks,
      [],
      "reference Markdown is copied into references/, so links to packaged references/assets must be relative from the current file",
    );
  });

  test("component markdown sources do not link local directories directly", () => {
    const directoryLinks: string[] = [];
    const markdownSources = collectFiles(join(repoRoot, "src/components"), (file) =>
      file.endsWith(".md") && !file.split(/[\\/]/).includes("evals"),
    );

    for (const sourceFile of markdownSources) {
      const source = stripMarkdownCode(readFileSync(sourceFile, "utf-8"));
      for (const match of source.matchAll(/(!?)\[[^\]\n]+\]\(([^)\n]+)\)/gu)) {
        if (match[1] === "!") continue;
        const targetPath = localMarkdownPath(markdownDestination(match[2] ?? ""));
        if (!targetPath) continue;
        const resolvedTarget = resolve(dirname(sourceFile), targetPath);
        if (existsSync(resolvedTarget) && lstatSync(resolvedTarget).isDirectory()) {
          directoryLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
        }
      }

      for (const match of source.matchAll(/^\s*\[[^\]\n]+\]:\s+(\S+)/gmu)) {
        const targetPath = localMarkdownPath(markdownDestination(match[1] ?? ""));
        if (!targetPath) continue;
        const resolvedTarget = resolve(dirname(sourceFile), targetPath);
        if (existsSync(resolvedTarget) && lstatSync(resolvedTarget).isDirectory()) {
          directoryLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
        }
      }
    }

    assert.deepEqual(
      directoryLinks,
      [],
      "component Markdown should link concrete files instead of local directories",
    );
  });

  test("component markdown local file links resolve in source tree", () => {
    const missingLocalLinks: string[] = [];
    const markdownSources = collectFiles(join(repoRoot, "src/components"), (file) =>
      file.endsWith(".md") && !file.split(/[\\/]/).includes("evals"),
    );

    const isGeneratedSkillLink = (targetPath: string): boolean =>
      targetPath === "SKILL.md" || targetPath.endsWith("/SKILL.md");

    for (const sourceFile of markdownSources) {
      const source = stripMarkdownCode(readFileSync(sourceFile, "utf-8"));

      for (const match of source.matchAll(/(!?)\[[^\]\n]+\]\(([^)\n]+)\)/gu)) {
        if (match[1] === "!") continue;
        const targetPath = localMarkdownPath(markdownDestination(match[2] ?? ""));
        if (!targetPath || isGeneratedSkillLink(targetPath)) continue;
        if (!existsSync(resolve(dirname(sourceFile), targetPath))) {
          missingLocalLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
        }
      }

      for (const match of source.matchAll(/^\s*\[[^\]\n]+\]:\s+([^\n]+)$/gmu)) {
        const destination = markdownDestination(match[1] ?? "");
        if (!isLikelyLocalDefinitionPath(destination)) continue;
        const targetPath = localMarkdownPath(destination);
        if (!targetPath || isGeneratedSkillLink(targetPath)) continue;
        if (!existsSync(resolve(dirname(sourceFile), targetPath))) {
          missingLocalLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
        }
      }
    }

    assert.deepEqual(
      missingLocalLinks,
      [],
      "component Markdown local file links should resolve from source files",
    );
  });

  test("skill reference markdown uses paths relative to the packaged reference file", () => {
    const nestedReferenceLinks: string[] = [];
    const skillSourceRoot = join(repoRoot, "src/components/skills");
    const referenceMarkdownSources = collectFiles(skillSourceRoot, (file) =>
      file.endsWith(".md") && file.split(/[\\/]/).includes("references"),
    );

    for (const sourceFile of referenceMarkdownSources) {
      const source = readFileSync(sourceFile, "utf-8");
      for (const match of source.matchAll(/\[[^\]\n]+\]\((references\/[^)\n]+)\)/gu)) {
        nestedReferenceLinks.push(`${relative(repoRoot, sourceFile)}: ${match[1]}`);
      }
    }

    assert.deepEqual(
      nestedReferenceLinks,
      [],
      "reference Markdown is copied into references/, so same-skill reference links should omit a leading references/ prefix",
    );
  });

  test("skill reference markdown links to generated skills only for registered skill sources", () => {
    const missingSkillLinks: string[] = [];
    const skillSourceRoot = join(repoRoot, "src/components/skills");
    const referenceMarkdownSources = collectFiles(skillSourceRoot, (file) =>
      file.endsWith(".md") && file.split(/[\\/]/).includes("references"),
    );

    for (const sourceFile of referenceMarkdownSources) {
      const source = stripMarkdownCode(readFileSync(sourceFile, "utf-8"));
      const collectSkillLinkTarget = (targetPath: string | null): void => {
        if (!targetPath) return;
        if (targetPath !== "../SKILL.md" && targetPath !== "./SKILL.md" && !targetPath.endsWith("/SKILL.md")) {
          return;
        }

        const targetSkillDir = dirname(resolve(dirname(sourceFile), targetPath));
        const relativeSkillDir = relative(skillSourceRoot, targetSkillDir);
        if (relativeSkillDir === "" || relativeSkillDir.startsWith("..")) return;
        if (!existsSync(join(targetSkillDir, "index.ts"))) {
          missingSkillLinks.push(`${relative(repoRoot, sourceFile)}: ${targetPath}`);
        }
      };

      for (const match of source.matchAll(/(!?)\[[^\]\n]+\]\(([^)\n]+)\)/gu)) {
        if (match[1] === "!") continue;
        collectSkillLinkTarget(localMarkdownPath(markdownDestination(match[2] ?? "")));
      }

      for (const match of source.matchAll(/^\s*\[[^\]\n]+\]:\s+(\S+)/gmu)) {
        collectSkillLinkTarget(localMarkdownPath(markdownDestination(match[1] ?? "")));
      }
    }

    assert.deepEqual(
      missingSkillLinks,
      [],
      "reference Markdown should not link to legacy sub-skill/plugin SKILL.md paths; link the real reference file or use plain text",
    );
  });

  test("skill markdown labels generated skill links with the target skill id", () => {
    const misleadingSkillLinks: string[] = [];
    const skillSourceRoot = join(repoRoot, "src/components/skills");
    const skillIds = new Set(registry.skills.map((skill) => skill.id));
    const skillMarkdownSources = collectFiles(skillSourceRoot, (file) =>
      file.endsWith(".md") && !file.split(/[\\/]/).includes("evals"),
    );

    const collectSkillLinkTarget = (sourceFile: string, label: string, targetPath: string | null): void => {
      if (!targetPath || (targetPath !== "SKILL.md" && !targetPath.endsWith("/SKILL.md"))) return;

      const targetSkillDir = dirname(resolve(dirname(sourceFile), targetPath));
      const relativeSkillDir = relative(skillSourceRoot, targetSkillDir);
      if (relativeSkillDir === "" || relativeSkillDir.startsWith("..")) return;
      const targetSkillId = relativeSkillDir.split(/[\\/]/)[0] ?? "";
      if (!skillIds.has(targetSkillId) || !existsSync(join(targetSkillDir, "index.ts"))) return;
      if (label !== targetSkillId) {
        misleadingSkillLinks.push(`${relative(repoRoot, sourceFile)}: [${label}] -> ${targetPath} targets ${targetSkillId}`);
      }
    };

    for (const sourceFile of skillMarkdownSources) {
      const source = stripMarkdownCode(readFileSync(sourceFile, "utf-8"));
      for (const match of source.matchAll(/(?<!!)\[([^\]\n]+)\]\(([^)\n]+)\)/gu)) {
        collectSkillLinkTarget(
          sourceFile,
          (match[1] ?? "").trim(),
          localMarkdownPath(markdownDestination(match[2] ?? "")),
        );
      }
      for (const match of source.matchAll(/^\s*\[([^\]\n]+)\]:\s+(\S+)/gmu)) {
        collectSkillLinkTarget(
          sourceFile,
          (match[1] ?? "").trim(),
          localMarkdownPath(markdownDestination(match[2] ?? "")),
        );
      }
    }

    assert.deepEqual(
      misleadingSkillLinks,
      [],
      "local links to generated SKILL.md files should use the target skill id as the visible label",
    );
  });

  test("skill reference markdown links to packaged assets only when the asset is registered", () => {
    const skillSourceRoot = join(repoRoot, "src/components/skills");
    const missingAssetLinks: string[] = [];
    const unregisteredAssetLinks: string[] = [];
    const assetTargetsBySkill = new Map<string, Set<string>>();

    for (const skill of registry.skills) {
      const targets = new Set<string>();
      for (const asset of skill.assets ?? []) {
        const target = asset.target ?? `assets/${basename(asset.source instanceof URL ? fileURLToPath(asset.source) : asset.source)}`;
        targets.add(target);
      }
      assetTargetsBySkill.set(skill.id, targets);
    }

    const referenceMarkdownSources = collectFiles(skillSourceRoot, (file) =>
      file.endsWith(".md") && file.split(/[\\/]/).includes("references"),
    );

    for (const sourceFile of referenceMarkdownSources) {
      const source = stripMarkdownCode(readFileSync(sourceFile, "utf-8"));
      const relativeSourceFile = relative(repoRoot, sourceFile);
      const skillId = relative(skillSourceRoot, sourceFile).split(/[\\/]/)[0];
      const assetTargets = assetTargetsBySkill.get(skillId) ?? new Set<string>();
      const collectAssetLinkTarget = (targetPath: string | null): void => {
        if (!targetPath || !targetPath.startsWith("../assets/")) return;

        const absoluteTarget = resolve(dirname(sourceFile), targetPath);
        const packagedTarget = targetPath.replace(/^\.\.\/assets\//u, "assets/");
        if (!existsSync(absoluteTarget)) {
          missingAssetLinks.push(`${relativeSourceFile}: ${targetPath}`);
        }
        if (!assetTargets.has(packagedTarget)) {
          unregisteredAssetLinks.push(`${relativeSourceFile}: ${targetPath}`);
        }
      };

      for (const match of source.matchAll(/(!?)\[[^\]\n]+\]\(([^)\n]+)\)/gu)) {
        if (match[1] === "!") continue;
        collectAssetLinkTarget(localMarkdownPath(markdownDestination(match[2] ?? "")));
      }

      for (const match of source.matchAll(/^\s*\[[^\]\n]+\]:\s+(\S+)/gmu)) {
        collectAssetLinkTarget(localMarkdownPath(markdownDestination(match[1] ?? "")));
      }
    }

    assert.deepEqual(missingAssetLinks, [], "reference Markdown should not link to missing skill assets");
    assert.deepEqual(unregisteredAssetLinks, [], "linked skill assets must be registered through defineAsset");
  });

  test("skill markdown sources keep same-file heading anchors valid", () => {
    const brokenAnchors: string[] = [];
    const skillMarkdownSources = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(".md") && !file.split(/[\\/]/).includes("evals"),
    );

    for (const sourceFile of skillMarkdownSources) {
      const source = readFileSync(sourceFile, "utf-8");
      const headingSlugs = collectMarkdownAnchors(source);

      const sourceWithoutCodeFences = source.replace(/```[\s\S]*?```/gu, "");
      for (const match of sourceWithoutCodeFences.matchAll(/\[[^\]]+\]\((#[^)\s]+)\)/gu)) {
        const target = decodeMarkdownAnchor(match[1].slice(1)).toLowerCase();
        if (!headingSlugs.has(target)) {
          brokenAnchors.push(`${relative(repoRoot, sourceFile)}: missing #${target}`);
        }
      }
    }

    assert.deepEqual(
      brokenAnchors,
      [],
      "same-file markdown anchors should match generated heading slugs",
    );
  });

  test("skill markdown sources keep cross-file heading anchors valid", () => {
    const brokenAnchors: string[] = [];
    const anchorCache = new Map<string, Set<string>>();
    const skillMarkdownSources = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(".md") && !file.split(/[\\/]/).includes("evals"),
    );

    const checkHref = (sourceFile: string, rawHref: string): void => {
      const href = markdownDestination(rawHref);
      if (!href.includes("#") || /^[a-z][a-z0-9+.-]*:/iu.test(href) || href.startsWith("#")) return;

      const hashIndex = href.indexOf("#");
      const anchor = href.slice(hashIndex + 1);
      const targetPath = localMarkdownPath(href);
      if (!targetPath || !anchor) return;

      const targetFile = resolve(dirname(sourceFile), targetPath);
      if (!existsSync(targetFile) || extname(targetFile) !== ".md") return;

      let targetAnchors = anchorCache.get(targetFile);
      if (!targetAnchors) {
        targetAnchors = collectMarkdownAnchors(readFileSync(targetFile, "utf-8"));
        anchorCache.set(targetFile, targetAnchors);
      }

      const target = decodeMarkdownAnchor(anchor).toLowerCase();
      if (!targetAnchors.has(target)) {
        brokenAnchors.push(`${relative(repoRoot, sourceFile)}: ${href} missing #${target}`);
      }
    };

    for (const sourceFile of skillMarkdownSources) {
      const sourceWithoutCodeFences = stripMarkdownCode(readFileSync(sourceFile, "utf-8"));
      for (const match of sourceWithoutCodeFences.matchAll(/!?\[[^\]\n]*\]\(([^)\n]+)\)/gu)) {
        checkHref(sourceFile, match[1] as string);
      }
      for (const match of sourceWithoutCodeFences.matchAll(/^\s*\[([^\]\n]+)\]:\s+([^\n]+)$/gmu)) {
        const label = (match[1] ?? "").trim();
        if (label.startsWith("^")) continue;
        checkHref(sourceFile, match[2] as string);
      }
    }

    assert.deepEqual(
      brokenAnchors,
      [],
      "cross-file markdown anchors should match generated heading slugs or explicit HTML anchors",
    );
  });

  test("procedure references use generated command tables instead of pseudo shell syntax", () => {
    const componentRuntimeDocs = [
      ...collectFiles(
        join(repoRoot, "src/components/skills"),
        (file) => (file.endsWith(".ts") || file.endsWith(".md")) && !file.split(/[\\/]/).includes("evals"),
      ),
      ...collectFiles(
        join(repoRoot, "src/components/agents"),
        (file) => (file.endsWith(".ts") || file.endsWith(".md")) && !file.split(/[\\/]/).includes("evals"),
      ),
    ];
    const pseudoProcedureReferences: string[] = [];
    const pseudoProcedurePattern = /`procedure\s+[a-z0-9-]+(?:\s[^`]*)?`|\bprocedure\s+`[a-z0-9-]+`/g;

    for (const sourceFile of componentRuntimeDocs) {
      const source = readFileSync(sourceFile, "utf-8");
      for (const match of source.matchAll(pseudoProcedurePattern)) {
        pseudoProcedureReferences.push(`${relative(repoRoot, sourceFile)}: ${match[0]}`);
      }
    }

    assert.deepEqual(
      pseudoProcedureReferences,
      [],
      "procedure ids should be referenced as `<id> procedure`; runnable commands come from generated Procedure 调用说明",
    );
  });

  test("source skill script commands are backed by registered procedure targets", () => {
    const proceduresBySkillAndTarget = new Set(
      registry.procedures.flatMap((procedure) =>
        (procedure.owners.skillIds ?? []).map((skillId) => `${skillId}:${procedure.target ?? ""}`)
      ),
    );
    const unmappedScriptCommands: string[] = [];
    const skillSourceRoot = join(repoRoot, "src/components/skills");
    const scriptCommandPattern = /\bnode\s+(?:\.\/)?scripts\/([A-Za-z0-9._/-]+\.mjs)\b/gu;

    for (const sourceFile of collectFiles(
      skillSourceRoot,
      (file) => file.endsWith(".md") && !file.split(/[\\/]/).includes("evals"),
    )) {
      const relativeSource = relative(skillSourceRoot, sourceFile);
      const skillId = relativeSource.split(/[\\/]/)[0];
      if (!skillId) continue;
      const source = readFileSync(sourceFile, "utf-8");
      for (const match of source.matchAll(scriptCommandPattern)) {
        const target = `scripts/${match[1]}`;
        if (!proceduresBySkillAndTarget.has(`${skillId}:${target}`)) {
          unmappedScriptCommands.push(`${relative(repoRoot, sourceFile)}: ${match[0]}`);
        }
      }
    }

    assert.deepEqual(
      unmappedScriptCommands,
      [],
      "source skill Markdown may use short node scripts commands only when emitSkill can rewrite them to owned procedures",
    );
  });

});
