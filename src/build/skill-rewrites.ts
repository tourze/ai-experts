import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import type {
  Platform as PlatformType,
  ProcedureDefinition,
  SkillDefinition,
} from "../components/sdk";
import { collectFiles } from "./core";
import { listProcedureUses, procedureUseAppliesToPlatform } from "./procedure-uses";
import {
  procedureRuntimePath,
  procedureRuntimeRoot,
  skillRuntimeRoot,
} from "./skill-runtime";

function markdownRelativePath(fromFile: string, toFile: string): string {
  return relative(dirname(fromFile), toFile).split("\\").join("/");
}

function replaceMarkdownOutsideCode(
  source: string,
  pattern: RegExp,
  replacer: (match: string, ...captures: string[]) => string,
): string {
  const rewritePlainMarkdown = (plainSource: string): string => {
    const rewriteOutsideInlineCode = (segment: string): string =>
      segment.replace(pattern, (...args: unknown[]) => {
        const [match, ...rest] = args;
        const captures = rest
          .slice(0, -2)
          .map((capture) => capture === undefined ? "" : String(capture));
        return replacer(String(match), ...captures);
      });

    let result = "";
    let cursor = 0;
    const inlineCodePattern = /`[^`\n]*`/gu;
    for (const match of plainSource.matchAll(inlineCodePattern)) {
      const index = match.index ?? 0;
      result += rewriteOutsideInlineCode(plainSource.slice(cursor, index));
      result += match[0];
      cursor = index + match[0].length;
    }
    result += rewriteOutsideInlineCode(plainSource.slice(cursor));
    return result;
  };

  let result = "";
  let cursor = 0;
  const fencedCodePattern = /(^|\n)[ \t]{0,3}(```+|~~~+)[^\n]*\n[\s\S]*?\n[ \t]{0,3}\2[ \t]*(?=\n|$)/gu;
  for (const match of source.matchAll(fencedCodePattern)) {
    const index = match.index ?? 0;
    result += rewritePlainMarkdown(source.slice(cursor, index));
    result += match[0];
    cursor = index + match[0].length;
  }
  result += rewritePlainMarkdown(source.slice(cursor));
  return result;
}

function rewriteReferenceSkillLinks(
  source: string,
  skill: SkillDefinition,
  outputFile: string,
  skillRoot: string,
  platformSkillIds: ReadonlySet<string>,
): string {
  return replaceMarkdownOutsideCode(
    source,
    /\[([^\]]+)\]\((\.{1,2}\/[^)\s]+\/SKILL\.md)(#[^)]+)?\)/gu,
    (match, label: string, href: string, anchor = "") => {
      const originalTarget = join(dirname(outputFile), href);
      if (existsSync(originalTarget)) return match;

      const targetSkillId = href.match(/(?:^|\/)([a-z0-9]+(?:-[a-z0-9]+)*)\/SKILL\.md$/u)?.[1];
      if (!targetSkillId) return match;

      if (targetSkillId === skill.id) {
        return `[${label}](${markdownRelativePath(outputFile, join(skillRoot, "SKILL.md"))}${anchor})`;
      }

      const localReference = join(skillRoot, "references", `${targetSkillId}.md`);
      if (existsSync(localReference)) {
        return `[${label}](${markdownRelativePath(outputFile, localReference)}${anchor})`;
      }

      if (platformSkillIds.has(targetSkillId)) {
        const skillsRoot = dirname(skillRoot);
        const target = join(skillsRoot, targetSkillId, "SKILL.md");
        return `[${label}](${markdownRelativePath(outputFile, target)}${anchor})`;
      }

      return label;
    },
  );
}

function isLocalMarkdownHref(href: string): boolean {
  return !/^[a-z][a-z0-9+.-]*:/iu.test(href) &&
    !href.startsWith("#") &&
    !href.startsWith("/") &&
    href.trim() !== "";
}

function splitMarkdownHref(href: string): { path: string; anchor: string } {
  const hashIndex = href.indexOf("#");
  if (hashIndex < 0) return { path: href, anchor: "" };
  return {
    path: href.slice(0, hashIndex),
    anchor: href.slice(hashIndex),
  };
}

function rewriteReferenceLocalLinks(
  source: string,
  outputFile: string,
  skillRoot: string,
): string {
  return replaceMarkdownOutsideCode(
    source,
    /(?<!!)\[([^\]]+)\]\(([^)\s]+)\)/gu,
    (match, label: string, href: string) => {
      if (!isLocalMarkdownHref(href)) return match;

      const { path: hrefPath, anchor } = splitMarkdownHref(href);
      if (!hrefPath) return match;
      if (hrefPath === "SKILL.md" || hrefPath.endsWith("/SKILL.md")) return match;

      const rewriteDirectoryTarget = (targetPath: string): string | null => {
        if (!statSync(targetPath).isDirectory()) return null;
        const indexTarget = join(targetPath, "index.md");
        if (!existsSync(indexTarget)) return null;
        return `[${label}](${markdownRelativePath(outputFile, indexTarget)}${anchor})`;
      };

      const currentTarget = join(dirname(outputFile), hrefPath);
      if (existsSync(currentTarget)) {
        return rewriteDirectoryTarget(currentTarget) ?? match;
      }

      const skillRootTarget = join(skillRoot, hrefPath);
      if (existsSync(skillRootTarget)) {
        const directoryRewrite = rewriteDirectoryTarget(skillRootTarget);
        if (directoryRewrite) return directoryRewrite;
        return `[${label}](${markdownRelativePath(outputFile, skillRootTarget)}${anchor})`;
      }

      const referenceTarget = join(skillRoot, "references", hrefPath.replace(/^(\.\.\/)+/u, ""));
      if (existsSync(referenceTarget)) {
        const directoryRewrite = rewriteDirectoryTarget(referenceTarget);
        if (directoryRewrite) return directoryRewrite;
        return `[${label}](${markdownRelativePath(outputFile, referenceTarget)}${anchor})`;
      }

      return label;
    },
  );
}

function procedureByScriptTarget(
  skill: SkillDefinition,
  platform: PlatformType,
  proceduresById: ReadonlyMap<string, ProcedureDefinition>,
): ReadonlyMap<string, ProcedureDefinition> {
  const procedures = new Map<string, ProcedureDefinition>();
  const platformProcedureIds = new Set(
    listProcedureUses(skill)
      .filter((procedureUse) => procedureUseAppliesToPlatform(procedureUse, platform))
      .map((procedureUse) => procedureUse.id),
  );
  for (const procedure of proceduresById.values()) {
    if (!platformProcedureIds.has(procedure.id)) continue;
    if (!procedure.owners.skillIds?.includes(skill.id) || !procedure.target) continue;
    procedures.set(procedure.target, procedure);
  }
  return procedures;
}

function rewriteProcedureScriptCommands(
  source: string,
  skill: SkillDefinition,
  platform: PlatformType,
  proceduresByTarget: ReadonlyMap<string, ProcedureDefinition>,
): string {
  const needsArgsSeparator = (offset: number, match: string): boolean => {
    const rest = source.slice(offset + match.length);
    return /^[ \t]*(?:\\\r?\n|\S)/u.test(rest);
  };

  return source.replace(
    /\bnode\s+(?:\.\/)?scripts\/([A-Za-z0-9._/-]+\.mjs)\b/gu,
    (match, scriptPath: string, offset: number) => {
      const procedure = proceduresByTarget.get(`scripts/${scriptPath}`);
      if (!procedure) return match;
      const commandParts = [
        "node",
        procedureRuntimePath(platform),
        "--procedure-id",
        procedure.id,
        "--trigger-skill",
        skill.id,
      ];
      if (needsArgsSeparator(offset, match)) commandParts.push("--");
      return commandParts.join(" ");
    },
  );
}

function rewriteRuntimePlaceholders(source: string, platform: PlatformType): string {
  return source
    .replaceAll("<runtime-root>", procedureRuntimeRoot(platform))
    .replaceAll("<skills-dir>", skillRuntimeRoot(platform));
}

export function rewriteGeneratedSkillMarkdown(
  skill: SkillDefinition,
  skillRoot: string,
  platform: PlatformType,
  proceduresById: ReadonlyMap<string, ProcedureDefinition>,
  platformSkillIds: ReadonlySet<string>,
): void {
  const markdownFiles = collectFiles(skillRoot, (file) => file.endsWith(".md"));
  const proceduresByTarget = procedureByScriptTarget(skill, platform, proceduresById);

  for (const file of markdownFiles) {
    const source = readFileSync(file, "utf-8");
    const commandRewritten = rewriteRuntimePlaceholders(
      rewriteProcedureScriptCommands(
        source,
        skill,
        platform,
        proceduresByTarget,
      ),
      platform,
    );
    const rewritten = rewriteReferenceLocalLinks(
      rewriteReferenceSkillLinks(commandRewritten, skill, file, skillRoot, platformSkillIds),
      file,
      skillRoot,
    );
    if (rewritten !== source) writeFileSync(file, rewritten, "utf-8");
  }
}
