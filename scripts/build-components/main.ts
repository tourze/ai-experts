import { readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { collectFiles, parseArgs, Platform } from "./core.ts";
import { compileRegistry } from "./registry.ts";
import { emitPlatform, validateRegistry } from "./platform.ts";

export async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("Usage: node --import tsx/esm scripts/build-components.ts [--out-dir <dir>] [--check]");
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

    const stats = {
      claudeSkills: collectFiles(join(outDir, "claude", "skills")).filter((file) => basename(file) === "SKILL.md").length,
      codexSkills: collectFiles(join(outDir, "codex", "skills")).filter((file) => basename(file) === "SKILL.md").length,
      claudeAgents: collectFiles(join(outDir, "claude", "agents")).length,
      codexAgents: collectFiles(join(outDir, "codex", "agents")).length,
      claudeHooks: JSON.parse(readFileSync(join(outDir, "claude", "hooks", "manifest.json"), "utf-8")).hooks.length,
      codexHooks: JSON.parse(readFileSync(join(outDir, "codex", "hooks", "manifest.json"), "utf-8")).hooks.length,
    };
    console.log(
      `component build: claude skills=${stats.claudeSkills} agents=${stats.claudeAgents} hooks=${stats.claudeHooks} ` +
      `codex skills=${stats.codexSkills} agents=${stats.codexAgents} hooks=${stats.codexHooks} out=${outDir}`,
    );

    if (args.check) rmSync(outDir, { recursive: true, force: true });
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}
