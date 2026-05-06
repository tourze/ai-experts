import { readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { collectFiles, parseArgs, Platform } from "./core.ts";
import { compileRegistry } from "./registry.ts";
import { emitPlatform, validateRegistry } from "./platform.ts";
import type { BuildStats } from "./types.ts";

type HookManifest = { hooks: unknown[] };

function countSkillMarkdownFiles(outDir: string, platformDir: "claude" | "codex"): number {
  return collectFiles(join(outDir, platformDir, "skills"))
    .filter((file) => basename(file) === "SKILL.md")
    .length;
}

function readHookCount(outDir: string, platformDir: "claude" | "codex"): number {
  const parsed = JSON.parse(readFileSync(join(outDir, platformDir, "hooks", "manifest.json"), "utf-8")) as HookManifest;
  return Array.isArray(parsed.hooks) ? parsed.hooks.length : 0;
}

function collectStats(outDir: string): BuildStats {
  return {
    claudeSkills: countSkillMarkdownFiles(outDir, "claude"),
    codexSkills: countSkillMarkdownFiles(outDir, "codex"),
    claudeAgents: collectFiles(join(outDir, "claude", "agents")).length,
    codexAgents: collectFiles(join(outDir, "codex", "agents")).length,
    claudeHooks: readHookCount(outDir, "claude"),
    codexHooks: readHookCount(outDir, "codex"),
  };
}

export async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("Usage: tsx src/build.ts [--out-dir <dir>] [--check]");
    return;
  }

  const { registry, tempDir } = await compileRegistry();
  try {
    const profileSurface = validateRegistry(registry);
    const outDir = args.check
      ? join(tmpdir(), `ai-experts-dist-check-${process.pid}-${Date.now()}`)
      : args.outDir;

    await emitPlatform(profileSurface, outDir, Platform.Claude);
    await emitPlatform(profileSurface, outDir, Platform.Codex);

    const stats = collectStats(outDir);
    console.log(
      `component build: claude skills=${stats.claudeSkills} agents=${stats.claudeAgents} hooks=${stats.claudeHooks} ` +
      `codex skills=${stats.codexSkills} agents=${stats.codexAgents} hooks=${stats.codexHooks} out=${outDir}`,
    );

    if (args.check) rmSync(outDir, { recursive: true, force: true });
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}
