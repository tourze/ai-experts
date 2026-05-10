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


describe("component source procedure conventions", () => {
  test("code review assess procedures document required targets", () => {
    const assessCodeSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/code-review/assess-code.ts"),
      "utf-8",
    );
    assert.match(assessCodeSource, /flag:\s+"\[target\]"/u);
    assert.match(assessCodeSource, /Usage: assess-code <file-or-directory>/u);

    const assessTestsSource = readFileSync(
      join(repoRoot, "src/components/procedures/sources/code-review/assess-tests.ts"),
      "utf-8",
    );
    assert.match(assessTestsSource, /flag:\s+"\[test-directory\]"/u);
    assert.match(assessTestsSource, /Usage: assess-tests <test-directory>/u);
  });

  test("positional input procedures document their argv", () => {
    const expectations = [
      {
        file: "src/components/procedures/sources/icon-retrieval/search.ts",
        flags: ['flag: "[search_query]"', 'flag: "[topK]"'],
      },
      {
        file: "src/components/procedures/sources/architecture-reviewer/scan_codebase.ts",
        flags: ['flag: "[codebase]"'],
      },
      {
        file: "src/components/procedures/sources/web-performance-diagnosis/analyze.ts",
        flags: ['flag: "[file-or-directory]"'],
      },
      {
        file: "src/components/procedures/sources/i18n-localization/i18n_checker.ts",
        flags: ['flag: "[target]"'],
      },
      {
        file: "src/components/procedures/sources/model-first-reasoning/validate-model.ts",
        flags: ['flag: "[model_path]"'],
      },
      {
        file: "src/components/procedures/sources/agile-product-owner/user_story_generator.ts",
        flags: ['flag: "[mode]"', 'flag: "[capacity]"'],
      },
      {
        file: "src/components/procedures/sources/helm-chart-scaffolding/validate-chart.ts",
        flags: ['flag: "[chart_dir]"'],
      },
      {
        file: "src/components/procedures/sources/skills-prune-and-sync-readme/curate_skills.ts",
        flags: [
          'flag: "[command]"',
          'flag: "--repo-root"',
          'flag: "--format"',
          'flag: "--skills"',
          'flag: "--yes"',
          'flag: "--write"',
          'flag: "--check"',
        ],
      },
    ];

    for (const expectation of expectations) {
      const source = readFileSync(join(repoRoot, expectation.file), "utf-8");
      for (const flag of expectation.flags) {
        assert.match(source, new RegExp(flag.replaceAll("[", "\\[").replaceAll("]", "\\]"), "u"));
      }
    }
  });

  test("procedures with non-empty example argv declare params", () => {
    const procedureFiles = collectFiles(join(repoRoot, "src/components/procedures/sources"), (file) =>
      file.endsWith(".ts"),
    );
    const offenders: string[] = [];

    for (const file of procedureFiles) {
      const source = readFileSync(file, "utf-8");
      if (!source.includes("defineCliProcedure")) continue;

      const exampleMatch = /exampleArgs:\s*\{\s*args:\s*\[([\s\S]*?)\]/u.exec(source);
      const hasNonEmptyExampleArgs = Boolean(exampleMatch && exampleMatch[1].trim().length > 0);
      const hasParams = /\n\s*params:\s*\[/u.test(source);
      if (hasNonEmptyExampleArgs && !hasParams) {
        offenders.push(relative(repoRoot, file));
      }
    }

    assert.deepEqual(offenders, []);
  });

  test("procedure params expose non-empty display types", () => {
    const blankParamTypes = registry.procedures.flatMap((procedure) =>
      (procedure.params ?? [])
        .filter((param) => param.type.trim() === "")
        .map((param) => `${procedure.id}: ${param.flag}`)
    );

    assert.deepEqual(
      blankParamTypes,
      [],
      "procedure params with no value should be normalized to an explicit boolean display type",
    );
  });

  test("skill display names are user-facing labels", () => {
    const rawDisplayNames = registry.skills
      .filter((skill) => /^[a-z0-9]+(?:-[a-z0-9]+)+$/u.test(skill.fullName))
      .map((skill) => `${skill.id}: ${skill.fullName}`);

    assert.deepEqual(rawDisplayNames, [], "skill fullName should not be a raw kebab-case id");
  });

  test("skill reference ids do not shadow registered skill ids", () => {
    const skillIds = new Set(registry.skills.map((skill) => skill.id));
    const shadowedReferenceIds = registry.skills.flatMap((skill) =>
      (skill.references ?? [])
        .filter((reference) => skillIds.has(reference.id))
        .map((reference) => `${skill.id}: ${reference.id}`)
    );

    assert.deepEqual(
      shadowedReferenceIds,
      [],
      "reference ids are rendered as link labels, so they should not look like registered skill ids",
    );
  });

  test("workflow mentions of hyphenated skill ids are backed by relatedSkills", () => {
    const hyphenatedSkillIds = registry.skills
      .map((skill) => skill.id)
      .filter((skillId) => skillId.includes("-"));
    const missingRelatedSkills: string[] = [];
    const escapeRegex = (value: string): string => value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");

    for (const skill of registry.skills) {
      const relatedSkillIds = new Set((skill.relatedSkills ?? []).map((related) => related.id));
      const workflow = skill.workflow;
      const workflowText = [
        ...(workflow.steps ?? []).map((step) => step.label),
        ...(workflow.finalSteps ?? []).map((step) => step.label),
        ...(workflow.gates ?? []).flatMap((gate) => [gate.skill, gate.label, gate.checks]),
        ...(workflow.routes ?? []).flatMap((route) => [
          route.skill,
          route.checks,
          route.output,
          ...route.triggers,
        ]),
      ].join("\n");

      for (const targetSkillId of hyphenatedSkillIds) {
        if (targetSkillId === skill.id || relatedSkillIds.has(targetSkillId)) continue;
        const pattern = new RegExp(`(^|[^A-Za-z0-9_-])${escapeRegex(targetSkillId)}(?=$|[^A-Za-z0-9_-])`, "u");
        if (pattern.test(workflowText)) {
          missingRelatedSkills.push(`${skill.id}: workflow mentions ${targetSkillId}`);
        }
      }
    }

    assert.deepEqual(
      missingRelatedSkills,
      [],
      "workflow text that routes to another hyphenated skill should also declare relatedSkills",
    );
  });

  test("visible skill guidance mentions of hyphenated skill ids are backed by relatedSkills", () => {
    const hyphenatedSkillIds = registry.skills
      .map((skill) => skill.id)
      .filter((skillId) => skillId.includes("-"));
    const missingRelatedSkills: string[] = [];
    const escapeRegex = (value: string): string => value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
    const stripMarkdownLinkDestinations = (text: string): string =>
      text.replace(/\[([^\]]*)\]\((?:\\.|[^)])*\)/gu, "$1");

    for (const skill of registry.skills) {
      const relatedSkillIds = new Set((skill.relatedSkills ?? []).map((related) => related.id));
      const visibleGuidanceText = [
        skill.description,
        ...(skill.useCases ?? []),
        ...(skill.constraints ?? []),
        ...(skill.checklist ?? []),
        ...(skill.outputs?.items ?? []),
        skill.outputs?.body ?? "",
      ].map(stripMarkdownLinkDestinations).join("\n");

      for (const targetSkillId of hyphenatedSkillIds) {
        if (targetSkillId === skill.id || relatedSkillIds.has(targetSkillId)) continue;
        const pattern = new RegExp(`(^|[^A-Za-z0-9_-])${escapeRegex(targetSkillId)}(?=$|[^A-Za-z0-9_-])`, "u");
        if (pattern.test(visibleGuidanceText)) {
          missingRelatedSkills.push(`${skill.id}: guidance mentions ${targetSkillId}`);
        }
      }
    }

    assert.deepEqual(
      missingRelatedSkills,
      [],
      "visible skill guidance that routes to another hyphenated skill should also declare relatedSkills",
    );
  });

});
