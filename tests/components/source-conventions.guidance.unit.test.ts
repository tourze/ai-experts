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


describe("component source guidance conventions", () => {
  test("component guidance only names registered skills as standalone skills", () => {
    const registeredSkillIds = new Set(registry.skills.map((skill) => skill.id));
    const unknownSkillMentions: string[] = [];

    for (const sourceFile of collectFiles(join(repoRoot, "src/components"))) {
      const source = readFileSync(sourceFile, "utf-8");
      for (const match of source.matchAll(/`([a-z0-9][a-z0-9-]+)`\s+skill\b/gu)) {
        const skillId = match[1] ?? "";
        if (!registeredSkillIds.has(skillId)) {
          unknownSkillMentions.push(`${relative(repoRoot, sourceFile)}: ${match[0]}`);
        }
      }
    }

    assert.deepEqual(
      unknownSkillMentions,
      [],
      "standalone skill mentions should point to registered skill ids; references should be named as references or flows",
    );
  });

  test("subagent-driven-development routes planner sources through relatedSkills", () => {
    const source = readFileSync(
      join(repoRoot, "src/components/skills/subagent-driven-development/index.ts"),
      "utf-8",
    );

    assert.doesNotMatch(
      source,
      /来自 `task-decomposer`、`feature-dev`、`persistent-planning`/,
      "planner-producing skills and references should not be listed as inline aliases",
    );
    assert.match(source, /return taskDecomposerSkill\.id;/);
    assert.match(source, /return featureDevSkill\.id;/);
  });

  test("related skill reasons are not duplicated in use cases or constraints", () => {
    const duplicatedReasons: string[] = [];

    for (const skill of registry.skills) {
      const relatedReasons = new Set((skill.relatedSkills ?? []).map((related) => related.reason.trim()));
      if (relatedReasons.size === 0) continue;

      for (const fieldName of ["useCases", "constraints"] as const) {
        for (const entry of skill[fieldName] ?? []) {
          if (relatedReasons.has(entry.trim())) {
            duplicatedReasons.push(`${skill.id}.${fieldName}: ${entry}`);
          }
        }
      }
    }

    assert.deepEqual(
      duplicatedReasons,
      [],
      "cross-skill routing should live in relatedSkills; useCases/constraints should describe local applicability and rules",
    );
  });

  test("related skill reasons only backtick registered skill ids", () => {
    const registeredSkillIds = new Set(registry.skills.map((skill) => skill.id));
    const invalidMentions: string[] = [];

    for (const skill of registry.skills) {
      for (const relatedSkill of skill.relatedSkills ?? []) {
        for (const match of relatedSkill.reason.matchAll(/`([a-z0-9]+(?:-[a-z0-9]+)+)`/gu)) {
          const id = match[1] ?? "";
          if (registeredSkillIds.has(id)) continue;

          const afterMention = relatedSkill.reason.slice((match.index ?? 0) + match[0].length);
          if (/^\s*(?:reference|参考|资料|模板)/iu.test(afterMention)) continue;

          invalidMentions.push(`${skill.id}: ${match[0]} in ${relatedSkill.reason}`);
        }
      }
    }

    assert.deepEqual(
      invalidMentions,
      [],
      "relatedSkills.reason should use backticks for registered skill ids; references should be named as references",
    );
  });

  test("skill creator viewer uses platform-neutral review wording", () => {
    const viewerSource = readFileSync(
      join(repoRoot, "src/components/skills/skill-creator/assets/eval-viewer/viewer.html"),
      "utf-8",
    );

    assert.doesNotMatch(viewerSource, /Claude Code|告诉 Claude|回到 Claude/u);
    assert.match(viewerSource, /回到当前 CLI 会话告诉代理/u);
  });

  test("skill author agent uses source component filenames for authoring", () => {
    const skillAuthorSource = readFileSync(join(repoRoot, "src/components/agents/skill-author/index.ts"), "utf-8");

    assert.match(skillAuthorSource, /index\.ts、references、assets、evals、Procedure 引用/);
    assert.match(skillAuthorSource, /registry\.generated\.skills\.ts/);
    assert.doesNotMatch(
      skillAuthorSource,
      /SKILL\.body\.md|src\/components\/skills\/<skill>\/` 下的 SKILL\.md|写 SKILL\.md 时|README 索引项|\[SKILL\.md \//u,
      "skill author should describe source component files instead of generated SKILL.md output",
    );
  });

  test("skill evaluator uses model-neutral knowledge wording", () => {
    const evaluatorSources = [
      join(repoRoot, "src/components/skills/skill-evaluator/index.ts"),
      ...collectFiles(join(repoRoot, "src/components/skills/skill-evaluator/references")),
    ];

    for (const sourceFile of evaluatorSources) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /Claude 已知|Claude 不具备|Claude 不知道|Claude 不会|向 Claude|为 Claude|Claude 肯定|Claude 确实/u,
        `${sourceFile} should use model-neutral skill evaluation wording`,
      );
    }
  });

  test("copied skill readmes do not self-identify as Claude-only skills", () => {
    const skillReadmes = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith("README.md"),
    );

    for (const readmeFile of skillReadmes) {
      const source = readFileSync(readmeFile, "utf-8");
      assert.doesNotMatch(
        source,
        /\bA Claude skill\b|\bClaude skill\b|目录内脚本的本地用法/u,
        `${readmeFile} should describe the component neutrally because README files are copied to both platforms`,
      );
      assert.doesNotMatch(
        source,
        /\bnode\s+(?:\.\/)?scripts\/[A-Za-z0-9._/-]+\.mjs\b/u,
        `${readmeFile} should use platform-level procedures instead of skill-local scripts because README files are copied to dist`,
      );
    }
  });

  test("AI collaboration examples include Codex when listing Claude Code and Cursor", () => {
    const skillSources = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(".md"),
    );

    for (const sourceFile of skillSources) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /Claude Code\s*\/\s*Cursor(?![^()\n]*Codex)/u,
        `${sourceFile} should include Codex in cross-platform AI collaboration examples`,
      );
    }
  });

  test("copied skill markdown uses model-neutral actor wording", () => {
    const actorSpecificGuidance: string[] = [];
    const skillSources = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(".md"),
    );
    const claudeActorPattern =
      /Claude 阅读|Claude 应|Claude 会|Claude 需要|向 Claude|让 Claude|告诉 Claude|为 Claude|\buse Claude for\b/iu;

    for (const sourceFile of skillSources) {
      const source = readFileSync(sourceFile, "utf-8");
      source.split("\n").forEach((line, index) => {
        if (claudeActorPattern.test(line)) {
          actorSpecificGuidance.push(`${relative(repoRoot, sourceFile)}:${index + 1}: ${line.trim()}`);
        }
      });
    }

    assert.deepEqual(
      actorSpecificGuidance,
      [],
      "copied skill Markdown should not use Claude as the runtime actor; use model-neutral wording",
    );
  });

  test("component workflow declarations use the shared workflow API", () => {
    const legacyWorkflowHelpers: string[] = [];
    const legacyWorkflowTableMentions: string[] = [];
    const legacyExecutionStepTerms: string[] = [];
    const componentSources = collectFiles(join(repoRoot, "src/components"), (file) =>
      file.endsWith(".ts") && !file.endsWith("sdk.ts"),
    );
    const workflowGuidanceSources = collectFiles(join(repoRoot, "src/components"), (file) =>
      /\.(?:ts|md)$/u.test(file) &&
      /[\\/]src[\\/]components[\\/](?:skills|agents)[\\/]/u.test(file) &&
      !file.split(/[\\/]/).includes("evals"),
    );

    for (const sourceFile of componentSources) {
      const source = readFileSync(sourceFile, "utf-8");
      if (/\bdefine(?:Agent|Skill)Workflow(?:Step|Gate|Route)?\b/u.test(source)) {
        legacyWorkflowHelpers.push(relative(repoRoot, sourceFile));
      }
      if (/门禁表|场景路由表|分场景路由/u.test(source)) {
        legacyWorkflowTableMentions.push(relative(repoRoot, sourceFile));
      }
    }

    for (const sourceFile of workflowGuidanceSources) {
      const source = readFileSync(sourceFile, "utf-8");
      if (/执行步骤/u.test(source)) {
        legacyExecutionStepTerms.push(relative(repoRoot, sourceFile));
      }
    }

    assert.deepEqual(
      legacyWorkflowHelpers,
      [],
      "component sources should use defineWorkflow* helpers so skills and agents share one workflow model",
    );
    assert.deepEqual(
      legacyWorkflowTableMentions,
      [],
      "component sources should model gates and routes through workflow nodes instead of describing legacy tables",
    );
    assert.deepEqual(
      legacyExecutionStepTerms,
      [],
      "skill and agent structured metadata should use shared workflow terminology instead of legacy execution-step wording",
    );
  });

  test("component guidance uses current skill ids instead of legacy expert routes", () => {
    const legacyExpertRoutes: string[] = [];
    const componentGuidanceFiles = collectFiles(join(repoRoot, "src/components"), (file) =>
      /\.(?:ts|md|ya?ml)$/u.test(file) && !basename(file).startsWith("registry.generated"),
    );
    const legacyExpertRoutePattern =
      /\b(?:android|database|mysql|pgsql|speckit|skill)-expert(?::[a-z0-9-]+|\/[a-z0-9-]+)?\b/u;

    for (const sourceFile of componentGuidanceFiles) {
      const source = readFileSync(sourceFile, "utf-8");
      const match = source.match(legacyExpertRoutePattern);
      if (match) {
        legacyExpertRoutes.push(`${relative(repoRoot, sourceFile)}: ${match[0]}`);
      }
    }

    assert.deepEqual(
      legacyExpertRoutes,
      [],
      "component guidance should reference current skill ids instead of legacy expert route names",
    );
  });

  test("cross-platform skill guidance does not recommend Claude Code without Codex", () => {
    const platformBiasedAdvice: string[] = [];

    for (const sourceFile of collectFiles(join(repoRoot, "src/components/skills"), (file) => file.endsWith(".md"))) {
      const source = readFileSync(sourceFile, "utf-8");
      source.split("\n").forEach((line, index) => {
        const trimmed = line.trimStart();
        if (trimmed.startsWith(">")) return;
        if (/\b(?:Use|使用|优先使用)\s+Claude Code\b/u.test(line) && !/\bCodex\b/u.test(line)) {
          platformBiasedAdvice.push(`${relative(repoRoot, sourceFile)}:${index + 1}: ${line.trim()}`);
        }
      });
    }

    assert.deepEqual(
      platformBiasedAdvice,
      [],
      "cross-platform skill Markdown may quote Claude Code, but operational advice should include Codex or use neutral wording",
    );
  });

  test("skill markdown sources do not use placeholder markdown links", () => {
    const skillMarkdownSources = collectFiles(join(repoRoot, "src/components/skills"), (file) =>
      file.endsWith(".md"),
    );

    for (const sourceFile of skillMarkdownSources) {
      const source = readFileSync(sourceFile, "utf-8");
      assert.doesNotMatch(
        source,
        /\]\(\{[^}\n]+\}\)/u,
        `${sourceFile} should render placeholder URLs as plain text instead of broken local markdown links`,
      );
    }
  });

});
