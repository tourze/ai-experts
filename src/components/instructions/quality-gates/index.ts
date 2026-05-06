import { defineInstruction, Platform } from "../../sdk";

export const qualityGatesInstruction = defineInstruction({
  id: "quality-gates",
  title: "质量门禁与操作安全",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./INSTRUCTION.body.md", import.meta.url),
  priority: 30,
});
