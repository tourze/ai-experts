import type { Platform as PlatformType } from "../components/sdk";
import { Platform } from "./core";

export function procedureRuntimePath(platform: PlatformType): string {
  return platform === Platform.Claude ? "~/.claude/procedures.js" : "~/.codex/procedures.js";
}

export function procedureRuntimeRoot(platform: PlatformType): string {
  return platform === Platform.Claude ? "~/.claude" : "~/.codex";
}

export function skillRuntimeRoot(platform: PlatformType): string {
  return platform === Platform.Claude ? "~/.claude/skills" : "~/.agents/skills";
}
