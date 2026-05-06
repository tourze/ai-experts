import { defineInstruction, Platform } from "../../sdk";

export const globalPrinciplesInstruction = defineInstruction({
  id: "global-principles",
  title: "全局原则与中文输出",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./INSTRUCTION.body.md", import.meta.url),
  priority: 10,
});
