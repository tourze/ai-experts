import { readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs, Platform } from "./core.ts";
import { compileRegistry } from "./registry.ts";
import { emitPlatform, validateRegistry } from "./platform.ts";
import type { BuildStats } from "./types.ts";

type PlatformManifest = {
  skills?: unknown;
  agents?: unknown;
  hooks?: unknown;
  procedures?: {
    items?: unknown;
  };
};

function itemCount(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function readPlatformManifest(outDir: string, platformDir: "claude" | "codex"): PlatformManifest {
  return JSON.parse(readFileSync(join(outDir, platformDir, "manifest.json"), "utf-8")) as PlatformManifest;
}

function collectStats(outDir: string): BuildStats {
  const claudeManifest = readPlatformManifest(outDir, "claude");
  const codexManifest = readPlatformManifest(outDir, "codex");
  return {
    claudeSkills: itemCount(claudeManifest.skills),
    codexSkills: itemCount(codexManifest.skills),
    claudeAgents: itemCount(claudeManifest.agents),
    codexAgents: itemCount(codexManifest.agents),
    claudeHooks: itemCount(claudeManifest.hooks),
    codexHooks: itemCount(codexManifest.hooks),
    claudeProcedures: itemCount(claudeManifest.procedures?.items),
    codexProcedures: itemCount(codexManifest.procedures?.items),
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
    const componentSurface = validateRegistry(registry);
    const outDir = args.check
      ? join(tmpdir(), `ai-experts-dist-check-${process.pid}-${Date.now()}`)
      : args.outDir;

    await emitPlatform(componentSurface, outDir, Platform.Claude);
    await emitPlatform(componentSurface, outDir, Platform.Codex);

    const stats = collectStats(outDir);
    console.log(
      `component build: claude skills=${stats.claudeSkills} agents=${stats.claudeAgents} ` +
      `hooks=${stats.claudeHooks} procedures=${stats.claudeProcedures} ` +
      `codex skills=${stats.codexSkills} agents=${stats.codexAgents} hooks=${stats.codexHooks} ` +
      `procedures=${stats.codexProcedures} out=${outDir}`,
    );

    if (args.check) rmSync(outDir, { recursive: true, force: true });
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}
