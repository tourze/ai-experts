import { defineHook, HookEvent, KnownTool, Platform } from "../../sdk";

export const tauriEnvDetectorHook = defineHook({
  id: "tauri-env-detector",
  description: "Converted component hook.",
  platforms: [Platform.Claude, Platform.Codex],
  event: HookEvent.SessionStart,
  entry: new URL("./tauri-env-detector.mjs", import.meta.url),
  order: 100,
  timeoutSeconds: 10,
  payloadMode: "claude-raw",
});
