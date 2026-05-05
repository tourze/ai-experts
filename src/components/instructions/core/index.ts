import { defineInstruction, Platform } from "../../sdk.js";

export const coreInstruction = defineInstruction({
  id: "core-ai-experts",
  title: "ai-experts Component Runtime",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./INSTRUCTION.body.md", import.meta.url),
  priority: 0,
});
