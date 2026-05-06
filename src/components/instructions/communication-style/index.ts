import { defineInstruction, Platform } from "../../sdk";

export const communicationStyleInstruction = defineInstruction({
  id: "communication-style",
  title: "沟通密度与结构化表达",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./INSTRUCTION.body.md", import.meta.url),
  priority: 40,
});
